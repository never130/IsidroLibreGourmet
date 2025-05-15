import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/user';
import { useState } from 'react'; // Necesario para el menú hamburguesa después
import { Menu, X } from 'lucide-react'; // Iconos para el menú hamburguesa

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const commonLinkClasses = "border-transparent text-gray-300 hover:border-gray-700 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium";
  const activeLinkClasses = "border-primary text-white"; // Definir clase para enlace activo si se implementa NavLink

  // TODO: Usar NavLink de react-router-dom para aplicar clases activas automáticamente

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Nombre del Restaurante */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-white">
                Isidro Libre y Gourmet
              </Link>
            </div>

            {/* Enlaces de Navegación (Desktop) */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {/* Grupo: Gestión Diaria */}
              <Link to="/pos" className={commonLinkClasses}>Punto de Venta</Link>
              <Link to="/orders" className={commonLinkClasses}>Pedidos</Link>
              
              {/* Grupo: Configuración de Menú y Stock */}
              <Link to="/products" className={commonLinkClasses}>Productos</Link>
              <Link to="/inventory/ingredients" className={commonLinkClasses}>Ingredientes</Link>

              {/* Grupo: Administración (Condicional) */}
              {user && (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) && (
                <>
                  <Link to="/dashboard" className={commonLinkClasses}>Dashboard</Link>
                  {user.role === UserRole.OWNER && (
                     <>
                        <Link to="/expenses" className={commonLinkClasses}>Gastos</Link>
                        <Link to="/reports" className={commonLinkClasses}>Reportes</Link>
                        <Link to="/users" className={commonLinkClasses}>Usuarios</Link>
                        <Link to="/settings" className={commonLinkClasses}>Configuración</Link>
                     </>
                  )}
                </>
              )}
            </div>

            {/* Usuario y Botón de Logout (Desktop) */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <span className="mr-4 text-sm text-gray-300">
                {user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username) : 'Usuario'}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500"
              >
                Cerrar Sesión
              </button>
            </div>

            {/* Botón de Menú Hamburguesa (Mobile) */}
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                type="button"
                className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Abrir menú principal</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menú Desplegable (Mobile) */}
        {isMobileMenuOpen && (
          <div className="sm:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link to="/pos" className={`${commonLinkClasses} block px-3 py-2 rounded-md text-base`}>Punto de Venta</Link>
              <Link to="/orders" className={`${commonLinkClasses} block px-3 py-2 rounded-md text-base`}>Pedidos</Link>
              <Link to="/products" className={`${commonLinkClasses} block px-3 py-2 rounded-md text-base`}>Productos</Link>
              <Link to="/inventory/ingredients" className={`${commonLinkClasses} block px-3 py-2 rounded-md text-base`}>Ingredientes</Link>
              
              {user && (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) && (
                <>
                  <Link to="/dashboard" className={`${commonLinkClasses} block px-3 py-2 rounded-md text-base`}>Dashboard</Link>
                  {user.role === UserRole.OWNER && (
                    <>
                      <Link to="/expenses" className={`${commonLinkClasses} block px-3 py-2 rounded-md text-base`}>Gastos</Link>
                      <Link to="/reports" className={`${commonLinkClasses} block px-3 py-2 rounded-md text-base`}>Reportes</Link>
                      <Link to="/users" className={`${commonLinkClasses} block px-3 py-2 rounded-md text-base`}>Usuarios</Link>
                      <Link to="/settings" className={`${commonLinkClasses} block px-3 py-2 rounded-md text-base`}>Configuración</Link>
                    </>
                  )}
                </>
              )}
            </div>
            {/* Usuario y Logout en móvil */}
            <div className="pt-4 pb-3 border-t border-gray-700">
                <div className="flex items-center px-5">
                    <div className="ml-3">
                        <div className="text-base font-medium leading-none text-white"> {user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username) : 'Usuario'}</div>
                        {user && <div className="text-sm font-medium leading-none text-gray-400">{user.email}</div>}
                    </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                    <button
                        onClick={handleLogout}
                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
          </div>
        )}
      </nav>

      {/* Contenido Principal de la Página */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* El título de la página ahora se muestra aquí, debajo del Navbar */}
          <div className="px-4 pb-6 sm:px-0 border-b border-border">
            <h1 className="text-3xl font-bold leading-tight text-foreground">{title}</h1>
          </div>
          <div className="px-4 py-6 sm:px-0">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 shadow-inner mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Isidro Libre y Gourmet. Todos los derechos reservados.
            </div>
            {/* Iconos sociales eliminados para simplificar, se pueden añadir después si se desea */}
          </div>
        </div>
      </footer>
    </div>
  );
} 