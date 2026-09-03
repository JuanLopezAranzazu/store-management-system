import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./lib/env";
import jwtPlugin from "./plugins/jwt";
import { authRoutes } from "./modules/auth/auth.routes";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: env.corsOrigin,
    credentials: true,
  });

  app.register(jwtPlugin);

  app.get("/health", async () => ({ status: "ok" }));

  app.register(authRoutes, { prefix: "/api" });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      message: statusCode === 500 ? "Error interno del servidor." : error.message,
    });
  });

  return app;
}
