# Backend Isidro Libre Gourmet

Este es el backend para la aplicación Isidro Libre Gourmet. Proporciona una API RESTful para gestionar pedidos, productos, usuarios, gastos y otras operaciones del negocio.

## Características Principales

*   Gestión de Usuarios (autenticación con JWT)
*   Gestión de Productos (con control de stock)
*   Gestión de Pedidos (creación, actualización de estado, detalles)
*   Gestión de Items de Pedido
*   Gestión de Gastos
*   Configuración del Negocio
*   Impresión de comandas de cocina y recibos de caja (mediante `node-thermal-printer`)

## Tecnologías Utilizadas

*   **Node.js**: Entorno de ejecución para JavaScript en el servidor.
*   **Express.js**: Framework web para Node.js, utilizado para construir la API REST.
*   **TypeScript**: Superset de JavaScript que añade tipado estático.
*   **TypeORM**: ORM para TypeScript y JavaScript, facilita la interacción con la base de datos.
*   **PostgreSQL**: Sistema de gestión de bases de datos relacional utilizado.
*   **JSON Web Tokens (JWT)**: Para la autenticación de usuarios.
*   **class-validator & class-transformer**: Para la validación y transformación de datos de entrada (DTOs).
*   **dotenv**: Para gestionar variables de entorno.
*   **bcrypt**: Para el hashing de contraseñas.
*   **node-thermal-printer**: Para la comunicación con impresoras térmicas.

## Estructura del Proyecto

El código fuente principal se encuentra en la carpeta `src/`:

*   `src/controllers/`: Contiene los controladores que manejan la lógica de las solicitudes HTTP.
*   `src/dtos/`: Define los Objetos de Transferencia de Datos (DTOs) para la validación.
*   `src/entities/`: Define las entidades de TypeORM que mapean a las tablas de la base de datos.
*   `src/migrations/`: (Si se usa) Contiene las migraciones de base de datos generadas por TypeORM.
*   `src/routes/`: Define las rutas de la API y las asocia con los controladores.
*   `src/services/`: Contiene la lógica de negocio y servicios reutilizables (ej. `PrinterService`).
*   `src/data-source.ts`: Configuración de la conexión a la base de datos para TypeORM.
*   `src/index.ts`: Punto de entrada principal de la aplicación Express.

## Configuración

### 1. Variables de Entorno

Cree un archivo `.env` en la raíz del directorio `backend/` con las siguientes variables:

```env
# Configuración de la Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario_postgres
DB_PASSWORD=tu_contraseña_postgres
DB_NAME=isidro_libre_gourmet

# Configuración de Autenticación (JWT)
JWT_SECRET=tu_secreto_jwt_super_seguro # Cambiar en producción
JWT_EXPIRES_IN=1d # Ejemplo: 1 día

# Configuración de Impresoras
KITCHEN_PRINTER_IP=TU_IP_IMPRESORA_COCINA # Ejemplo: 192.168.1.100 o nombre de dispositivo si es USB
KITCHEN_PRINTER_PORT=9100 # Puerto TCP/IP si es una impresora de red

# Opcional para impresoras USB (si la detección automática falla)
# CASH_REGISTER_PRINTER_VID=VID_IMPRESORA_CAJA
# CASH_REGISTER_PRINTER_PID=PID_IMPRESORA_CAJA

# Entorno de Node
NODE_ENV=development # Cambiar a 'production' en producción
PORT=3000 # Puerto en el que correrá el servidor backend
```

Asegúrese de reemplazar los valores de placeholder con su configuración real.

### 2. Base de Datos

Asegúrese de tener una instancia de PostgreSQL en ejecución y accesible con las credenciales proporcionadas en el archivo `.env`. La base de datos especificada en `DB_NAME` debe existir. TypeORM se encargará de sincronizar las entidades para crear las tablas si `synchronize: true` está habilitado en `data-source.ts` (lo cual es común para desarrollo, pero para producción se recomiendan migraciones).

## Cómo Empezar

1.  **Clonar el Repositorio** (si aún no lo ha hecho):
    ```bash
    git clone <url-del-repositorio>
    cd <nombre-del-repositorio>/backend
    ```

2.  **Instalar Dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**:
    Cree y configure el archivo `.env` como se describe en la sección "Variables de Entorno".

4.  **Ejecutar Migraciones (Recomendado para Producción)**:
    Si está gestionando cambios en el esquema de la base de datos mediante migraciones:
    ```bash
    # Para generar una nueva migración después de cambios en las entidades:
    # npm run migration:generate src/migrations/NombreDeLaMigracion
    # Para ejecutar las migraciones pendientes:
    npm run migration:run
    ```
    Si `synchronize: true` está activado en `data-source.ts` para desarrollo, este paso podría no ser estrictamente necesario inicialmente.

5.  **Iniciar la Aplicación en Modo Desarrollo**:
    ```bash
    npm run dev
    ```
    El servidor se iniciará (por defecto en `http://localhost:3000` si `PORT` no está definido o es 3000).

## Scripts Disponibles

*   `npm start`: Inicia la aplicación usando `ts-node` (generalmente para desarrollo o entornos donde `ts-node` está disponible).
*   `npm run dev`: Inicia la aplicación en modo desarrollo usando `ts-node` (similar a `start`). Nodemon no está configurado por defecto en este script, pero puede ser añadido para reinicios automáticos.
*   `npm run build`: Compila el código TypeScript a JavaScript (salida en el directorio `dist/` por defecto, aunque no está explícitamente configurado en `tsconfig.json` para un `outDir` específico para este script, `tsc` lo manejará).
*   `npm run typeorm -- <comando-typeorm>`: Ejecuta comandos de la CLI de TypeORM.
    *   `npm run migration:generate src/migrations/NombreDeTuMigracion`: Genera un archivo de migración basado en los cambios de tus entidades.
    *   `npm run migration:run`: Aplica todas las migraciones pendientes a la base de datos.
    *   `npm run migration:revert`: Revierte la última migración aplicada.

## Endpoints Principales de la API (Ejemplos)

La API sigue un patrón RESTful. Algunos de los recursos principales son:

*   **Autenticación**:
    *   `POST /api/auth/login`
    *   `POST /api/auth/register` (si está implementado)
*   **Usuarios**:
    *   `GET /api/users`
    *   `GET /api/users/:id`
    *   `POST /api/users`
    *   `PUT /api/users/:id`
    *   `DELETE /api/users/:id`
*   **Productos**:
    *   `GET /api/products`
    *   `GET /api/products/:id`
    *   ... (otros endpoints CRUD)
*   **Pedidos**:
    *   `GET /api/orders`
    *   `POST /api/orders`
    *   `GET /api/orders/:id`
    *   `PUT /api/orders/:id/status`
    *   `POST /api/orders/:id/reprint`
*   **Gastos**:
    *   `GET /api/expenses`
    *   ... (otros endpoints CRUD)

Consulte el código en `src/routes/` para una lista completa y detallada de los endpoints y sus parámetros.

---

Este README provee una visión general. Para detalles específicos sobre la lógica de negocio o la implementación de endpoints, por favor refiérase al código fuente correspondiente. 