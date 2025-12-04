# Sistema de Agente Corresponsal (Musoni Adapter)

Este proyecto es una solución de **Caja para Bancos Corresponsales** diseñada para interactuar de manera segura y eficiente con el Core Bancario **Musoni System**.

El sistema implementa un patrón **BFF (Backend for Frontend)** para desacoplar la interfaz de usuario de la complejidad del Core Bancario, gestionando la autenticación, transformación de datos y reglas de negocio específicas del canal corresponsal.

## 🚀 Características Principales

*   **Búsqueda Unificada:** Búsqueda inteligente de Clientes y Préstamos en tiempo real.
*   **Gestión de Préstamos:** Visualización clara de saldos, mora y próximas cuotas.
*   **Procesamiento de Pagos:** Interfaz optimizada para el cobro de cuotas de préstamos.
*   **Anulaciones (Reversals):** Capacidad de anular transacciones del día en caso de error.
*   **Emisión de Recibos:** Generación de comprobantes de pago listos para imprimir (formato ticket).
*   **Modo Offline/Mock:** Capacidad de desarrollo y pruebas sin conexión al Core Bancario real.

## 🛠️ Stack Tecnológico

### Frontend (Cliente)
*   **Framework:** React + Vite + TypeScript
*   **UI Library:** Ant Design (Configuración compacta para alta densidad de datos)
*   **Estado:** TanStack Query (React Query) v5
*   **Routing:** React Router DOM

### Backend (Servidor/Middleware)
*   **Runtime:** Node.js (LTS)
*   **Framework:** Express.js con TypeScript
*   **Integración:** Axios (Adaptador para API Musoni)
*   **Seguridad:** Helmet, CORS

## 📋 Prerrequisitos

*   Node.js (v18 o superior)
*   npm o yarn

## ⚙️ Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd sistema-agente-corresponsal
```

### 2. Configurar el Backend
```bash
cd server
npm install
```

Crea un archivo `.env` en la carpeta `server/` basado en el siguiente ejemplo:
```env
PORT=3000
NODE_ENV=development

# Configuración Musoni
MUSONI_BASE_URL=https://api.demo.irl.musoniservices.com/v1
MUSONI_TENANT_ID=tu_tenant_id
MUSONI_USER=tu_usuario
MUSONI_PASSWORD=tu_password
MUSONI_API_KEY=tu_api_key

# Configuración de Pagos
PAYMENT_TYPE_ID=10

# Seguridad
JWT_SECRET=tu_clave_secreta_jwt
USE_MOCK_API=true  # Cambiar a false para conectar con Musoni real
```

Para iniciar el servidor:
```bash
npm run dev
```

### 3. Configurar el Frontend
En una nueva terminal:
```bash
cd client
npm install
```

El frontend asume que el backend corre en `http://localhost:3000`. Si cambiaste el puerto, ajusta la configuración en `client/src/api/axios.ts` (o mediante variables de entorno si está configurado).

Para iniciar el cliente:
```bash
npm run dev
```

## 📖 Guía de Uso

1.  **Inicio de Sesión:** (Simulado en desarrollo) Accede al Dashboard principal.
2.  **Búsqueda:**
    *   Ingresa el nombre del cliente, identidad o número de préstamo en la barra de búsqueda.
    *   El sistema mostrará resultados mixtos (Clientes y Préstamos).
3.  **Selección:**
    *   Si seleccionas un **Préstamo**, irás directo a la pantalla de pago.
    *   Si seleccionas un **Cliente**, verás una lista de sus préstamos activos para elegir cuál pagar.
4.  **Pago:**
    *   Verifica los datos del préstamo (Saldo, Mora).
    *   Ingresa el monto a pagar y el número de recibo físico (si aplica).
    *   Haz clic en "Procesar Pago".
5.  **Comprobante:**
    *   Al finalizar, se mostrará un modal con el recibo digital. Puedes imprimirlo o cerrar la ventana.
6.  **Anulación:**
    *   En el historial de transacciones (parte inferior de la ficha del préstamo), puedes anular pagos realizados el mismo día si cometiste un error.

## 🏗️ Estructura del Proyecto

```text
/
├── client/                 # Frontend (React)
│   ├── src/
│   │   ├── components/     # Componentes UI (Modal Recibo, etc.)
│   │   ├── pages/          # Vistas (Dashboard, LoanDetail)
│   │   └── api/            # Configuración Axios Cliente
├── server/                 # Backend (Express)
│   ├── src/
│   │   ├── adapters/       # Cliente HTTP para Musoni
│   │   ├── controllers/    # Lógica de endpoints
│   │   ├── services/       # Lógica de negocio y Mocks
│   │   └── types/          # Definiciones TypeScript (OpenAPI)
└── references/             # Documentación de referencia (OpenAPI.json)
```

## 🤝 Contribución

1.  Hacer Fork del repositorio.
2.  Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`).
3.  Hacer Commit de tus cambios (`git commit -m 'Agrega nueva funcionalidad'`).
4.  Hacer Push a la rama (`git push origin feature/nueva-funcionalidad`).
5.  Abrir un Pull Request.