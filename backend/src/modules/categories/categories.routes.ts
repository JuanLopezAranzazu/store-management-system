import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate, authorize } from "../../middleware/auth";

const categorySchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  description: z.string().optional().nullable(),
});

export async function categoriesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  // Lectura: ADMIN y STAFF
  app.get("/categories", async (_request, reply) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return reply.send(categories);
  });

  app.get("/categories/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return reply.status(404).send({ message: "Categoría no encontrada." });
    }
    return reply.send(category);
  });

  // Escritura: solo ADMIN
  app.post("/categories", { preHandler: [authorize("ADMIN")] }, async (request, reply) => {
    const parsed = categorySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: "Datos inválidos", errors: parsed.error.flatten() });
    }

    const existing = await prisma.category.findUnique({ where: { name: parsed.data.name } });
    if (existing) {
      return reply.status(409).send({ message: "Ya existe una categoría con ese nombre." });
    }

    const category = await prisma.category.create({ data: parsed.data });
    return reply.status(201).send(category);
  });

  app.put("/categories/:id", { preHandler: [authorize("ADMIN")] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = categorySchema.partial().safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: "Datos inválidos", errors: parsed.error.flatten() });
    }

    try {
      const category = await prisma.category.update({ where: { id }, data: parsed.data });
      return reply.send(category);
    } catch {
      return reply.status(404).send({ message: "Categoría no encontrada." });
    }
  });

  app.delete("/categories/:id", { preHandler: [authorize("ADMIN")] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return reply.status(400).send({
        message: `No se puede eliminar: ${productsCount} producto(s) usan esta categoría.`,
      });
    }

    try {
      await prisma.category.delete({ where: { id } });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ message: "Categoría no encontrada." });
    }
  });
}
