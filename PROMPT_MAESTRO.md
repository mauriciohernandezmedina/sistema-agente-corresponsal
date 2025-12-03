# PROMPT_MAESTRO.md - Especificación Maestra: Sistema de Caja (Musoni Adapter)

## 0. REFERENCIA DE API (CRUCIAL - FUENTE DE VERDAD)
Este proyecto debe integrarse con el Core Bancario **Musoni System**.
* **Ubicación del Archivo:** Se incluye el archivo `references/openapi.json` en la raíz de este repositorio. Este archivo contiene la definición oficial de la API de Musoni.
* **Instrucción para el Agente:**
    1.  **Lectura Obligatoria:** Antes de generar clientes HTTP (Axios) o interfaces de datos, CONSULTA el esquema correspondiente en `openapi.json`.
    2.  **Tipado Estricto:** Genera interfaces TypeScript (`/server/src/types/musoni.d.ts`) basadas estrictamente en los esquemas del JSON (ej: `GetLoansLoanIdResponse`, `PostLoansLoanIdTransactionsRequest`). No adivines nombres de campos; usa los oficiales.
    3.  **Endpoint Matching:** Verifica las URLs y los Query Params permitidos en el archivo JSON.

---

## 1. Contexto y Arquitectura
Desarrollar un "Sistema de Caja" para Bancos Corresponsales que actúa como intermediario seguro hacia Musoni System.

**Arquitectura: BFF (Backend for Frontend)**
El sistema se compone de dos aplicaciones separadas que funcionan en conjunto:
1.  **Frontend (Cliente Web):** Una SPA (Single Page Application) densa y optimizada para teclado, que emula un software de escritorio bancario. **NUNCA se conecta a Musoni directamente.**
2.  **Backend (Middleware/Adaptador):** Una API segura que recibe peticiones del Frontend, inyecta credenciales secretas, transforma los datos al formato complejo de Musoni y gestiona la auditoría.

---

## 2. Stack Tecnológico

### 2.1 Backend (Server - Middleware)
* **Runtime:** Node.js (LTS).
* **Framework:** Express.js con TypeScript.
* **Base de Datos:** PostgreSQL (Tabla única de auditoría de transacciones).
* **Cliente HTTP:** Axios (configurado con interceptores para Headers de Musoni).
* **Seguridad:** Helmet, CORS (restringido al dominio del Frontend), Rate Limiting.

### 2.2 Frontend (Client - Teller UI)
* **Framework:** React + Vite + TypeScript.
* **UI Library:** **Ant Design (AntD)**. Configuración: Modo "Compact/Small" para alta densidad de información.
* **Estado Remoto:** TanStack Query (React Query) v5.
* **Router:** React Router DOM.
* **Estilos:** CSS Modules o Tailwind (estilo corporativo/financiero: grises, azules, tipografía nítida).

---

## 3. Especificación del Backend (Musoni Adapter)

El backend debe leer las siguientes variables de entorno (`.env`):
* `MUSONI_BASE_URL`
* `MUSONI_USER` / `MUSONI_PASSWORD`
* `MUSONI_TENANT_ID` (Header obligatorio: `X-Tenant-Identifier`)
* `JWT_SECRET` (Para sesión local del cajero)
* `DB_CONNECTION_STRING` (PostgreSQL)

### 3.1 Endpoints del Middleware

#### A. Autenticación Local (`POST /api/auth/login`)
* **Lógica:** Autenticación propia del Banco Corresponsal (Cajero/Password).
* **Salida:** JWT Token para que el Frontend consuma este Backend.

#### B. Búsqueda de Clientes (`GET /api/clients?search=...`)
* **Referencia OpenAPI:** `GET /clients`
* **Transformación:**
    * Inyectar Headers Musoni (`Authorization`, `X-Tenant-Identifier`).
    * Mapear respuesta para el Frontend: `{ id, externalId, displayName, status, mobileNo }`.
    * Filtrar clientes con `status.value !== 'Active'`.

#### C. Detalle de Préstamo (`GET /api/loans/:id`)
* **Referencia OpenAPI:** `GET /loans/{loanId}`
* **Parámetro Obligatorio:** `?associations=repaymentSchedule,transactions,summary` (para evitar múltiples llamadas).
* **Lógica de Negocio (Mapping):**
    * `saldoTotal`: Mapear de `summary.totalOutstanding`.
    * `moraTotal`: Mapear de `summary.totalOverdue`.
    * `enMora`: Boolean (`totalOverdue > 0` o `inArrears === true`).
    * `proximaCuota`: Buscar en `repaymentSchedule` la primera cuota no pagada.

#### D. Procesar Pago (`POST /api/loans/:id/transactions`)
* **Referencia OpenAPI:** `POST /loans/{loanId}/transactions` (Command: `repayment`).
* **Entrada (Frontend):** `{ amount: 100.00, receipt: "REC-001" }`.
* **Transformación (Hacia Musoni):**
    ```json
    {
      "transactionAmount": 100.00,
      "paymentTypeId": 10, // ID fijo configurado en ENV
      "receiptNumber": "REC-001",
      "transactionDate": "dd MMMM yyyy", // FECHA ACTUAL formateada así
      "dateFormat": "dd MMMM yyyy", // OBLIGATORIO por Musoni
      "locale": "en" // OBLIGATORIO por Musoni
    }
    ```
* **Post-Proceso:**
    1.  Recibir `resourceId` de Musoni.
    2.  Consultar `GET /loans/:id/transactions/:resourceId` para obtener el desglose real (Capital/Interés/Mora) calculado por el Core.
    3.  **Auditoría:** Insertar registro en PostgreSQL con el JSON de petición y respuesta.

#### E. Reversar Pago (`POST /api/transactions/:trxId/reverse`)
* **Referencia OpenAPI:** `POST /loans/{loanId}/transactions/{transactionId}` (Command: `undo`).
* **Validación:** Permitir solo si la transacción fue hecha hoy.

---

## 4. Especificación del Frontend (Interfaz de Caja)

**Objetivo UX:** Velocidad y precisión. Debe parecer una aplicación nativa.

### 4.1 Requisitos Visuales
* **Layout:** Barra superior fija (Datos Cajero, Estado Online). Contenido central con "Breadcrumbs".
* **Componentes:** Usar tablas de Ant Design con `size="small"` y `pagination={{ pageSize: 20 }}`.
* **Teclado:**
    * `Enter` para enviar búsqueda y confirmar pagos.
    * `Esc` para cerrar modales.
    * Focus automático en el input principal al cargar la pantalla.

### 4.2 Pantallas

1.  **Dashboard / Búsqueda:**
    * Input grande centrado: "Buscar por Identidad, Nombre o ID Préstamo".
    * Tabla de resultados con columnas: Nombre, Identidad, ID Préstamo, Estado (Tag Verde/Rojo), Acción.

2.  **Detalle del Préstamo (La Ficha):**
    * **Header:** Datos del cliente.
    * **Tarjetas de Resumen:**
        * "Saldo Total" (Grande).
        * "Monto Exigible / Mora" (Destacado en Rojo si > 0).
    * **Panel de Acción (Derecha):** Formulario de Pago siempre visible.
        * Input Monto (Validación: > 0 y <= Saldo Total).
        * Botón "Procesar Pago" (Grande, Azul).

3.  **Modal de Recibo:**
    * Diseño tipo ticket térmico.
    * Muestra el desglose retornado por el Backend.
    * Botón "Imprimir" y Botón "Nuevo Pago".

---

## 5. Instrucciones de Implementación (Paso a Paso)

Ejecuta estas tareas en orden:

1.  **Setup de Tipos:** Lee `references/openapi.json` y genera el archivo `server/src/types/musoni.d.ts` con las interfaces de Request/Response necesarias.
2.  **Backend Core:**
    * Inicializa `server/` (Express + TS).
    * Configura Axios con interceptores para inyectar `X-Tenant-Identifier` y Auth Basic de Musoni.
    * Crea el `MusoniAdapterService` que implementa la lógica de transformación (fechas, locale).
3.  **Mocking (Importante):** Crea un modo "Mock" en el Backend. Si `USE_MOCK_API=true` en `.env`, el servicio debe retornar datos ficticios (basados en los esquemas de `openapi.json`) en lugar de llamar a Musoni real. Esto es vital para desarrollar el Frontend sin conexión al Core.
4.  **Frontend Core:**
    * Inicializa `client/` (Vite + React + TS).
    * Configura Ant Design con un tema corporativo (Compacto).
    * Implementa la pantalla de Búsqueda y Detalle conectadas al Backend local.
5.  **Auditoría:** Configura la conexión a PostgreSQL y el middleware que guarda cada transacción exitosa.

---

## 6. Estructura de Directorios Esperada

```text
/
├── references/
│   └── openapi.json       # Definición API Musoni
├── server/
│   ├── src/
│   │   ├── adapters/      # Cliente Axios Musoni
│   │   ├── controllers/
│   │   ├── types/         # Tipos generados desde OpenAPI
│   │   └── services/      # Lógica de negocio y Mocks
│   └── .env
├── client/
│   ├── src/
│   │   ├── components/    # UI Reutilizable (AntD wrappers)
│   │   ├── pages/         # Dashboard, LoanDetail
│   │   └── hooks/         # React Query hooks
│   └── .env
└── PROMPT_MAESTRO.md