# Control de Caducidades - Sistema SaaS Multi-Tenant

**Control de Caducidades** es una plataforma SaaS (Software as a Service) diseñada para optimizar la gestión de inventario perecedero y la formación de empleados en el sector de la restauración. Su objetivo principal es reducir el desperdicio de alimentos, garantizar la seguridad alimentaria y asegurar que el personal esté cualificado, todo ello mediante un seguimiento preciso y en tiempo real.

La aplicación permite a múltiples restaurantes operar de forma independiente dentro de la misma infraestructura, garantizando la privacidad y el aislamiento total de sus datos. Está construida con una arquitectura **"Offline-First"**, permitiendo una operatividad continua incluso en condiciones de red inestables.

## 🚀 Funcionalidades Clave

### 🍎 Control de Caducidades Inteligente
El núcleo del sistema es un algoritmo de estado que clasifica los productos automáticamente según sus fechas de caducidad:
*   **Estados Dinámicos:** "Abierto-Agota", "Frente-Cambia", etc., calculados en tiempo real.
*   **Gestión de Lotes:** Control de fechas para productos en "Frente" (exhibición) y "Almacén".
*   **Alertas Preventivas:** Sistema de aviso de caducidad con hasta 15 días de antelación para permitir una gestión proactiva y evitar el desperdicio.

### 🎓 Gestión de Formación y Competencias
Módulo dedicado al seguimiento del desarrollo profesional de los empleados:
*   **Matriz de Competencias:** Seguimiento de habilidades por Área y Tarea.
*   **Certificación Digital:** Los encargados y supervisores pueden "firmar" y validar competencias completadas.
*   **Dashboard de Progreso:** Visualización clara del estado de formación de cada empleado.

### ⚡ Sincronización en Tiempo Real (Socket.IO)
*   **Comunicación Bidireccional:** Los cambios en el inventario o en la formación se reflejan instantáneamente en todos los dispositivos conectados del mismo restaurante.
*   **Salas Privadas:** Eventos segmentados por `restaurantId` para asegurar la privacidad entre inquilinos.

### 📡 Modo Offline y Optimistic UI
Diseñado para entornos con conectividad intermitente:
*   **Actualizaciones Optimistas:** La interfaz responde inmediatamente a las acciones del usuario antes de confirmar con el servidor.
*   **Persistencia Local:** Uso estratégico de `localStorage` y "Blacklists" locales para mantener la coherencia de datos (como productos eliminados) mientras se está desconectado.
*   **Sincronización Automática:** Re-conexión y sincronización transparente al recuperar la red.

### 🏢 Arquitectura Multi-Tenant
*   **Aislamiento de Datos:** Cada restaurante es un universo lógico separado.
*   **RBAC Jerárquico:**
    1.  **Administrador Global:** Gestión de la plataforma y restaurantes.
    2.  **Supervisor:** Gestión de catálogo y empleados de su restaurante.
    3.  **Encargado:** Operativa diaria (fechas y cantidades).

## 🛠️ Stack Tecnológico

### Frontend (Cliente)
*   **React 18:** Librería UI basada en componentes.
*   **Vite:** Build tool de próxima generación para un desarrollo ultra-rápido.
*   **TailwindCSS:** Framework de utilidades para un diseño responsivo y moderno.
*   **Socket.IO Client:** Para la comunicación en tiempo real.
*   **Lucide React:** Iconografía consistente y ligera.
*   **Date-fns:** Manipulación robusta de fechas.

### Backend (Servidor)
*   **Node.js & Express:** Servidor API RESTful robusto.
*   **MongoDB & Mongoose:** Base de datos NoSQL orientada a documentos.
*   **Socket.IO:** Motor de eventos en tiempo real.
*   **JWT (JSON Web Tokens):** Autenticación segura y sin estado (stateless).
*   **BcryptJS:** Hashing de contraseñas.
*   **Winston/Pino:** Logging estructurado para producción.

## 📂 Estructura del Proyecto

```
control-caducidades/
├── client/                 # Frontend (Vite + React)
│   ├── src/
│   │   ├── components/     # Componentes UI reutilizables (Modales, Cards, etc.)
│   │   ├── contexts/       # Estado global (Auth, Toast, DeletedProducts)
│   │   ├── hooks/          # Custom Hooks (useProductManagement, useSocket)
│   │   ├── pages/          # Vistas principales (Login, Dashboard)
│   │   └── services/       # Capa de comunicación con API (Axios)
│   └── ...
├── server/                 # Backend (Node + Express)
│   ├── controllers/        # Lógica de negocio
│   ├── models/             # Esquemas de Mongoose (Product, Employee, User)
│   ├── routes/             # Definición de endpoints API
│   ├── services/           # Lógica compleja (cálculo de estados)
│   └── index.js            # Punto de entrada y configuración de Socket.IO
└── ...
```

## ⚙️ Instalación y Configuración

### Prerrequisitos
*   Node.js (v18 o superior)
*   MongoDB (Instancia local o Atlas URI)

### 1. Configurar el Servidor
```bash
cd server
npm install
```
Crea un archivo `.env` en la carpeta `server` con las siguientes variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/control-caducidades
JWT_SECRET=tu_secreto_super_seguro
CORS_ORIGIN=http://localhost:5173
```
Iniciar servidor:
```bash
npm run dev
```

### 2. Configurar el Cliente
```bash
cd client
npm install
```
Iniciar cliente de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---
*Desarrollado con un enfoque en escalabilidad, experiencia de usuario y robustez operativa.*
