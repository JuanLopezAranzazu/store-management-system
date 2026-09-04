import path from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { env } from "./lib/env";
import jwtPlugin from "./plugins/jwt";
import { authRoutes } from "./modules/auth/auth.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { categoriesRoutes } from "./modules/categories/categories.routes";
import { productsRoutes } from "./modules/products/products.routes";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: env.corsOrigin,
    credentials: true,
  });

  app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB por imagen
      files: 5, // máximo 5 imágenes por producto
    },
  });

  app.register(fastifyStatic, {
    root: path.join(process.cwd(), "uploads"),
    prefix: "/uploads/",
  });

  app.register(jwtPlugin);

  app.get("/health", async () => ({ status: "ok" }));

  app.register(authRoutes, { prefix: "/api" });
  app.register(usersRoutes, { prefix: "/api" });
  app.register(categoriesRoutes, { prefix: "/api" });
  app.register(productsRoutes, { prefix: "/api" });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      message: statusCode === 500 ? "Error interno del servidor." : error.message,
    });
  });

  return app;
}
