# Frontend Isidro Libre Gourmet

Interfaz de usuario para el sistema de gestión Isidro Libre Gourmet. Desarrollado con React, Vite, TypeScript y Tailwind CSS, utilizando Shadcn/UI para los componentes.

## Características Principales

*   **Dashboard Principal**: Vista general y accesos directos.
*   **Punto de Venta (POS)**: Interfaz para la creación rápida de pedidos, selección de productos y procesamiento de ventas.
*   **Gestión de Pedidos**: Listado, visualización de detalles y actualización de estados de los pedidos.
*   **Gestión de Productos**: CRUD completo para productos, incluyendo asignación de precios, costos, categorías y gestión de stock.
*   **Gestión de Recetas**: Definición de recetas (ingredientes y cantidades) directamente asociadas a los productos.
*   **Gestión de Ingredientes**: CRUD para ingredientes, control de stock y unidades de medida.
*   **Autenticación de Usuarios**: Login y protección de rutas.
*   **Gestión de Usuarios**: (Para roles de administrador) CRUD de usuarios y asignación de roles.
*   **Manejo de Stock**: Descuento automático del stock de ingredientes al completar pedidos basados en las recetas de los productos.
*   Interfaz intuitiva para todas las operaciones CRUD.
*   Comunicación con la API del backend mediante Axios.
*   Manejo eficiente del estado del servidor y caching con TanStack Query (React Query).
*   Enrutamiento del lado del cliente con React Router.
*   Componentes de UI estilizados con Tailwind CSS y Shadcn/UI.
*   Validación de formularios robusta con React Hook Form y Zod.

## Tecnologías Utilizadas

*   **React 18**: Biblioteca de JavaScript para construir interfaces de usuario.
*   **Vite**: Herramienta de compilación frontend extremadamente rápida.
*   **TypeScript**: Superset de JavaScript que añade tipado estático.
*   **Tailwind CSS**: Framework CSS de utilidad primero para un diseño rápido.
*   **Shadcn/UI**: Colección de componentes de UI reutilizables, construidos sobre Radix UI y Tailwind CSS.
*   **TanStack Query (React Query) v5**: Para la obtención, almacenamiento en caché y actualización de datos del servidor.
*   **Axios**: Cliente HTTP basado en promesas.
*   **React Router DOM v6**: Para el enrutamiento declarativo.
*   **React Hook Form v7**: Para la gestión de formularios y validación.
*   **Zod**: Biblioteca de validación de esquemas con inferencia de tipos estáticos.
*   **Lucide Icons**: Iconos vectoriales.
*   **clsx, tailwind-merge**: Utilidades para la gestión de clases CSS.
*   **Sonner**: Para notificaciones (toasts).

## Estructura del Proyecto

El código fuente principal se encuentra en la carpeta `src/`:

*   `src/components/`: Componentes reutilizables de React.
    *   `src/components/ui/`: Componentes de UI base (generados por Shadcn/UI).
    *   `src/components/layout/`: Componentes de estructura de página (ej. `MainLayout.tsx`, `Layout.tsx`).
    *   Componentes específicos de módulos/funcionalidades (ej. `src/components/products/ProductForm.tsx`, `src/components/inventory/ingredients/IngredientFormModal.tsx`).
*   `src/pages/`: Componentes de React que representan las diferentes páginas/vistas de la aplicación (ej. `DashboardPage.tsx`, `POSPage.tsx`, `Inventory/IngredientsPage.tsx`).
*   `src/contexts/`: Contextos de React (ej. `AuthContext.tsx`).
*   `src/services/`: Funciones para interactuar con la API del backend (ej. `productService.ts`, `orderService.ts`).
*   `src/hooks/`: Hooks personalizados de React (si los hay).
*   `src/types/`: Definiciones de tipos e interfaces de TypeScript (ej. `product.ts`, `order.ts`).
*   `src/App.tsx`: Componente raíz de la aplicación donde se configura el enrutamiento principal y los proveedores de contexto.
*   `src/main.tsx`: Punto de entrada principal de la aplicación Vite, donde se renderiza `App.tsx`.

Archivos de configuración importantes en la raíz del frontend:

*   `vite.config.ts`: Configuración de Vite.
*   `tailwind.config.js`: Configuración de Tailwind CSS.
*   `tsconfig.json`: Configuración del compilador de TypeScript.
*   `postcss.config.js`: Configuración de PostCSS.
*   `components.json`: Configuración de Shadcn/UI.

## Configuración

### Variables de Entorno

El frontend puede requerir la configuración de la URL base de la API del backend. Esto se hace creando un archivo `.env` en la raíz del directorio `frontend/`.

Ejemplo de archivo `.env`:
```env
VITE_API_URL=http://localhost:3000
```

Reemplace `http://localhost:3000` con la URL donde se está ejecutando su backend si es diferente. En el código, esta variable se accede como `import.meta.env.VITE_API_URL`.
 Asegúrese de que la URL **no** termine en `/api` si sus servicios de Axios ya añaden `/api/...` a las rutas. Si `VITE_API_URL` incluye `/api`, entonces los servicios deben llamar a, por ejemplo, `/users` en lugar de `/api/users`. (Basado en `POSPage.tsx`, parece que `VITE_API_URL` no incluye `/api`, y los servicios construyen la ruta completa como `${apiUrl}/api/orders/...`, lo cual es correcto si `VITE_API_URL` es solo `http://localhost:3000`).

## Cómo Empezar

1.  **Navegar al Directorio del Frontend**:
    Asegúrate de estar en la carpeta `frontend` del proyecto.

2.  **Instalar Dependencias**:
    Si es la primera vez o si las dependencias han cambiado:
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**:
    Cree y configure el archivo `.env` en la raíz de `frontend/` como se describe en la sección "Variables de Entorno".

4.  **Iniciar la Aplicación en Modo Desarrollo**:
    ```bash
    npm run dev
    ```
    Vite iniciará el servidor de desarrollo (generalmente en `http://localhost:5173` o un puerto similar) y abrirá la aplicación en su navegador. El HMR (Hot Module Replacement) actualizará la aplicación automáticamente al guardar cambios.

## Scripts Disponibles

*   `npm run dev`: Inicia el servidor de desarrollo de Vite.
*   `npm run build`: Compila la aplicación para producción. Incluye la verificación de tipos de TypeScript (`tsc`) y luego la compilación de Vite (`vite build`). Los archivos optimizados se generan en la carpeta `dist/`.
*   `npm run preview`: Sirve localmente los archivos generados por `npm run build` para previsualizar la aplicación de producción.

---

Este README provee una visión general. Para detalles específicos sobre componentes o lógica de la interfaz, por favor refiérase al código fuente correspondiente.
