# Auditoría de código y seguridad — MenuFlow

**Fecha:** 2026-09-29  
**Alcance:** revisión estática del backend NestJS/Prisma y el frontend Next.js, con validaciones locales no destructivas.  
**Modalidad:** solo lectura para el código de la aplicación. Este documento es el único archivo creado por la auditoría.

> **Nota de estado:** este informe es una captura pre-remediación de los hallazgos indicados; no representa una auditoría del código después de cambios posteriores.

## 1. Resumen Ejecutivo

**Diagnóstico: Aprobado con Observaciones; no se recomienda el lanzamiento hasta corregir los hallazgos de seguridad de severidad media.**

Se detectaron dos problemas de severidad media relacionados con control de acceso entre restaurantes y destinos externos arbitrarios en el retorno de Stripe Checkout. También se detectó una configuración insegura de reserva para el secreto de NextAuth, de severidad baja. No se encontraron hallazgos clasificados como críticos o altos en la evidencia recopilada.

La API configura validación global de solicitudes, guard JWT y un filtro global de excepciones. Las comprobaciones de tipos terminaron correctamente y el esquema Prisma fue validado. Sin embargo, las pruebas automatizadas no aportaron evidencia suficiente y el lint no quedó limpio/verificado en ambas aplicaciones. No se realizó una prueba dinámica completa ni un análisis de rendimiento con datos o base de datos representativos.

La revisión corresponde al estado local inspeccionado. Git indicaba una rama limpia `main`, 10 commits por delante y 2 por detrás de `origin/main`; no se pudo calcular un ancestro común con ese remoto para comparar el estado auditado contra una base común. Por tanto, los hallazgos describen el código inspeccionado y no se atribuyen a un cambio o PR específico.

## 2. Hallazgos Críticos (Bloqueantes de Producción)

No se observaron hallazgos de severidad **crítica** o **alta**. Los siguientes hallazgos de severidad media deben resolverse antes del lanzamiento.

### H-01 — La actualización de un menú permite asociar recetas de otro restaurante

**Severidad:** Media  
**Ubicación:** `backend/src/modules/menus/menus.service.ts:183-212` (validación de acceso al restaurante: `:173-177`)  
**Confianza:** 8/10

**Problema:** Al actualizar un menú, el servicio elimina las relaciones existentes y crea nuevas relaciones `menuRecipe` usando los `recipeId` proporcionados. No verifica que todas las recetas pertenezcan al mismo `restaurantId` que el menú. La operación de creación de menú sí filtra las recetas por restaurante, pero la ruta de actualización no aplica esa comprobación.

**Impacto:** Un usuario autorizado en un restaurante que conozca el ID de una receta de otro restaurante podría asociarla a su menú. La respuesta de actualización incluye la receta y sus ingredientes, por lo que puede exponer datos de otro tenant y dejar una relación entre tenants.

**Recomendación:**
1. Dentro de la transacción, comprobar que cada receta solicitada pertenece al restaurante autorizado y rechazar la operación si alguna no coincide.
2. Aplicar el mismo alcance de tenant en todas las consultas de lectura y escritura de recetas asociadas.
3. Considerar restricciones de integridad en el modelo relacional que impidan asociaciones entre restaurantes.
4. Añadir pruebas de autorización negativas para un usuario que intenta vincular una receta de otro restaurante y una prueba positiva para recetas del mismo restaurante.

### H-02 — El checkout permite destinos de retorno arbitrarios

**Severidad:** Media  
**Ubicación:** `backend/src/modules/payments/dto/create-checkout.dto.ts:17-27`; `backend/src/modules/payments/payments.service.ts:48-63,110-111`  
**Confianza:** 9/10

**Problema:** `successUrl` y `cancelUrl` solo se validan como cadenas opcionales. El servicio las usa directamente como `success_url` y `cancel_url` en la sesión de Stripe Checkout, sin validar esquema ni host.

**Impacto:** Un usuario autenticado puede configurar enlaces de checkout que redirijan a un sitio externo no confiable tras completar o cancelar el flujo, facilitando phishing bajo el contexto de una interacción iniciada en Stripe.

**Recomendación:**
1. Preferir construir las URLs en el servidor usando un origen configurado y confiable.
2. Si se necesitan destinos configurables, validar URLs absolutas HTTPS y restringir el host a una lista permitida.
3. Añadir pruebas para rechazar hosts externos, esquemas no HTTPS y entradas malformadas, y para aceptar el origen autorizado.

### H-03 — Secreto fijo de reserva para NextAuth

**Severidad:** Baja  
**Ubicación:** `frontend/lib/auth-options.ts:10-16`; comprobación de sesión en `frontend/app/(dashboard)/layout.tsx:12-15`  
**Confianza:** 9/10

**Problema:** Cuando faltan `NEXTAUTH_SECRET` y `AUTH_SECRET`, la configuración utiliza el valor fijo `menuflow-local-nextauth-secret-change-in-production`.

**Impacto:** Si el frontend se despliega sin configurar uno de esos secretos, un atacante que conozca el secreto de reserva podría falsificar tokens de sesión NextAuth y superar la comprobación de sesión del dashboard. La evidencia revisada no demuestra que esto, por sí solo, permita pasar la autenticación JWT independiente del backend para acceder a datos de API.

**Recomendación:**
1. Eliminar el valor de reserva fijo.
2. Fallar explícitamente durante el arranque si falta el secreto en un entorno de despliegue.
3. Mantener un secreto aleatorio, exclusivo por entorno y provisionado fuera del repositorio.
4. Añadir una prueba de configuración que confirme el fallo cuando no se ha definido el secreto obligatorio.

## 3. Oportunidades de Mejora y Refactorización

### Media

- **Cobertura de autorización insuficiente:** no se detectaron pruebas unitarias en la búsqueda de Jest y no se ejecutó la prueba e2e existente. Añadir pruebas de API para usuarios no autenticados, usuarios autenticados sin acceso, acceso entre restaurantes, validación de DTOs y flujos críticos de pagos.
- **Verificación de compras/pedidos no concluida:** la evidencia disponible no permite confirmar exhaustivamente la atomicidad de los flujos de pedidos que modifican varias tablas. Revisar esos casos de uso y comprobar transacciones con pruebas de integración sobre una base de datos de prueba aislada.
- **Rendimiento de Prisma no medido:** se realizó una inspección estática parcial de esquema y consultas, pero no se midieron planes de consulta, cardinalidades ni latencias con datos representativos. Validar índices y patrones N+1 en los endpoints de menús, categorías, platillos y opciones antes de fijar conclusiones de rendimiento.

### Baja

- **Lint del backend:** el comando de ESLint reportó seis errores: cuatro de formato y dos aserciones innecesarias. Resolverlos mediante el flujo de lint/formato del proyecto y verificar el diff resultante; no se aplicó autofix durante la auditoría.
- **Lint del frontend:** ESLint no pudo cargar `eslint-config-next/core-web-vitals`. Resolver la configuración/dependencia correspondiente en el entorno de desarrollo y CI, y repetir lint para obtener un resultado válido.
- **Experiencia de usuario frontend:** los estados de carga, error y vacío no se verificaron de forma visual ni en ejecución en navegador. Revisar las vistas de gestión principales y los flujos de error/vacío en validación de UI o E2E.

## 4. Plan de Acción Priorizado

| Prioridad | Severidad | Ubicación exacta | Recomendación / pasos |
|---|---|---|---|
| P0 | Media | `backend/src/modules/menus/menus.service.ts:183-212` | En la transacción, verificar la pertenencia al restaurante de todas las recetas antes de reemplazar relaciones; rechazar IDs de otros tenants; agregar pruebas negativas/positivas de autorización. |
| P0 | Media | `backend/src/modules/payments/dto/create-checkout.dto.ts:17-27`; `backend/src/modules/payments/payments.service.ts:48-63,110-111` | Dejar de aceptar URLs arbitrarias o validar HTTPS y hosts permitidos; cubrir URLs externas y malformadas en pruebas. |
| P1 | Baja | `frontend/lib/auth-options.ts:10-16` | Eliminar el secreto fijo de reserva y fallar el arranque cuando falte el secreto requerido; cubrir la configuración con pruebas. |
| P1 | Media | Flujos de pedidos en `backend/src/modules/` (ubicación concreta no verificada) | Revisar cada operación multi-tabla de pedidos; usar `$transaction` donde se requiera atomicidad y comprobar rollback mediante pruebas de integración aisladas. |
| P1 | Media | Consultas de menús/recetas/productos en `backend/src/modules/` y esquema Prisma | Medir consultas con datos representativos, revisar N+1 e índices según filtros/ordenamientos observados; no añadir índices sin evidencia de patrón de consulta. |
| P2 | Baja | Configuración ESLint de `backend/` y `frontend/` | Corregir los seis problemas de lint del backend y resolver la carga de `eslint-config-next/core-web-vitals` en frontend; ejecutar lint sin autofix y registrar el resultado. |
| P2 | Media | Pruebas backend/frontend | Añadir pruebas de autorización entre tenants, validación de entrada, errores y flujos críticos de UI/pago; ejecutar la suite e2e existente en entorno de prueba. |

## Estado de Verificación

### VERIFIED

- TypeScript: `tsc --noEmit --incremental false` terminó correctamente en backend y frontend.
- Prisma: la validación del esquema terminó correctamente.
- Inspección estática: configuración global de `ValidationPipe`, protección JWT y filtro global de excepciones identificados.
- Estado de Git: rama local `main` sin cambios staged/unstaged al momento de la auditoría; no se pudo establecer base común con `origin/main`.

### NOT VERIFIED

- Pruebas unitarias: la detección de Jest no encontró pruebas.
- Pruebas e2e: existe configuración/prueba e2e, pero no se ejecutó.
- Frontend: no se ejecutó revisión completa en navegador ni visual.
- Lint: backend informó seis errores; el lint frontend no pudo cargar la configuración indicada. No hay una ejecución de lint limpia y válida para ambas aplicaciones.
- Secretos locales: no se leyó el `.env` local; únicamente se comprobó que no se reportaron archivos `.env` rastreados por Git.
- Rendimiento de producción, planes de ejecución e índices bajo carga real.
- Atomicidad exhaustiva de todos los flujos que crean pedidos y sus detalles.
- Atribución de los hallazgos a un diff concreto respecto al remoto.

### FAILED

Ninguna validación ejecutada produjo evidencia concluyente de fallo funcional. Los problemas de lint encontrados se registran como hallazgos; la configuración frontend de ESLint no cargó y, por tanto, esa validación no cuenta como una ejecución válida que demuestre incumplimiento del código.
