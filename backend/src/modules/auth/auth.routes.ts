import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AuthError, validateCredentials } from "./auth.service";
import { authenticate } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: "Datos inválidos", errors: parsed.error.flatten() });
    }

    try {
      const user = await validateCredentials(parsed.data.email, parsed.data.password);

      const token = app.jwt.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      return reply.send({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.status(401).send({ message: err.message });
      }
      throw err;
    }
  });

  app.get("/auth/me", { preHandler: [authenticate] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.sub },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });

    if (!user) {
      return reply.status(404).send({ message: "Usuario no encontrado." });
    }

    return reply.send(user);
  });
}
