# Frontend

Aplicación web desarrollada con **React**, **TypeScript**, **Vite**, **Tailwind CSS** y **shadcn/ui**.

El frontend proporciona una interfaz para la gestión de productos, categorías, usuarios e inventario, además de la autenticación de usuarios.

## Tecnologías

* **React** — Biblioteca para construir interfaces de usuario
* **TypeScript** — Tipado estático
* **Vite** — Herramienta de desarrollo y construcción
* **Tailwind CSS** — Framework CSS utility-first
* **shadcn/ui** — Componentes de interfaz reutilizables
* **React Router** — Gestión de rutas
* **TanStack Query** — Gestión de estado y datos provenientes de la API
* **Axios** — Cliente HTTP

## Requisitos

* Node.js 20+
* pnpm
* Git

## Instalación

Clona el repositorio:

```bash
git clone https://github.com/JuanLopezAranzazu/store-management-system.git
```

Ingresa al proyecto:

```bash
cd frontend
```

Instala las dependencias:

```bash
pnpm install
```

## Ejecución

### Desarrollo

Ejecuta el servidor de desarrollo:

```bash
pnpm dev
```

La aplicación estará disponible en:

```text
http://localhost:5173
```

### Producción

Genera la versión optimizada:

```bash
pnpm build
```

Para visualizar localmente la versión de producción:

```bash
pnpm preview
```

## UI y estilos

El proyecto utiliza **Tailwind CSS** para los estilos y **shadcn/ui** como sistema de componentes.

Los componentes reutilizables de shadcn/ui se encuentran en:

```text
src/components/ui/
```

Algunos de los componentes utilizados incluyen:

* `Button`
* `Card`
* `Input`
* `Badge`
* `Dialog`
* `DropdownMenu`
* `Table`

## Navegación

La aplicación utiliza rutas para separar las diferentes funcionalidades de la aplicación.

Entre las principales secciones se encuentran:

```text
/login
/dashboard
/products
/categories
/users
```

Las rutas pueden variar dependiendo de los permisos y del estado de autenticación del usuario.

## Autenticación

El frontend se comunica con el backend mediante una API REST.

El flujo de autenticación es:

```text
Usuario
   │
   ▼
Login
   │
   ▼
POST /auth/login
   │
   ▼
JWT
   │
   ▼
Estado de autenticación
   │
   ▼
Rutas protegidas
```

Las solicitudes a endpoints protegidos incluyen el token de autenticación:

```http
Authorization: Bearer <token>
```

## Gestión de datos

La aplicación utiliza **TanStack Query** para gestionar las solicitudes realizadas al backend.

Ejemplo:

```tsx
const { data, isLoading } = useQuery({
  queryKey: ["products"],
  queryFn: fetchProducts,
})
```

Esto permite gestionar:

* Solicitudes HTTP
* Estados de carga
* Errores
* Caché
* Revalidación de datos

## Comunicación con el backend

Las solicitudes HTTP se realizan mediante Axios.

Ejemplo:

```ts
const response = await api.get("/products")
```

La URL base de la API se obtiene desde:

```env
VITE_API_URL=http://localhost:3333
```

## Scripts disponibles

| Comando        | Descripción                              |
| -------------- | ---------------------------------------- |
| `pnpm dev`     | Inicia el servidor de desarrollo         |
| `pnpm build`   | Genera la versión de producción          |
| `pnpm preview` | Previsualiza la aplicación de producción |

## Build

Para generar los archivos optimizados para producción:

```bash
pnpm build
```

Los archivos generados estarán en:

```text
dist/
```

## Backend

Este frontend consume la API REST desarrollada con **Fastify**, **Prisma** y **PostgreSQL**.

La URL de la API se configura mediante:

```env
VITE_API_URL=http://localhost:3333
```