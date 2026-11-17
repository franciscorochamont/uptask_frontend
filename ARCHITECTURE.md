# Arquitectura — UpTask Frontend

Documento técnico del frontend de UpTask: stack, organización del código, flujos de datos y decisiones de diseño. Cubre exclusivamente la SPA; la API REST que consume es un servicio externo y no forma parte de este repositorio.

## 1. Alcance

UpTask es una aplicación para administrar proyectos y tareas. El frontend es una SPA que:

- Renderiza las vistas con React y React Router.
- Consume una API REST externa con Axios.
- Cachea el estado del servidor con React Query.
- Valida y tipa las respuestas con Zod.
- Maneja formularios con React Hook Form.
- Autentica al usuario con un JWT enviado en el header `Authorization: Bearer <token>`.

No hay código de servidor, base de datos ni lógica de negocio en este repositorio.

## 2. Diagrama de capas

```text
┌──────────────────────────────────────────────────────────┐
│                     Frontend (SPA)                       │
│                                                          │
│  React Router ──▶ layouts/ y views/                      │
│                        │                                 │
│                        ▼                                 │
│  React Query ──▶ hooks/ y mutaciones ──▶ api/            │
│                        │                    │            │
│                        ▼                    ▼            │
│  Zod (tipos) ◀── respuestas         lib/axios.ts         │
│                                                          │
└──────────────────────────────────┬───────────────────────┘
                                   │ HTTP + JWT
                                   ▼
                        API REST externa
```

Regla de dependencias: las vistas y componentes no llaman a Axios directamente; usan `api/` a través de hooks y mutaciones. Los tipos de la API viven en `types/` y se derivan de Zod.

## 3. Stack

### 3.1 Instalado

| Capa | Tecnología | Rol |
| --- | --- | --- |
| UI | React 19 + React DOM 19 | Componentes y renderizado. |
| Lenguaje | TypeScript 6 | Tipado estático. |
| Build | Vite 8 | Dev server, HMR y build. |
| Routing | React Router DOM 7 | Rutas y layouts anidados. |
| Estilos | Tailwind CSS 3 + PostCSS + Autoprefixer | Utilidades de estilo. |
| Componentes | Headless UI 2 | Popover, modales y transiciones accesibles. |
| Iconos | Heroicons 2 | Iconografía SVG. |
| Tipos Node | `@types/node` | Tipos para `vite.config.ts`. |
| Calidad | ESLint 10 + typescript-eslint | Reglas de linting. |

### 3.2 Previsto

| Capa | Tecnología | Rol |
| --- | --- | --- |
| Estado del servidor | TanStack React Query 5 + Devtools | Caché, `useQuery`, `useMutation`, invalidación. |
| HTTP | Axios | Instancia única configurada con `VITE_API_URL`. |
| Formularios | React Hook Form | Estado y validación de formularios. |
| Validación / tipos | Zod | Validar respuestas de la API e inferir tipos. |
| Notificaciones | react-toastify | Feedback de éxito y error. |
| PIN | `@chakra-ui/pin-input` | Confirmación de cuenta con token de 6 dígitos. |
| Tailwind | `@tailwindcss/forms` | Estilos base de inputs. |
| Drag & drop | `@dnd-kit/*` | Mover tareas entre columnas de estado. |

## 4. Organización del código

### 4.1 Estado actual

```text
src/
├── components/
│   ├── Logo.tsx
│   └── NavMenu.tsx
├── layout/
│   └── AppLayout.tsx
├── views/
│   └── DashboardView.tsx
├── index.css
├── main.tsx
└── router.tsx
```

### 4.2 Estructura objetivo

```text
src/
├── api/          # Una función por endpoint, agrupadas por recurso
│   ├── auth.ts
│   ├── projects.ts
│   ├── tasks.ts
│   └── team.ts
├── components/   # Formularios, modales y tarjetas
├── hooks/        # Hooks de dominio (useAuth, etc.)
├── layout/       # AppLayout (autenticado) y AuthLayout
├── lib/          # Instancia de Axios
├── locales/      # Traducción de estados de tareas
├── types/        # Esquemas Zod + tipos inferidos
├── utils/        # Utilidades (fechas, etc.)
├── views/        # Páginas de la aplicación
├── index.css
├── main.tsx
└── router.tsx
```

Responsabilidades:

- `api/`: funciones puras que reciben parámetros y devuelven promesas tipadas. No contienen JSX.
- `lib/`: infraestructura compartida, como la instancia de Axios.
- `types/`: esquemas de Zod y tipos inferidos; es el contrato tipado del frontend con la API.
- `hooks/`: lógica reutilizable de React (usuario actual, debounce, etc.).
- `layout/`: estructuras de página con `Outlet`.
- `views/`: páginas asociadas a una ruta.
- `components/`: piezas reutilizables (formularios, modales, tarjetas, badges).
- `locales/`: mapas de traducción (por ejemplo, estados de tareas).
- `utils/`: funciones auxiliares sin estado.

## 5. Routing y layouts

`src/router.tsx` centraliza las rutas con `BrowserRouter`:

```text
/                     → AppLayout → Dashboard (proyectos)
/projects/:id         → AppLayout → Detalle del proyecto (tareas)
/profile              → AppLayout → Perfil
/auth/login           → AuthLayout → Login
/auth/register        → AuthLayout → Registro
/auth/confirm-account → AuthLayout → Confirmar cuenta
/auth/forgot-password → AuthLayout → Olvidé mi contraseña
```

- `AppLayout`: header con logo y menú, `Outlet` y footer.
- `AuthLayout`: contenedor centrado para las pantallas de autenticación.

Rutas protegidas: `AppLayout` consulta el usuario actual (`useAuth`); si no hay sesión, redirige al login.

## 6. Capa de datos

### 6.1 React Query como fuente de verdad

No se usa Zustand ni Context para datos remotos. React Query cachea las respuestas y expone estados de carga y error.

Consulta:

```text
Componente → useQuery(["projects"]) → api/projects.getProjects() → Axios → API
                 │
                 └─ caché de React Query (datos, isLoading, isError)
```

Mutación:

```text
Formulario → useMutation(api.tasks.createTask)
           → onSuccess: invalidateQueries(["project", projectId, "tasks"])
           → React Query refetch → la vista se actualiza sola
           → toast de éxito / error
```

### 6.2 Claves de caché

Convención por recurso y por id:

| Recurso | Query key |
| --- | --- |
| Usuario actual | `["user"]` |
| Proyectos | `["projects"]` |
| Proyecto | `["project", projectId]` |
| Tareas del proyecto | `["project", projectId, "tasks"]` |
| Tarea | `["project", projectId, "task", taskId]` |
| Equipo del proyecto | `["project", projectId, "team"]` |

Tras una mutación se invalidan las claves afectadas; por ejemplo, crear o editar una tarea invalida las tareas del proyecto y el proyecto.

### 6.3 Cliente HTTP

`src/lib/axios.ts` exporta una instancia única:

```ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
```

Responsabilidades:

- Adjuntar el token JWT (`Authorization: Bearer <token>`) en cada petición autenticada.
- Centralizar el manejo de errores de red y de respuestas 4xx/5xx.
- Servir de base para los módulos de `src/api/`.

## 7. Tipado y validación

Zod se usa en dos frentes:

1. **Respuestas**: cada endpoint declara un esquema que valida la respuesta real de la API y de ahí se infiere el tipo de TypeScript (`z.infer`).
2. **Formularios**: React Hook Form valida la entrada; el esquema de Zod puede usarse como resolver para mantener una sola definición de reglas.

```text
API JSON ──Zod.safeParse──▶ datos tipados ──▶ componentes
Formulario ──RHF (+ Zod resolver)──▶ payload validado ──▶ mutación
```

Si la API cambia la forma de una respuesta, la validación falla de forma explícita en lugar de propagar datos inconsistentes.

## 8. Autenticación (cliente)

### 8.1 Flujos

1. **Registro**: el usuario envía sus datos; la cuenta queda pendiente de confirmación.
2. **Confirmación**: el usuario recibe un token de 6 dígitos por correo y lo introduce en un input tipo PIN.
3. **Login**: con credenciales válidas se obtiene un JWT.
4. **Sesión**: el JWT se envía en el header `Authorization: Bearer <token>`.
5. **Reset de contraseña**: el usuario solicita un token por correo, lo valida y define una nueva contraseña.

### 8.2 `useAuth`

Hook que obtiene el usuario actual desde la API. Se usa para:

- Saber si hay sesión activa.
- Redirigir a `/auth/login` cuando no la hay.
- Comparar el usuario con el `manager` de un proyecto para aplicar permisos en la UI.

### 8.3 Rutas protegidas

`AppLayout` consulta `useAuth`; sin usuario redirige al login. Las pantallas de autenticación viven en `AuthLayout`.

## 9. Autorización y roles en la interfaz

Cada proyecto tiene un `manager` (dueño) y un `team` (colaboradores). La API es la que autoriza las operaciones; el frontend replica la regla solo para **mostrar u ocultar acciones**, nunca como única defensa.

| Acción en la UI | manager | team |
| --- | --- | --- |
| Ver proyecto y tareas | Sí | Sí |
| Crear/editar/mover tareas | Sí | Sí |
| Editar proyecto | Sí | No |
| Eliminar proyecto | Sí | No |
| Agregar/quitar colaboradores | Sí | No |

La comprobación se hace comparando el id del usuario actual con el id del manager del proyecto.

## 10. Modales controlados por la URL

Crear, ver o editar una tarea abre un modal cuyo estado vive en la URL:

- `?newTask=true`
- `?taskId=<id>`
- `?editTask=<id>`

Se leen con `useLocation` y se modifican con `useNavigate`. Ventajas:

- El botón "atrás" del navegador cierra el modal.
- La URL es compartible y el estado es reproducible.
- No hace falta un store global para abrir/cerrar modales.

## 11. UI y estilos

- **Tailwind CSS 3** con configuración en `tailwind.config.js` (`content` incluye `index.html` y `src/**/*.{js,ts,jsx,tsx}`).
- **Headless UI 2** para menús y modales. En v2 las transiciones se declaran con la prop `transition` y variantes `data-[closed]` / `data-[leave]` en las clases; ya no se usa el componente `<Transition>` de la v1.
- **Heroicons** para iconografía.
- **react-toastify** (previsto) para notificaciones.
- Estados de tareas traducidos en `locales/`.

## 12. Configuración de TypeScript y Vite

### 12.1 Project references

`tsconfig.json` no contiene opciones propias: referencia dos configuraciones.

```text
tsconfig.json
├── tsconfig.app.json   → src/ (aplicación)
└── tsconfig.node.json  → vite.config.ts (entorno Node)
```

- `tsconfig.app.json`: `moduleResolution: bundler`, `jsx: react-jsx`, `noEmit`, `verbatimModuleSyntax`, `noUnusedLocals/Parameters`, `types: ["vite/client"]`.
- `tsconfig.node.json`: `module: nodenext`, `types: ["node"]` (por eso `@types/node` solo aplica al config de Vite).

### 12.2 Alias `@`

- `vite.config.ts`: `resolve.alias` con `@` → `./src` para runtime/build.
- `tsconfig.app.json`: `paths` para que TypeScript resuelva el alias.

En TypeScript 6 `baseUrl` está deprecado. La forma recomendada es declarar `paths` relativos al `tsconfig`:

```json
"paths": {
  "@/components/*": ["./src/components/*"]
}
```

Al agregar alias para otras carpetas, hay que actualizar ambos archivos.

## 13. Build y despliegue

### 13.1 Build

```bash
npm run build
```

Ejecuta `tsc -b` (verificación de tipos por proyecto) y luego `vite build`, que genera `dist/` con assets versionados.

### 13.2 Despliegue

- El frontend se despliega como sitio estático (`dist/`) en Vercel, Netlify o similar.
- `VITE_API_URL` debe apuntar a la URL pública de la API en el entorno de despliegue.
- Al ser una SPA con `BrowserRouter`, el hosting debe redirigir todas las rutas a `index.html`.
- El CORS y la disponibilidad de la API son responsabilidad del servicio externo.

## 14. Convenciones

- Imports con alias `@/...` y sin extensión.
- Un archivo por componente; export por defecto en vistas y layouts, named export en componentes compartidos cuando aplique.
- Tipos derivados de Zod; evitar tipos duplicados a mano.
- Acceso a la API solo a través de `src/api/` y `src/lib/axios.ts`.
- Invalidar queries tras cada mutación (no mutar la caché a mano salvo casos justificados).
- Manejo de errores con el mensaje devuelto por la API + toast.

## 15. Roadmap (frontend)

1. Rutas, layouts y vistas base.
2. React Query + Axios + tipos de la API.
3. Autenticación: registro, confirmación de cuenta, login y reset.
4. JWT: usuario actual, `useAuth`, rutas protegidas y proyectos por usuario.
5. Proyectos: dashboard, crear, editar, eliminar y detalle.
6. Tareas: CRUD, detalle, edición y cambio de estado.
7. Colaboradores: gestión de equipo y permisos en la interfaz.
8. Drag & drop de tareas con `dnd-kit`.
9. Deployment del frontend.

## 16. Decisiones técnicas

| Tema | Decisión en este proyecto |
| --- | --- |
| Estado remoto | React Query en lugar de Zustand/Context. |
| Sesión | JWT en el header `Authorization: Bearer`. |
| Tipado | Esquemas Zod como única fuente de tipos de la API. |
| Modales | Estado en la URL mediante query params. |
| Transiciones | Headless UI v2 (`transition` + `data-[closed]`) en lugar de la API v1 (`<Transition>`). |
| Alias TS | `paths` relativos al `tsconfig`; sin `baseUrl` (deprecado en TS 6). |
| Permisos | Solo control visual; la API es la que autoriza. |
