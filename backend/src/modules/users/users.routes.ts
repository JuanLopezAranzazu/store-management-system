import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate, authorize } from "../../middleware/auth";
import { hashPassword } from "../auth/auth.service";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
} as const;

export async function usersRoutes(app: FastifyInstance) {
  // Todas las rutas de este módulo requieren estar autenticado y ser ADMIN
  app.addHook("preHandler", authenticate);

  app.get("/users", { preHandler: [authorize("ADMIN")] }, async (_request, reply) => {
    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });
    return reply.send(users);
  });

  app.post("/users", { preHandler: [authorize("ADMIN")] }, async (request, reply) => {
    const parsed = createUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: "Datos inválidos", errors: parsed.error.flatten() });
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return reply.status(409).send({ message: "Ya existe un usuario con ese email." });
    }

    const hashed = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: { ...parsed.data, password: hashed },
      select: userSelect,
    });

    return reply.status(201).send(user);
  });

  app.put("/users/:id", { preHandler: [authorize("ADMIN")] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: "Datos inválidos", errors: parsed.error.flatten() });
    }

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.password) {
      data.password = await hashPassword(parsed.data.password);
    }

    try {
      const user = await prisma.user.update({ where: { id }, data, select: userSelect });
      return reply.send(user);
    } catch {
      return reply.status(404).send({ message: "Usuario no encontrado." });
    }
  });

  app.delete("/users/:id", { preHandler: [authorize("ADMIN")] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    if (id === request.user.sub) {
      return reply.status(400).send({ message: "No puedes eliminar tu propio usuario." });
    }

    try {
      await prisma.user.delete({ where: { id } });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ message: "Usuario no encontrado." });
    }
  });
}
