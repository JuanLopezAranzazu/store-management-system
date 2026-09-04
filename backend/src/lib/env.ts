import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3333),
  databaseUrl: required("DATABASE_URL"),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
};
