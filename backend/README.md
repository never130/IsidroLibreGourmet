# Backend Isidro Libre Gourmet

Este es el backend para la aplicación Isidro Libre Gourmet. Proporciona una API RESTful para gestionar pedidos, productos (con recetas e ingredientes), usuarios, gastos y otras operaciones del negocio. Desarrollado con Node.js, Express, TypeScript y TypeORM.

## Características Principales

*   **Gestión de Usuarios**: Autenticación con JWT, roles de usuario.
*   **Gestión de Productos**: CRUD completo, categorías, control de stock básico.
*   **Gestión de Ingredientes**: CRUD, unidades de medida (enum), control de stock, alertas de stock bajo.
*   **Gestión de Recetas**: Creación de recetas como una lista de ingredientes y cantidades asociadas a cada producto.
*   **Gestión de Pedidos**: Creación, actualización de estado (PENDING, COMPLETED, CANCELLED), cálculo de totales.
*   **Descuento Automático de Stock**: Al completar un pedido, se descuenta automáticamente el stock de los ingredientes correspondientes según las recetas de los productos vendidos.
*   **Transaccionalidad (Parcial/En Desarrollo)**: Preparado para operaciones transaccionales en servicios críticos para asegurar la integridad de los datos.
*   **Gestión de Gastos** (Estructura básica).
*   **Configuración del Negocio** (Placeholder).
*   **Impresión de Comandas/Recibos**: (Integración con `node-thermal-printer`, configuración básica).
*   Validación de DTOs para las solicitudes de la API.

## Tecnologías Utilizadas

*   **Node.js**: Entorno de ejecución para JavaScript en el servidor.
*   **Express.js**: Framework web para Node.js.
*   **TypeScript**: Superset de JavaScript que añade tipado estático.
*   **TypeORM**: ORM para TypeScript y JavaScript, para la interacción con la base de datos PostgreSQL.
*   **PostgreSQL**: Sistema de gestión de bases de datos relacional.
*   **JSON Web Tokens (JWT)**: Para la autenticación de usuarios.
*   **class-validator & class-transformer**: Para la validación y transformación de DTOs.
*   **dotenv**: Para gestionar variables de entorno.
*   **bcrypt**: Para el hashing de contraseñas.
*   **node-thermal-printer**: Para la comunicación con impresoras térmicas (configuración básica).
*   **cors**: Para habilitar Cross-Origin Resource Sharing.

## Estructura del Proyecto

El código fuente principal se encuentra en la carpeta `src/`:

*   `src/controllers/`: Manejan la lógica de las solicitudes HTTP y las respuestas.
*   `src/dtos/`: Definen los Objetos de Transferencia de Datos (DTOs) para la validación de datos de entrada.
*   `src/entities/`: Definen las entidades de TypeORM que mapean a las tablas de la base de datos.
*   `src/enums/`: Contiene enumeraciones TypeScript (ej. `IngredientUnit`, `OrderStatus`).
*   `src/middleware/`: Contiene middlewares de Express (ej. `authMiddleware`, `roleMiddleware`, `validationMiddleware`).
*   `src/migrations/`: (Si se usa activamente) Contiene las migraciones de base de datos generadas por TypeORM.
*   `src/routes/`: Define las rutas de la API y las asocia con los controladores y middlewares.
*   `src/services/`: Contiene la lógica de negocio y servicios reutilizables (ej. `OrderService`, `IngredientService`, `RecipeService`, `PrinterService`).
*   `src/utils/`: Utilidades generales (ej. `HttpException`).
*   `src/data-source.ts`: Configuración de la conexión a la base de datos para TypeORM.
*   `src/index.ts`: Punto de entrada principal de la aplicación Express.

## Configuración

### 1. Variables de Entorno

Cree un archivo `.env` en la raíz del directorio `backend/` con las siguientes variables:

```env
# Configuración de la Base de Datos
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario_postgres
DB_PASSWORD=tu_contraseña_postgres
DB_NAME=isidro_libre_gourmet
DB_SYNCHRONIZE=true # true para desarrollo (auto-crea tablas), false para producción (usar migraciones)
DB_LOGGING=false # true para ver queries SQL en consola

# Configuración de Autenticación (JWT)
JWT_SECRET=tu_secreto_jwt_super_seguro_y_largo # ¡CAMBIAR EN PRODUCCIÓN!
# JWT_EXPIRES_IN=1d # (Opcional, si se usa directamente en jwt.sign, si no, se usa la configuración por defecto)

# Entorno de Node
NODE_ENV=development # Cambiar a 'production' en producción
PORT=3000 # Puerto en el que correrá el servidor backend

# Configuración de Impresoras (Ejemplos)
# KITCHEN_PRINTER_IP=TU_IP_IMPRESORA_COCINA
# KITCHEN_PRINTER_PORT=9100
# O para USB (Linux/macOS):
# KITCHEN_PRINTER_PATH=/dev/usb/lp0
# O para USB (Windows):
# KITCHEN_PRINTER_NAME=POS-80
```

Asegúrese de reemplazar los valores de placeholder con su configuración real. **Es crucial cambiar `JWT_SECRET` por una cadena larga, aleatoria y segura en un entorno de producción.**

### 2. Base de Datos

Asegúrese de tener una instancia de PostgreSQL en ejecución y accesible con las credenciales proporcionadas en el archivo `.env`. La base de datos especificada en `DB_NAME` debe existir.
*   **Desarrollo**: Si `DB_SYNCHRONIZE=true` en `.env` (y reflejado en `data-source.ts`), TypeORM intentará crear/actualizar las tablas automáticamente según las entidades.
*   **Producción**: Se recomienda encarecidamente usar `DB_SYNCHRONIZE=false` y gestionar los cambios de esquema mediante migraciones de TypeORM.

## Cómo Empezar

1.  **Navegar al Directorio del Backend**:
    Asegúrate de estar en la carpeta `backend` del proyecto.

2.  **Instalar Dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**:
    Cree y configure el archivo `.env` como se describe arriba.

4.  **Ejecutar Migraciones (Recomendado, especialmente para Producción)**:
    Si está gestionando cambios en el esquema de la base de datos mediante migraciones:
    ```bash
    # Para generar una nueva migración después de cambios en las entidades:
    # npm run migration:generate src/migrations/NombreDeLaMigracion
    # Para ejecutar las migraciones pendientes:
    npm run migration:run
    ```

5.  **Iniciar la Aplicación**:
    ```bash
    npm run dev
    ```
    El servidor se iniciará (por defecto en `http://localhost:3000`). `ts-node` compilará y ejecutará el código TypeScript. Para reinicios automáticos en desarrollo, considera usar `nodemon` con `ts-node`.

## Scripts Disponibles

*   `npm start` o `npm run dev`: Inicia la aplicación usando `ts-node`.
*   `npm run build`: Compila el código TypeScript a JavaScript (la salida por defecto es en la misma estructura de carpetas dentro de `dist/` si `outDir` está configurado en `tsconfig.json`, o en el mismo sitio si no).
*   `npm run typeorm -- <comando-typeorm>`: Ejecuta comandos de la CLI de TypeORM utilizando la configuración de `src/data-source.ts`.
    *   `npm run migration:generate src/migrations/NombreDeTuMigracion`: Genera un archivo de migración.
    *   `npm run migration:run`: Aplica todas las migraciones pendientes.
    *   `npm run migration:revert`: Revierte la última migración aplicada.

## Endpoints Principales de la API (Ejemplos)

La API sigue un patrón RESTful. Algunos de los recursos principales son:

*   **Autenticación**: `POST /api/auth/login`, `GET /api/users/me`
*   **Usuarios**: `GET, POST /api/users`, `GET, PUT, DELETE /api/users/:id`
*   **Productos**: `GET, POST /api/products`, `GET, PUT, DELETE /api/products/:id`
*   **Ingredientes**: `GET, POST /api/inventory/ingredients`, `GET, PUT, DELETE /api/inventory/ingredients/:id`
*   **Recetas**: `GET, POST /api/recipes`, `GET, PUT, DELETE /api/recipes/:id`, `GET /api/recipes/product/:productId`
*   **Pedidos**: `GET, POST /api/orders`, `GET /api/orders/:id`, `PATCH /api/orders/:id/status`, `POST /api/orders/:id/complete`, `POST /api/orders/:id/cancel`, `POST /api/orders/:id/reprint`
*   **Gastos**: (Rutas a definir)

Consulte el código en `src/routes/` para una lista completa y detallada de los endpoints, sus parámetros y los middlewares aplicados.

---

Este README provee una visión general. Para detalles específicos sobre la lógica de negocio o la implementación de endpoints, por favor refiérase al código fuente correspondiente. 