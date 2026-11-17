# UpTask — Frontend

Aplicación web para administrar proyectos y tareas con tableros estilo Trello. Este repositorio contiene **solo el frontend**: una SPA que consume una API REST externa.

> Proyecto del curso full stack. Los usuarios crean una cuenta, confirman su correo, inician sesión y administran proyectos con tareas, colaboradores y estados.

## Estado del proyecto

En desarrollo. La base del frontend ya está montada:

- Vite + React + TypeScript.
- Tailwind CSS configurado (PostCSS + Autoprefixer).
- React Router con un layout principal.
- Componentes `Logo` y `NavMenu` (Headless UI + Heroicons).
- Alias de importación `@` → `src`.
- ESLint configurado.

Pendiente según el avance del curso: React Query, Axios, formularios, autenticación, CRUD de proyectos y tareas, colaboradores, drag & drop y deployment.

## Funcionalidad objetivo

- Registro de usuario con confirmación de cuenta por correo.
- Inicio de sesión con JWT y restablecimiento de contraseña.
- CRUD de proyectos, con dashboard y detalle por proyecto.
- CRUD de tareas dentro de cada proyecto y cambio de estado.
- Colaboradores por proyecto con permisos según rol (`manager` vs `team`).
- Arrastrar y soltar tareas entre columnas de estado (`dnd-kit`).

## Stack

### Instalado actualmente

| Área | Tecnología | Versión |
| --- | --- | --- |
| UI | React + React DOM | `^19.3.1` |
| Lenguaje | TypeScript | `~6.0.3` |
| Build / dev server | Vite | `^8.3.6` |
| Routing | React Router DOM | `^7.18.5` |
| Estilos | Tailwind CSS + Autoprefixer + PostCSS | `^3.4.19` |
| Componentes UI | Headless UI | `^2.2.10` |
| Iconos | Heroicons | `^2.2.0` |
| Tipos Node | `@types/node` | `^24.19.2` |
| Linting | ESLint + typescript-eslint | `^10.14.0` |

### Previsto para el resto del curso

| Área | Tecnología |
| --- | --- |
| Estado del servidor | TanStack React Query (+ Devtools) |
| Cliente HTTP | Axios |
| Formularios | React Hook Form |
| Validación / tipos de API | Zod |
| Notificaciones | react-toastify |
| Código PIN (confirmación) | `@chakra-ui/pin-input` |
| Plugins Tailwind | `@tailwindcss/forms` |
| Drag & drop | `@dnd-kit/*` |

## Requisitos

- Node.js `^20.19.0` o `>=22.12.0` (requisito de Vite 8).
- npm.
- Una instancia de la API de UpTask disponible.

## Instalación y uso

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

### Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR. |
| `npm run build` | Verifica tipos (`tsc -b`) y genera el build de producción en `dist/`. |
| `npm run preview` | Sirve localmente el build de producción. |
| `npm run lint` | Ejecuta ESLint sobre el proyecto. |

## Variables de entorno

Se definen en `.env.local` (ignorado por Git):

```env
VITE_API_URL=http://localhost:4000/api
```

`VITE_API_URL` será la URL base que use Axios para todas las peticiones. Cualquier variable con prefijo `VITE_` queda expuesta en el bundle del cliente: no guardes secretos ahí.

## Estructura actual

```text
uptask_frontend/
├── public/
│   └── logo.svg
├── src/
│   ├── components/
│   │   ├── Logo.tsx
│   │   └── NavMenu.tsx
│   ├── layout/
│   │   └── AppLayout.tsx
│   ├── views/
│   │   └── DashboardView.tsx
│   ├── index.css
│   ├── main.tsx
│   └── router.tsx
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
└── tsconfig.node.json
```

## Estructura objetivo

```text
src/
├── api/          # Funciones que llaman a la API (proyectos, tareas, auth, equipo)
├── components/   # Formularios, modales y tarjetas reutilizables
├── hooks/        # Hooks de dominio (por ejemplo, useAuth)
├── layout/       # Layouts de la app autenticada y de las pantallas de auth
├── lib/          # Instancia configurada de Axios
├── locales/      # Traducciones de los estados de las tareas
├── types/        # Esquemas de Zod y tipos inferidos de la API
├── utils/        # Utilidades (por ejemplo, formateo de fechas)
├── views/        # Páginas (dashboard, proyecto, login, registro, etc.)
├── main.tsx
└── router.tsx
```

## Alias de importación

`@` apunta a `src`:

```tsx
import { NavMenu } from "@/components/NavMenu";
```

Se configura en dos lugares:

- `vite.config.ts` → `resolve.alias` (resolución en runtime y build).
- `tsconfig.app.json` → `compilerOptions.paths` (resolución para TypeScript).

En TypeScript 6 `baseUrl` está deprecado, por eso los `paths` se declaran relativos al `tsconfig`:

```json
"paths": {
  "@/components/*": ["./src/components/*"]
}
```

## Arquitectura

El frontend se organiza por capas: React Router define las vistas y layouts; las vistas consumen hooks y mutaciones de React Query; React Query usa las funciones de `src/api/`, que a su vez usan la instancia de Axios; Zod valida y tipa las respuestas. El detalle completo está en [ARCHITECTURE.md](./ARCHITECTURE.md).

## Documentación

- [ARCHITECTURE.md](./ARCHITECTURE.md): arquitectura del frontend, capas, flujos de datos, autenticación, permisos, convenciones y despliegue.

## Alcance

- Este repositorio no incluye código de servidor ni acceso a base de datos.
- La autenticación se maneja con un JWT que el frontend envía en el header `Authorization: Bearer <token>`.
- El CORS y la disponibilidad de la API son responsabilidad del servicio externo.
