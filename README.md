# Isidro Libre Gourmet 🍽️

Sistema de gestión para restaurantes que permite administrar pedidos, productos, inventario y generar reportes.

## Características Principales 🌟

### Gestión de Pedidos
- Creación y seguimiento de pedidos en tiempo real
- Soporte para diferentes tipos de pedidos (local, para llevar, delivery)
- Impresión automática de tickets en impresora térmica
- Reimpresión de tickets
- Actualización de estado de pedidos
- Cancelación de pedidos

### Gestión de Productos
- Catálogo completo de productos
- Control de inventario
- Categorización de productos
- Gestión de precios y costos
- Alertas de stock bajo

### Reportes y Estadísticas
- Dashboard con métricas clave
- Estadísticas de ventas
- Productos más vendidos
- Análisis de rendimiento por producto
- Filtros por rango de fechas
- Visualizaciones gráficas

### Sistema de Usuarios
- Autenticación segura
- Roles de usuario (Administrador, Cajero)
- Control de acceso basado en roles

## Requisitos Técnicos 🛠️

### Backend
- Node.js (v14 o superior)
- PostgreSQL
- TypeScript
- Express.js
- TypeORM
- JWT para autenticación

### Frontend
- React
- TypeScript
- Tailwind CSS
- Chart.js para visualizaciones
- React Query para gestión de estado

### Hardware
- Impresora térmica compatible con ESC/POS
- Conexión de red para la impresora

## Instalación 📥

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/isidro-libre-gourmet.git
cd isidro-libre-gourmet
```

2. Instalar dependencias del backend:
```bash
cd backend
npm install
```

3. Instalar dependencias del frontend:
```bash
cd ../frontend
npm install
```

4. Configurar variables de entorno:
Crear archivo `.env` en la carpeta `backend`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=isidro_libre_gourmet
JWT_SECRET=tu_secreto_jwt
PRINTER_IP=192.168.1.100
PRINTER_PORT=9100
```

5. Iniciar la base de datos:
```bash
# Asegúrate de tener PostgreSQL instalado y corriendo
createdb isidro_libre_gourmet
```

6. Iniciar el servidor de desarrollo:
```bash
# Terminal 1 (Backend)
cd backend
npm run dev

# Terminal 2 (Frontend)
cd frontend
npm run dev
```

## Uso 🚀

1. Acceder a la aplicación:
   - URL: `http://localhost:5173`
   - Usuario por defecto: `admin`
   - Contraseña: `admin123`

2. Gestión de Pedidos:
   - Crear nuevo pedido
   - Seleccionar productos
   - Especificar tipo de pedido
   - Imprimir ticket
   - Actualizar estado

3. Gestión de Productos:
   - Agregar/editar productos
   - Actualizar inventario
   - Configurar precios
   - Ver alertas de stock

4. Reportes:
   - Seleccionar rango de fechas
   - Ver estadísticas de ventas
   - Analizar productos más vendidos
   - Exportar datos

## Contribución 🤝

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia 📄

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## Contacto 📧

- Nombre: [Tu Nombre]
- Email: [tu@email.com]
- Proyecto: [https://github.com/tu-usuario/isidro-libre-gourmet]

## Agradecimientos 🙏

- [TypeORM](https://typeorm.io/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Chart.js](https://www.chartjs.org/) 