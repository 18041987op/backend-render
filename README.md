# Sistema de Gestión de Herramientas - Taller

Aplicación web full-stack diseñada para gestionar el inventario, préstamo, devolución, transferencia y estado de herramientas dentro de un taller mecánico o entorno similar.

## Características Principales

* **Gestión de Usuarios:**
    * Roles de Usuario (Administrador, Técnico).
    * Autenticación basada en JWT (Login).
    * Creación de usuarios por Administrador con activación vía Email.
    * Gestión de estado de usuarios (Activo/Inactivo) por Administrador.
* **Gestión de Herramientas:**
    * Creación, visualización (catálogo y detalle), actualización de información.
    * Seguimiento de estado: Disponible, En Préstamo, Mantenimiento, Dañada.
    * Organización por categorías personalizables.
    * Generación de Códigos QR para identificación rápida.
* **Sistema de Préstamos:**
    * Solicitud de préstamo por Técnicos especificando propósito, vehículo (opcional) y duración (horas, días o fecha específica).
    * Devolución de herramientas con opción de reportar daños.
    * Transferencia de herramientas entre técnicos (iniciada por el poseedor actual o solicitada por otro técnico).
    * Historial básico de transferencias (visible en el préstamo).
* **Paneles (Dashboards):**
    * **Admin:** Vista general de estadísticas (total, disponibles, prestadas, etc.), actividad reciente (pendiente), alertas (préstamos vencidos), acceso a gestión de usuarios y herramientas.
    * **Técnico:** Vista de herramientas actualmente en su posesión, tiempo restante/retraso, alertas personales, acceso al catálogo.
* **Notificaciones:** Sistema básico para informar sobre eventos relevantes (pendiente de definir eventos específicos).
* **Interfaz:** Diseño responsivo utilizando React y Tailwind CSS.

## Tech Stack

* **Frontend:**
    * React (v18+)
    * React Router DOM (v6+)
    * Axios
    * Tailwind CSS (v3+)
    * React Icons
    * React QR Code
    * (Configurado para despliegue en Firebase Hosting)
* **Backend:**
    * Node.js
    * Express
    * Mongoose (ODM para MongoDB)
    * JSON Web Token (jsonwebtoken)
    * Bcryptjs
    * Nodemailer (para envío de correos)
    * Cors
    * Dotenv
    * (Configurado para despliegue en Render - basado en URL de API)
* **Base de Datos:**
    * MongoDB (Local o Atlas)

## Primeros Pasos (Ejecución Local)

### Prerrequisitos

* Node.js (v18+ recomendado)
* npm o yarn
* MongoDB instalado localmente o una cuenta en MongoDB Atlas.

### Configuración

1.  **Clonar el Repositorio** (si aplica)
    ```bash
    git clone <url-del-repositorio>
    cd Gemini Project
    ```
2.  **Configurar Backend:**
    * Navega a la carpeta backend: `cd backend`
    * Instala dependencias: `npm install` (o `yarn install`)
    * Crea un archivo `.env` en la raíz de `/backend` (ver sección "Variables de Entorno" abajo).
    * Llena el archivo `.env` con tus configuraciones (Mongo URI, JWT Secret, credenciales de email, etc.).
    * Asegúrate de que tu instancia de MongoDB esté corriendo.
    * Inicia el servidor backend: `npm start`
       * *Debería correr en `http://localhost:5000` (o el puerto que definas en `.env`).*
3.  **Configurar Frontend:**
    * Abre *otra terminal*.
    * Navega a la carpeta frontend: `cd frontend` (o `cd ../frontend` si estás en `backend`)
    * Instala dependencias: `npm install` (o `yarn install`)
    * Verifica la URL de la API en `src/services/api.js`. Por defecto apunta a `http://localhost:5000/api`, lo cual es correcto para desarrollo local si el backend corre en el puerto 5000. Si necesitas cambiarla, puedes crear un archivo `.env` en la raíz de `/frontend` y definir `REACT_APP_API_URL=http://tu_backend_url/api`.
    * Inicia el servidor de desarrollo frontend: `npm start`
       * *Debería abrirse automáticamente en tu navegador en `http://localhost:3000` (o un puerto cercano si el 3000 está ocupado).*

### Variables de Entorno (`backend/.env`)

Crea un archivo `.env` en la carpeta `backend/` con el siguiente contenido, reemplazando los valores de ejemplo:

```dotenv
# Puerto para el servidor backend
PORT=5000

# URI de conexión a MongoDB
MONGO_URI=mongodb://localhost:27017/gemini_tools_db_dev # Reemplaza con tu URI (local o Atlas)

# Secreto para firmar los JSON Web Tokens (JWT) - ¡Hazlo largo y seguro!
JWT_SECRET=ESTE_ES_UN_SECRETO_MUY_LARGO_Y_ALEATORIO_PARA_JWT

# Credenciales para enviar correos de activación (usando Gmail como ejemplo)
# Necesitas generar una "Contraseña de Aplicación" en Google si usas 2FA
EMAIL_USER=[dirección de correo electrónico eliminada]
EMAIL_PASS=xxxxxxxxxxxxxxxx # Tu contraseña de aplicación de 16 letras SIN ESPACIOS

# URL base del frontend (para los enlaces en los correos)
CLIENT_URL=http://localhost:3000
