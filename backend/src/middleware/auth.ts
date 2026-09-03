import type { FastifyReply, FastifyRequest } from "fastify";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ message: "No autorizado. Token inválido o ausente." });
  }
}

export function authorize(...roles: Array<"ADMIN" | "STAFF">) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user || !roles.includes(user.role)) {
      return reply.status(403).send({ message: "No tienes permisos para realizar esta acción." });
    }
  };
}
