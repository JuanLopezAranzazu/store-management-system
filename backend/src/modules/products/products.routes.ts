import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate, authorize } from "../../middleware/auth";
import {
  MAX_IMAGES_PER_PRODUCT,
  UploadError,
  deleteProductImageFile,
  saveProductImage,
} from "../../utils/upload";

const productSchema = z.object({
  sku: z.string().min(1, "El SKU es requerido"),
  name: z.string().min(2, "El nombre es requerido"),
  description: z.string().optional().nullable(),
  price: z.coerce.number().nonnegative("El precio debe ser mayor o igual a 0"),
  cost: z.coerce.number().nonnegative().optional().nullable(),
  stock: z.coerce.number().int().nonnegative().default(0),
  minStock: z.coerce.number().int().nonnegative().default(0),
  categoryId: z.string().uuid("Categoría inválida"),
  active: z.boolean().optional(),
});

const productInclude = {
  category: true,
  images: { orderBy: { position: "asc" as const } },
};

export async function productsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  // Listado con búsqueda, filtro por categoría y paginación
  app.get("/products", async (request, reply) => {
    const query = request.query as {
      search?: string;
      categoryId?: string;
      active?: string;
      page?: string;
      pageSize?: string;
    };

    const page = Math.max(Number(query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize ?? 20), 1), 100);

    const where = {
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" as const } },
              { sku: { contains: query.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.active !== undefined ? { active: query.active === "true" } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return reply.send({
      items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  });

  app.get("/products/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
    if (!product) {
      return reply.status(404).send({ message: "Producto no encontrado." });
    }
    return reply.send(product);
  });

  // ADMIN y STAFF pueden crear/editar productos (operación del día a día)
  app.post("/products", { preHandler: [authorize("ADMIN", "STAFF")] }, async (request, reply) => {
    const parsed = productSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: "Datos inválidos", errors: parsed.error.flatten() });
    }

    const existingSku = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
    if (existingSku) {
      return reply.status(409).send({ message: "Ya existe un producto con ese SKU." });
    }

    const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
    if (!category) {
      return reply.status(400).send({ message: "La categoría indicada no existe." });
    }

    const product = await prisma.product.create({ data: parsed.data, include: productInclude });
    return reply.status(201).send(product);
  });

  app.put("/products/:id", { preHandler: [authorize("ADMIN", "STAFF")] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = productSchema.partial().safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: "Datos inválidos", errors: parsed.error.flatten() });
    }

    if (parsed.data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
      if (!category) {
        return reply.status(400).send({ message: "La categoría indicada no existe." });
      }
    }

    try {
      const product = await prisma.product.update({
        where: { id },
        data: parsed.data,
        include: productInclude,
      });
      return reply.send(product);
    } catch {
      return reply.status(404).send({ message: "Producto no encontrado." });
    }
  });

  // Eliminar producto: solo ADMIN
  app.delete("/products/:id", { preHandler: [authorize("ADMIN")] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const product = await prisma.product.findUnique({ where: { id }, include: { images: true } });
    if (!product) {
      return reply.status(404).send({ message: "Producto no encontrado." });
    }

    for (const image of product.images) {
      deleteProductImageFile(image.url);
    }

    await prisma.product.delete({ where: { id } });
    return reply.status(204).send();
  });

  // Subida de imágenes (máximo 5 por producto en total)
  app.post(
    "/products/:id/images",
    { preHandler: [authorize("ADMIN", "STAFF")] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const product = await prisma.product.findUnique({ where: { id }, include: { images: true } });
      if (!product) {
        return reply.status(404).send({ message: "Producto no encontrado." });
      }

      const parts = request.files({ limits: { files: MAX_IMAGES_PER_PRODUCT } });
      const uploadedUrls: string[] = [];
      let nextPosition = product.images.length;

      try {
        for await (const part of parts) {
          if (product.images.length + uploadedUrls.length >= MAX_IMAGES_PER_PRODUCT) {
            return reply.status(400).send({
              message: `Un producto admite máximo ${MAX_IMAGES_PER_PRODUCT} imágenes. Elimina alguna antes de subir más.`,
            });
          }
          const url = await saveProductImage(part);
          uploadedUrls.push(url);
        }
      } catch (err) {
        if (err instanceof UploadError) {
          return reply.status(400).send({ message: err.message });
        }
        throw err;
      }

      if (uploadedUrls.length === 0) {
        return reply.status(400).send({ message: "No se recibió ninguna imagen." });
      }

      const images = await prisma.$transaction(
        uploadedUrls.map((url, index) =>
          prisma.productImage.create({
            data: { productId: id, url, position: nextPosition + index },
          })
        )
      );

      return reply.status(201).send(images);
    }
  );

  // Eliminar una imagen puntual del producto
  app.delete(
    "/products/:id/images/:imageId",
    { preHandler: [authorize("ADMIN", "STAFF")] },
    async (request, reply) => {
      const { id, imageId } = request.params as { id: string; imageId: string };

      const image = await prisma.productImage.findFirst({ where: { id: imageId, productId: id } });
      if (!image) {
        return reply.status(404).send({ message: "Imagen no encontrada." });
      }

      deleteProductImageFile(image.url);
      await prisma.productImage.delete({ where: { id: imageId } });

      return reply.status(204).send();
    }
  );
}
