# Instrucciones de Copilot para MenuFlow

## Estructura del repositorio

MenuFlow es un espacio de trabajo con dos aplicaciones:

- `frontend/` es una aplicación Next.js 16 con App Router que utiliza React 19, TypeScript, Tailwind CSS, Radix UI, TanStack Query y autenticación mediante credenciales de NextAuth.
- `backend/` es una API NestJS 11 que utiliza PostgreSQL mediante Prisma 6, autenticación JWT/Passport, DTOs con class-validator, Swagger y módulos funcionales para restaurantes, ingredientes, recetas, menús, pagos, entregas y analítica.

Las aplicaciones tienen sus propios archivos `package.json` y archivos de bloqueo. Ejecuta los comandos desde el directorio al que pertenecen; el manifiesto de paquetes raíz no es el punto de entrada de los comandos de las aplicaciones.

## Comandos de compilación, pruebas y lint

### Frontend

Desde `frontend/`:

```bash
npm run dev       # Servidor de desarrollo de Next en http://localhost:3000
npm run build     # Compilación de producción y validación de tipos
npm run start     # Sirve una compilación de producción completada
npm run lint      # ESLint
```

Actualmente no hay scripts de pruebas para el frontend. Para validar una interfaz específica, utiliza la ruta o el componente correspondiente y ejecuta `npm run build` o `npm run lint`.

### Backend

Desde `backend/`:

```bash
npm run start:dev # Modo watch de Nest, normalmente en http://localhost:3001
npm run build
npm run lint
npm run format
npm run test
npm run test:cov
npm run test:e2e
```

Las pruebas unitarias de Jest se detectan como `src/**/*.spec.ts`. Para ejecutar un solo archivo de pruebas:

```bash
npm test -- --runInBand path/to/file.spec.ts
```

La configuración de pruebas e2e está en `test/jest-e2e.json`; para ejecutar un solo archivo e2e:

```bash
npm run test:e2e -- --runInBand test/app.e2e-spec.ts
```

El script de lint del backend incluye `--fix`, así que revisa el diff después de ejecutarlo. La prueba e2e inicial existente todavía espera que `GET /` devuelva `Hello World!`; actualiza esa prueba cuando cambie el contrato del endpoint raíz, en lugar de tratarla como una comprobación general de salud.

### Prisma y base de datos

Cada aplicación tiene un esquema de Prisma y un archivo `prisma.config.ts`. El esquema y las migraciones del backend son la fuente de verdad para la base de datos de la API; el esquema del frontend es una copia independiente del lado del cliente y no debe asumirse que contiene modelos exclusivos del backend, como los registros de facturación.

Desde el directorio de la aplicación correspondiente, utiliza el CLI de Prisma instalado en el repositorio:

```bash
npx prisma generate
npx prisma validate
npx prisma format
```

Para cambios en el esquema del backend, crea una migración de desarrollo con nombre mediante `npx prisma migrate dev --name <change-name>` y confirma la migración generada en `backend/prisma/migrations/`. No edites una migración ya aplicada para cambiar el historial de producción.

## Arquitectura y flujo de las solicitudes

El backend configura CORS global, `ValidationPipe` (`whitelist`, `forbidNonWhitelisted` y `transform`), el filtro global de excepciones HTTP, el interceptor global de transformación de respuestas y Swagger en `/api/docs` dentro de `backend/src/main.ts`. El comportamiento nuevo de la API normalmente debe pertenecer a un módulo funcional bajo `backend/src/modules/<feature>/`, dividido en archivos de controlador, servicio, DTO y módulo.

`AppModule` carga la configuración global, Prisma y todos los módulos funcionales, y registra `JwtAuthGuard` como guardia de aplicación. Usa `@Public()` únicamente para endpoints que deban ser deliberadamente públicos, como el registro y el inicio de sesión. Los controladores deben exponer el contrato de las rutas y delegar la lógica de negocio a los servicios; los DTOs son validados por el pipe global.

La autenticación utiliza JWT: `AuthService` aplica hash y verifica contraseñas con bcryptjs, crea el usuario y el restaurante dentro de una única transacción de Prisma durante el registro, y firma un token que contiene `sub`, `email`, `role` y `restaurantId`. `JwtStrategy` valida el token y adjunta el usuario a la solicitud. Usa `@CurrentUser()` para los datos del usuario y `@CurrentRestaurantId()` cuando la operación está limitada por restaurante.

La propiedad del restaurante es un límite de seguridad. Los servicios deben verificar que el usuario autenticado pertenece al restaurante solicitado antes de leer o modificar registros propiedad de un restaurante, y las consultas de Prisma para esos registros deben incluir el alcance del restaurante. No confíes en un ID de restaurante enviado por el navegador sin comprobarlo contra el usuario autenticado.

El backend envuelve las respuestas exitosas como `{ data: ... }` mediante `TransformInterceptor`; los errores son estructurados por `HttpExceptionFilter`. Mantén el manejo de la API del frontend consistente con esa envoltura. Los controladores protegidos utilizan decoradores de Swagger y `@ApiBearerAuth()`.

El frontend utiliza grupos de rutas del App Router: `(auth)` contiene las páginas de inicio de sesión y registro, mientras que `(dashboard)` proporciona la estructura protegida con barra lateral y encabezado, y redirige las sesiones no autenticadas a `/login`. Los componentes de servidor suelen utilizar `getServerSession()`, mientras que el acceso a datos desde el cliente utiliza la instancia compartida de Axios en `frontend/lib/api-client.ts` y las funciones auxiliares de autenticación en `frontend/lib/auth.ts`.

Hay dos integraciones de autenticación que deben mantenerse sincronizadas: la autenticación de credenciales de NextAuth llama a la ruta de inicio de sesión del backend en `frontend/app/api/auth/[...nextauth]/route.ts`, mientras que el cliente Axios compartido almacena el JWT del backend en `localStorage` y lo envía en el encabezado `Authorization`. Los cambios en los campos de respuesta del inicio de sesión o registro deben reflejarse en ambos caminos.

Usa el alias de TypeScript `@/*` para las importaciones del frontend. Reutiliza los componentes primitivos de UI compartidos en `frontend/components/ui/`, los componentes de estructura en `frontend/components/layout/` y TanStack Query mediante el proveedor existente, en lugar de introducir patrones de fetch o caché ad hoc. Sigue las convenciones existentes de textos del producto en español y estilos.

## Guías existentes para asistentes

Al modificar código de Next.js, lee primero la guía relevante en `frontend/node_modules/next/dist/docs/`; este repositorio mantiene deliberadamente una advertencia específica de Next.js en `frontend/AGENTS.md`. `frontend/CLAUDE.md` delega en ese archivo. Conserva esas reglas y revisa ambos archivos cuando una tarea del frontend afecte a APIs del framework.
