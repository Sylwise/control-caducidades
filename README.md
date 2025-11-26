# Control de Caducidades - Sistema SaaS Multi-Tenant

## Descripción del Producto

**Control de Caducidades** es una plataforma SaaS (Software as a Service) diseñada para optimizar la gestión de inventario perecedero en el sector de la restauración. Su objetivo principal es reducir el desperdicio de alimentos y garantizar la seguridad alimentaria mediante un seguimiento preciso y en tiempo real de las fechas de caducidad.

La aplicación permite a múltiples restaurantes operar de forma independiente dentro de la misma infraestructura, garantizando la privacidad y el aislamiento total de sus datos. Está construida para entornos dinámicos, permitiendo la sincronización instantánea entre dispositivos de un mismo local.

## Funcionalidades Clave

### 🏢 Arquitectura Multi-Tenant (Multi-Inquilino)
*   **Aislamiento de Datos:** Cada restaurante opera en su propio "silo" lógico. Los datos de inventario, usuarios y configuraciones son totalmente invisibles para otros restaurantes.
*   **Gestión Centralizada:** Panel de administración global para dar de alta nuevos restaurantes y gestionar la plataforma.

### 👥 Control de Acceso Basado en Roles (RBAC) Jerárquico
El sistema implementa una jerarquía estricta de permisos:
1.  **Administrador Global:** Acceso total al sistema, gestión de restaurantes y supervisión global.
2.  **Supervisor de Restaurante:** Gestión de usuarios (Encargados) y catálogo dentro de su propio restaurante.
3.  **Encargado:** Operativa diaria (registro de mermas, control de fechas) sin acceso a configuración sensible.

### ⚡ Sincronización en Tiempo Real
*   **Tecnología WebSocket:** Utiliza conexiones persistentes para reflejar cambios instantáneamente en todos los dispositivos conectados de un mismo restaurante.
*   **Salas Privadas:** Los eventos de actualización se emiten en canales encriptados y segmentados por restaurante, asegurando que la información no se cruce entre clientes.

### 🛡️ Seguridad y Auditoría
*   **Autenticación Robusta:** Sistema basado en JWT (JSON Web Tokens) con expiración y renovación segura.
*   **Protección de API:** Middleware personalizado para validación de inquilinos, Rate Limiting para prevenir abusos y protección CORS configurada.

### 📱 Experiencia de Usuario (UX)
*   **Interfaz Reactiva:** Diseño moderno y adaptable (Responsive) construido con React y TailwindCSS.
*   **Modo Offline:** Capacidad de funcionamiento limitado y sincronización posterior ante cortes de red.

## Stack Tecnológico

El proyecto está construido sobre el stack **MERN** (MongoDB, Express, React, Node.js), optimizado para escalabilidad y rendimiento.

### Backend (Servidor)
*   **Node.js & Express:** Núcleo del servidor API RESTful.
*   **MongoDB & Mongoose:** Base de datos NoSQL con esquemas estrictos y referencias relacionales para la gestión de inquilinos.
*   **Socket.IO:** Motor de comunicación bidireccional en tiempo real.
*   **JWT & Bcrypt:** Seguridad criptográfica para autenticación y almacenamiento de contraseñas.
*   **Winston/Pino:** Sistema de logging avanzado para monitorización y depuración.

### Frontend (Cliente)
*   **React:** Librería de UI para una experiencia de usuario fluida (SPA).
*   **TailwindCSS:** Framework de utilidades para un diseño visual consistente y moderno.
*   **Socket.IO Client:** Cliente para la gestión de eventos en tiempo real.
*   **Lucide React:** Iconografía moderna y ligera.
*   **Vite:** Herramienta de construcción y desarrollo de alto rendimiento.

### Infraestructura y Despliegue
*   **Railway:** Plataforma de despliegue continuo (CI/CD).
*   **Git:** Control de versiones con estrategia de ramas (Feature Branch Workflow).

---
*Desarrollado con un enfoque en escalabilidad, seguridad y eficiencia operativa.*
