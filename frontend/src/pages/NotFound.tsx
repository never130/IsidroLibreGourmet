import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold mt-4">Página no encontrada</h2>
        <p className="text-muted-foreground mt-2">
          Lo sentimos, la página que buscas no existe.
        </p>
        <Link
          to="/"
          className="inline-block mt-6 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
} 