# Frontend Isidro Libre Gourmet

Interfaz de usuario para el sistema de gestión Isidro Libre Gourmet. Desarrollado con React, Vite, TypeScript y Tailwind CSS.

## Características Principales

*   Visualización y gestión de datos proporcionados por el backend.
*   Interfaz intuitiva para operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre entidades como Usuarios, Productos, Pedidos, etc.
*   Comunicación con la API del backend mediante Axios.
*   Manejo del estado del servidor y caching con TanStack Query (React Query).
*   Enrutamiento del lado del cliente con React Router.
*   Componentes de UI estilizados con Tailwind CSS y Shadcn/UI (basado en las dependencias como `@radix-ui/*` y `lucide-react`).
*   Validación de formularios con React Hook Form y Zod.

## Tecnologías Utilizadas

*   **React**: Biblioteca de JavaScript para construir interfaces de usuario.
*   **Vite**: Herramienta de compilación frontend extremadamente rápida.
*   **TypeScript**: Superset de JavaScript que añade tipado estático.
*   **Tailwind CSS**: Framework CSS de utilidad primero para un diseño rápido.
*   **TanStack Query (React Query)**: Para la obtención, almacenamiento en caché y actualización de datos del servidor en React.
*   **Axios**: Cliente HTTP basado en promesas para el navegador y Node.js.
*   **React Router DOM**: Para el enrutamiento declarativo en aplicaciones React.
*   **React Hook Form**: Para la gestión de formularios y validación.
*   **Zod**: Biblioteca de validación de esquemas con inferencia de tipos estáticos.
*   **Shadcn/UI (componentes Radix UI + Lucide Icons)**: Componentes de UI bien diseñados y accesibles.
*   **clsx, tailwind-merge**: Utilidades para la gestión de clases CSS.

## Estructura del Proyecto

El código fuente principal se encuentra en la carpeta `src/`:

*   `src/components/`: Componentes reutilizables de React.
    *   `src/components/ui/`: Componentes de UI base (probablemente de Shadcn/UI).
    *   `src/components/layout/`: Componentes de estructura de página (ej. `MainLayout`).
    *   Otros componentes específicos de funcionalidades (ej. `src/components/users/UserFormModal.tsx`).
*   `src/pages/`: Componentes de React que representan las diferentes páginas de la aplicación (ej. `UsersPage.tsx`).
*   `src/lib/`: Utilidades y lógica auxiliar (ej. `utils.ts` si existe, configuración de Axios).
*   `src/services/` o `src/api/`: Funciones para interactuar con la API del backend.
*   `src/hooks/`: Hooks personalizados de React.
*   `src/types/`: Definiciones de tipos de TypeScript (ej. `user.ts`).
*   `src/App.tsx`: Componente raíz de la aplicación donde se configura el enrutamiento principal.
*   `src/main.tsx`: Punto de entrada principal de la aplicación Vite.

Archivos de configuración importantes en la raíz del frontend:

*   `vite.config.ts`: Configuración de Vite.
*   `tailwind.config.js`: Configuración de Tailwind CSS.
*   `tsconfig.json`: Configuración del compilador de TypeScript.
*   `postcss.config.js`: Configuración de PostCSS.

## Configuración

### Variables de Entorno

El frontend puede requerir la configuración de la URL base de la API del backend. Esto generalmente se hace creando un archivo `.env` en la raíz del directorio `frontend/`.

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Reemplace `http://localhost:3000` con la URL donde se está ejecutando su backend si es diferente. Vite expone las variables de entorno que comienzan con `VITE_` al código del cliente.

## Cómo Empezar

1.  **Clonar el Repositorio** (si aún no lo ha hecho y está en un repositorio separado, o navegar al directorio):
    ```bash
    # Si es parte del mismo repositorio del backend:
    cd <nombre-del-repositorio>/frontend
    ```

2.  **Instalar Dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**:
    Cree y configure el archivo `.env` en la raíz de `frontend/` como se describe en la sección "Variables de Entorno" (si es necesario).

4.  **Iniciar la Aplicación en Modo Desarrollo**:
    ```bash
    npm run dev
    ```
    Vite iniciará el servidor de desarrollo (generalmente en `http://localhost:5173` o un puerto similar) y abrirá la aplicación en su navegador.

## Scripts Disponibles

*   `npm run dev`: Inicia el servidor de desarrollo de Vite con Hot Module Replacement (HMR).
*   `npm run build`: Compila la aplicación para producción. Incluye la compilación de TypeScript (`tsc`) y luego la compilación de Vite (`vite build`). Los archivos resultantes se generan típicamente en una carpeta `dist/`.
*   `npm run preview`: Sirve localmente los archivos generados por `npm run build` para previsualizar la aplicación de producción.

---

Este README provee una visión general. Para detalles específicos sobre componentes o lógica de la interfaz, por favor refiérase al código fuente correspondiente.
