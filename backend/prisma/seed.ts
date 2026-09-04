import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@store.com";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const hashed = await bcrypt.hash("Admin123!", 10);
    await prisma.user.create({
      data: {
        name: "Administrador",
        email: adminEmail,
        password: hashed,
        role: "ADMIN",
      },
    });
    console.log(`Usuario admin creado -> email: ${adminEmail} / password: Admin123!`);
  } else {
    console.log("El usuario admin ya existe, se omite creación.");
  }

  const categories = [
    { name: "General", description: "Categoría por defecto" },
    { name: "Electrónica", description: "Dispositivos y accesorios electrónicos" },
    { name: "Ropa", description: "Prendas de vestir" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log("Categorías base creadas/verificadas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
