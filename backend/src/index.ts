import { buildApp } from "./app";
import { env } from "./lib/env";

const app = buildApp();

app
  .listen({ port: env.port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`Servidor corriendo en http://localhost:${env.port}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
