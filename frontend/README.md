# Isidro Libre Gourmet - Frontend

Este es el frontend de la aplicación Isidro Libre Gourmet, un sistema de gestión para restaurantes.

## Características

- Gestión de pedidos
- Gestión de productos
- Gestión de gastos
- Reportes y estadísticas
- Configuración del negocio
- Gestión de usuarios

## Tecnologías

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Zod
- Axios

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/isidro-libre-gourmet.git
cd isidro-libre-gourmet/frontend
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo de variables de entorno:
```bash
cp .env.example .env
```

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

## Scripts

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run lint`: Ejecuta el linter
- `npm run preview`: Previsualiza la versión de producción

## Estructura del Proyecto

```
src/
  ├── components/     # Componentes reutilizables
  ├── contexts/       # Contextos de React
  ├── hooks/         # Hooks personalizados
  ├── pages/         # Páginas de la aplicación
  ├── services/      # Servicios y APIs
  ├── types/         # Tipos de TypeScript
  ├── utils/         # Utilidades
  ├── App.tsx        # Componente principal
  └── main.tsx       # Punto de entrada
```

## Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
