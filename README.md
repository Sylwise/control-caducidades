# Control de Caducidades

Sistema de gestión de caducidades para productos de un restaurante, diseñado para facilitar el seguimiento y control de fechas de caducidad tanto en el frente de la tienda como en el almacén.

## 🚀 Características

- **Gestión de Productos**

  - Clasificación de productos por estado y ubicación
  - Seguimiento de fechas de caducidad en frente y almacén
  - Indicadores visuales para productos próximos a caducar
  - Búsqueda rápida de productos

- **Sistema de Roles**

  - Supervisor: Acceso completo al sistema
  - Encargado: Gestión de productos y caducidades
  - Gerente: Visualización y seguimiento

- **Interfaz Intuitiva**
  - Diseño responsive optimizado para móviles
  - Notificaciones en tiempo real
  - Animaciones suaves para mejor experiencia de usuario

## 🛠️ Tecnologías

- **Frontend**

  - React
  - TailwindCSS
  - Lucide Icons
  - React Router

- **Backend**
  - Node.js
  - Express
  - MongoDB
  - JWT para autenticación

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- MongoDB
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/tu-usuario/control-caducidades.git
   cd control-caducidades
   ```

2. **Instalar dependencias del servidor**

   ```bash
   cd server
   npm install
   ```

3. **Instalar dependencias del cliente**

   ```bash
   cd ../client
   npm install
   ```

4. **Configurar variables de entorno**

   Crear archivo `.env` en la carpeta `server`:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=tu_uri_de_mongodb
   JWT_SECRET=tu_secreto_jwt
   ```

## 🚀 Ejecución

1. **Iniciar el servidor**

   ```bash
   cd server
   npm run dev
   ```

2. **Iniciar el cliente**
   ```bash
   cd client
   npm run dev
   ```

La aplicación estará disponible en `http://localhost:5173`

## 📱 Funcionalidades Principales

### Gestión de Productos

- Añadir nuevos productos al catálogo
- Clasificar productos por estado
- Actualizar fechas de caducidad
- Marcar productos como agotados o con última caja

### Sistema de Notificaciones

- Alertas de productos próximos a caducar
- Notificaciones de actualizaciones exitosas
- Avisos de errores o problemas

### Búsqueda y Filtrado

- Búsqueda instantánea de productos
- Filtrado por categorías
- Vista de productos sin clasificar

## 👥 Roles y Permisos

### Supervisor

- Gestión completa del catálogo
- Administración de usuarios
- Acceso a todas las funcionalidades

### Encargado

- Gestión de productos y caducidades
- Actualización de estados
- Vista de estadísticas

### Gerente

- Visualización de productos y estados
- Seguimiento de caducidades
- Acceso a reportes

## 🔒 Seguridad

- Autenticación mediante JWT
- Protección de rutas por roles
- Validación de datos en servidor
- Sanitización de entradas

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## ✨ Agradecimientos

- [React](https://reactjs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
