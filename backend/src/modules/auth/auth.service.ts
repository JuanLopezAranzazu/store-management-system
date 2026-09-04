import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";

export class AuthError extends Error {}

export async function validateCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.active) {
    throw new AuthError("Credenciales inválidas.");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw new AuthError("Credenciales inválidas.");
  }

  return user;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}
