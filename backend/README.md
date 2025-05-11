# Isidro Libre Gourmet - Backend

Backend para el sistema de gestión de Isidro Libre Gourmet.

## Requisitos

- Node.js 18 o superior
- PostgreSQL 14 o superior

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/your-username/isidro-libre-gourmet.git
cd isidro-libre-gourmet/backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```
Editar el archivo `.env` con los valores correspondientes.

4. Iniciar la base de datos:
```bash
# Crear la base de datos
createdb isidro_libre_gourmet

# Ejecutar migraciones
npm run migration:run
```

5. Iniciar el servidor:
```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## Estructura del Proyecto

```
src/
├── controllers/     # Controladores de la aplicación
├── dtos/           # Objetos de transferencia de datos
├── entities/       # Entidades de la base de datos
├── middleware/     # Middleware de la aplicación
├── routes/         # Rutas de la API
├── data-source.ts  # Configuración de TypeORM
└── index.ts        # Punto de entrada de la aplicación
```

## API Endpoints

### Usuarios
- `POST /api/users/login` - Iniciar sesión
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/:id` - Obtener un usuario
- `POST /api/users` - Crear un usuario
- `PATCH /api/users/:id` - Actualizar un usuario
- `DELETE /api/users/:id` - Eliminar un usuario

### Productos
- `GET /api/products` - Obtener todos los productos
- `GET /api/products/:id` - Obtener un producto
- `POST /api/products` - Crear un producto
- `PATCH /api/products/:id` - Actualizar un producto
- `DELETE /api/products/:id` - Eliminar un producto

### Pedidos
- `GET /api/orders` - Obtener todos los pedidos
- `GET /api/orders/active` - Obtener pedidos activos
- `GET /api/orders/:id` - Obtener un pedido
- `POST /api/orders` - Crear un pedido
- `PATCH /api/orders/:id/status` - Actualizar estado de un pedido
- `POST /api/orders/:id/cancel` - Cancelar un pedido
- `POST /api/orders/:id/reprint` - Reimprimir un pedido

### Gastos
- `GET /api/expenses` - Obtener todos los gastos
- `GET /api/expenses/date-range` - Obtener gastos por rango de fechas
- `GET /api/expenses/category/:category` - Obtener gastos por categoría
- `GET /api/expenses/:id` - Obtener un gasto
- `POST /api/expenses` - Crear un gasto
- `PATCH /api/expenses/:id` - Actualizar un gasto
- `DELETE /api/expenses/:id` - Eliminar un gasto

### Reportes
- `GET /api/reports/sales` - Obtener estadísticas de ventas
- `GET /api/reports/expenses` - Obtener estadísticas de gastos
- `GET /api/reports/products` - Obtener estadísticas de productos

## Roles de Usuario

- `OWNER` - Propietario del negocio
- `DEVELOPER` - Desarrollador del sistema
- `EMPLOYEE` - Empleado del negocio

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 