# Backend API

Backend REST desarrollado con **Fastify**, **TypeScript**, **Prisma**, **PostgreSQL** y **Zod**.

La API proporciona autenticación y operaciones para la gestión de usuarios, categorías y productos.

## Tecnologías

* **Fastify** — Framework web para Node.js
* **TypeScript** — Tipado estático
* **Prisma** — ORM para PostgreSQL
* **PostgreSQL** — Base de datos relacional
* **Zod** — Validación de datos
* **JWT** — Autenticación basada en tokens
* **pnpm** — Gestor de paquetes

## Requisitos

* Node.js 20+
* pnpm
* PostgreSQL
* Git

## Instalación

Clona el repositorio:

```bash
git clone https://github.com/JuanLopezAranzazu/store-management-system.git
```

Ingresa al proyecto:

```bash
cd backend
```

Instala las dependencias:

```bash
pnpm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Cadena de conexión a PostgreSQL
DATABASE_URL=

# Puerto del servidor
PORT=3333

# Origen permitido para CORS (URL del frontend)
CORS_ORIGIN=

# Secreto para firmar los JWT
JWT_SECRET=

# Tiempo de expiración del token
JWT_EXPIRES_IN=
```

## Base de datos

El proyecto utiliza **Prisma** como ORM para gestionar la comunicación con PostgreSQL.

### Generar Prisma Client

```bash
pnpm prisma:generate
```

### Crear y ejecutar migraciones

Durante el desarrollo:

```bash
pnpm prisma:migrate
```

También puedes especificar un nombre para la migración:

```bash
pnpm prisma:migrate --name nombre-migracion
```

### Aplicar migraciones en producción

```bash
pnpm prisma:deploy
```

### Abrir Prisma Studio

```bash
pnpm prisma:studio
```

### Ejecutar seed

Para insertar los datos iniciales de la aplicación:

```bash
pnpm seed
```

## Ejecución

### Desarrollo

Ejecuta el servidor en modo desarrollo utilizando `tsx` con recarga automática:

```bash
pnpm dev
```

### Producción

Primero compila el proyecto:

```bash
pnpm build
```

Luego inicia la aplicación:

```bash
pnpm start
```

El servidor estará disponible en:

```text
http://localhost:3333
```

## Autenticación

La API utiliza **JWT (JSON Web Token)** para la autenticación.

El flujo general es:

```text
POST /auth/login
       │
       ▼
   Credenciales
       │
       ▼
    JWT Token
       │
       ▼
Authorization: Bearer <token>
       │
       ▼
 Rutas protegidas
```

Las rutas que requieren autenticación deben recibir el token mediante el header:

```http
Authorization: Bearer <token>
```

## Validación

La API utiliza **Zod** para validar los datos recibidos en las solicitudes.

Ejemplo:

```ts
const createProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  minStock: z.number().int().nonnegative(),
});
```

La validación permite garantizar que los datos cumplan con las reglas definidas antes de ser procesados por la aplicación.

## Scripts disponibles

| Comando                | Descripción                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `pnpm dev`             | Ejecuta el servidor en modo desarrollo con recarga automática |
| `pnpm build`           | Compila el proyecto TypeScript                                |
| `pnpm start`           | Ejecuta la aplicación compilada                               |
| `pnpm prisma:generate` | Genera Prisma Client                                          |
| `pnpm prisma:migrate`  | Crea y ejecuta migraciones en desarrollo                      |
| `pnpm prisma:deploy`   | Aplica las migraciones existentes                             |
| `pnpm prisma:studio`   | Abre Prisma Studio                                            |
| `pnpm seed`            | Ejecuta el script de datos iniciales                          |

## Códigos HTTP

| Código | Descripción                |
| ------ | -------------------------- |
| `200`  | Operación exitosa          |
| `201`  | Recurso creado             |
| `400`  | Solicitud inválida         |
| `401`  | No autenticado             |
| `403`  | Sin permisos               |
| `404`  | Recurso no encontrado      |
| `409`  | Conflicto                  |
| `500`  | Error interno del servidor |

## Build

El proyecto utiliza TypeScript para generar los archivos compilados en el directorio `dist/`.

```bash
pnpm build
```

La aplicación compilada se ejecuta mediante:

```bash
pnpm start
```

El comando `start` ejecuta el archivo:

```text
dist/index.js
```