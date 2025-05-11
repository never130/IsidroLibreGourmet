import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Solo mostrar el layout si el usuario está autenticado
  // PrivateRoute ya se encarga de la redirección si no está autenticado,
  // pero esta es una capa adicional por si Layout se usara incorrectamente.
  if (!isAuthenticated) {
    // En teoría, PrivateRoute ya debería haber redirigido.
    // Podrías retornar null o un mensaje, o incluso forzar un navigate aquí si es necesario.
    // Por simplicidad, si PrivateRoute funciona bien, esto no debería alcanzarse con frecuencia.
    return null; 
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <span className="text-xl font-semibold">IsidroLibre Gourmet</span>
            {user && <span className="ml-4 text-sm">Usuario: {user.username}</span>}
          </div>
          <button
            onClick={handleLogout}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold py-2 px-4 rounded-md transition-colors duration-150"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
      <footer className="bg-gray-100 text-gray-700 text-center p-4 mt-auto">
        <p>&copy; {new Date().getFullYear()} IsidroLibre Gourmet. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
} 