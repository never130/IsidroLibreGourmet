# Isidro Libre Gourmet - Sistema de Gestión Integral

Bienvenido al repositorio del proyecto Isidro Libre Gourmet, un sistema de gestión completo diseñado para restaurantes y negocios de comida. Esta solución se compone de un backend robusto para la gestión de datos y lógica de negocio, y un frontend intuitivo para la interacción del usuario.

## Descripción General del Proyecto

Isidro Libre Gourmet tiene como objetivo proporcionar una herramienta digital completa para administrar eficientemente las operaciones diarias de un negocio gastronómico. Esto incluye:

*   Gestión de Pedidos (para comer en local, para llevar, delivery)
*   Administración de Productos y Menú (con control de stock)
*   Gestión de Clientes
*   Registro y Control de Gastos
*   Gestión de Usuarios y Roles (cajeros, administradores, etc.)
*   Generación de Reportes básicos
*   Impresión de Comandas y Recibos

## Componentes del Sistema

El proyecto está dividido en dos componentes principales:

### 1. Backend

*   **Propósito**: API RESTful que maneja toda la lógica de negocio, la interacción con la base de datos y la autenticación.
*   **Tecnologías Clave**: Node.js, Express.js, TypeScript, TypeORM, PostgreSQL.
*   **Ubicación**: Directorio `/backend`
*   **README Detallado**: [backend/README.md](./backend/README.md)

### 2. Frontend

*   **Propósito**: Interfaz de usuario web interactiva que permite a los usuarios interactuar con el sistema.
*   **Tecnologías Clave**: React, Vite, TypeScript, Tailwind CSS, TanStack Query.
*   **Ubicación**: Directorio `/frontend`
*   **README Detallado**: [frontend/README.md](./frontend/README.md)

## Cómo Empezar

Para poner en marcha el sistema completo, necesitarás configurar y ejecutar tanto el backend como el frontend.

### Prerrequisitos Generales

*   Node.js (v18 o superior recomendado)
*   npm (v9 o superior recomendado) o yarn
*   Git
*   Una instancia de PostgreSQL en ejecución.

### Pasos Generales

1.  **Clonar el Repositorio**:
    ```bash
    git clone <url-del-repositorio-isidro-libre-gourmet>
    cd IsidroLibreGourmet
    ```

2.  **Configurar y Ejecutar el Backend**:
    *   Navega al directorio del backend: `cd backend`
    *   Sigue las instrucciones detalladas en el [README del Backend](./backend/README.md) para instalar dependencias, configurar variables de entorno (base de datos, JWT, impresoras) y arrancar el servidor.

3.  **Configurar y Ejecutar el Frontend**:
    *   Navega al directorio del frontend: `cd ../frontend` (o `cd frontend` desde la raíz del proyecto)
    *   Sigue las instrucciones detalladas en el [README del Frontend](./frontend/README.md) para instalar dependencias, configurar variables de entorno (principalmente la URL del API del backend) y arrancar la aplicación de desarrollo.

Una vez que ambos servicios (backend y frontend) estén en ejecución, deberías poder acceder a la aplicación frontend a través de tu navegador (generalmente en una dirección como `http://localhost:5173`) y esta se comunicará con el backend (generalmente en `http://localhost:3000`).

## Estructura del Repositorio

```
IsidroLibreGourmet/
├── backend/        # Código fuente y README del Backend
│   ├── src/
│   ├── package.json
│   └── README.md
├── frontend/       # Código fuente y README del Frontend
│   ├── src/
│   ├── package.json
│   └── README.md
└── README.md       # Este archivo (README Principal)
```

## Contribuciones

Las contribuciones son bienvenidas. Por favor, consulta los READMEs específicos de cada componente para más detalles sobre cómo contribuir a cada parte del proyecto.

## Licencia

Este proyecto puede estar bajo una licencia específica. Consulta el archivo `LICENSE` en el directorio correspondiente si existe. (Nota: Se añadió una licencia ISC en el backend/package.json, considera añadir un archivo LICENSE.md en la raíz o en cada subproyecto).

---

Por favor, revisa los READMEs individuales en las carpetas `backend` y `frontend` para obtener instrucciones de configuración y desarrollo más detalladas. 