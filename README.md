![Logo](frontend/assets/images/logo_RedVital.png)

# RedVital
## Gestor de Donaciones de Sangre

## 1. Descripción

**RedVital** es una aplicación web que conecta hospitales y donantes de sangre en tiempo real.

Su objetivo es reducir el tiempo de respuesta cuando un hospital necesita sangre, enviando notificaciones inmediatas y segmentadas a donantes compatibles cercanos, y ofreciendo herramientas de gestión para hospitales y administradores (solicitudes, donaciones y estadísticas).

Proyecto académico de la asignatura **Sistemas Web I**  
(Grado en Ingeniería de Sistemas de Información, Universidad CEU San Pablo).


## 2. Estado del proyecto

Proyecto **funcional en entorno local**, con:

- Home informativa y navegación entre áreas.
- Área Donante, Hospital y Administrador.
- Sistema de login/registro sobre base de datos.
- Notificaciones y gestión de solicitudes de sangre.
- Funcionalidad en tiempo real mediante **Socket.io**.
- Semillas de base de datos para pruebas (usuarios, hospitales, etc.).


## 3. Equipo

- Pilar Bourg  
- Olivia Gallego    
- Alejandra O’Shea  
- Marta Sánchez
- Elena Morales
- Josefina Silva  


## 4. Tecnologías

### Front-end

- **HTML5**
- **CSS3**
  - Estilos propios para maquetación y colores de la marca RedVital.
- **JavaScript**
  - Validación de formularios en cliente.
  - Lógica de navegación y protección de rutas en el navegador (por ejemplo, `auth-guard.js`).
  - Integración con Socket.io para recibir notificaciones en tiempo real.

### Back-end

- **Node.js**
- **Express**
- **Socket.io** (comunicación en tiempo real).
- **Sequelize** + **SQLite** (persistencia de datos relacional en fichero).
- **dotenv** (carga de variables de entorno).
- **Nodemailer** (envío de correos de confirmación de citas / notificaciones).
- **CORS**, `express.json`, `express.urlencoded` (API REST y formularios).


## 5. Estructura del repositorio
```txt
red-vital/
├── backend/              # Servidor Node.js + API REST + Socket.io
│   ├── app.js            # Configuración principal de la app Express
│   ├── server.js         # Servidor HTTP + Socket.io + conexión BD
│   ├── routes/           # Rutas de la API (auth, donantes, hospitales, admin...)
│   ├── seed/             # Datos de ejemplo para poblar la BD
│   ├── models/ o db/     # Definición de modelos Sequelize
│   └── ...               # Otros ficheros auxiliares (middleware, etc.)
├── frontend/             # Parte estática/pública de la aplicación
│   ├── assets/
│   │   ├── css/          # Estilos
│   │   ├── js/           # Lógica cliente (auth-guard, llamadas a la API, etc.)
│   │   └── images/       # Imágenes (incluyendo logo_RedVital.png)
│   └── ...               # Vistas HTML adicionales si aplica
├── docs/                 # Documentación del proyecto
│   ├── Documento inicial (requisitos, casos de uso, RF)
│   ├── Documento de diseño (sitemap, wireframes, modelo de datos, arquitectura)
│   └── Presentación en PDF
├── index.html            # Home pública principal
├── package.json          # Dependencias del back-end
├── package-lock.json
└── README.md             # Este archivo
```

## 6. Instalación de dependencias 

### 1. Clonar el repositorio (si aún no lo tienes)

```bash
git clone https://github.com/oliviagallego/red-vital.git
cd red-vital
```
### 2. Instalar las dependencias del backend

Desde la raíz del proyecto:
```bash
npm install
```
Con este comando se instalan todas las dependencias declaradas en package.json
(por ejemplo: express, sequelize, nodemailer, socket.io, dotenv, etc.).
Solo harías npm install express o similar si quisieras añadir nuevas librerías al proyecto.

## 7. Ejecución en local

Desde la raíz del proyecto, levanta el servidor backend con:
```bash
node backend/server.js
```
Esto hará que:
- Se cargue la configuración del backend (Express, rutas, Socket.io).
- Se inicialice la base de datos SQLite en backend/db/redvital.db y se ejecuten las semillas
(usuarios, donantes, hospitales, etc.).

Después:
1. Abre tu navegador y entra en:
```bash
http://localhost:3000/
```
2. Desde la página de inicio podrás navegar a:
- Home Page
- Registro / Inicio de sesión
- Área Donante
- Área Hospital
- Área Administrador

Las rutas que requieren autenticación usan la API del backend (/api/...) y la lógica de front (por ejemplo, auth-guard.js) para controlar el acceso según el rol del usuario.
