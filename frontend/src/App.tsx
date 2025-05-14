import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserRole } from './types/user';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Products } from './pages/Products';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { POSPage } from './pages/POSPage';
import { NotFound } from './pages/NotFound';
import { UsersPage } from './pages/UsersPage';
import { IngredientsPage } from './pages/Inventory/IngredientsPage';
import { MainLayout } from './components/layout/MainLayout';
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient();

// Componente para rutas privadas actualizado
interface PrivateRouteComponentProps {
  children: JSX.Element;
  allowedRoles?: UserRole[];
}

const PrivateRouteComponent: React.FC<PrivateRouteComponentProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Cargando...</p></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={<Login />} />

            {/* Rutas Privadas Reestructuradas */}
            <Route
              path="/dashboard"
              element={
                <PrivateRouteComponent>
                  <MainLayout title="Dashboard">
                    <Dashboard />
                  </MainLayout>
                </PrivateRouteComponent>
              }
            />
            <Route
              path="/products"
              element={
                <PrivateRouteComponent>
                  <MainLayout title="Productos">
                    <Products />
                  </MainLayout>
                </PrivateRouteComponent>
              }
            />
            <Route
              path="/expenses"
              element={
                <PrivateRouteComponent allowedRoles={[UserRole.OWNER]}>
                  <MainLayout title="Gastos">
                    <Expenses />
                  </MainLayout>
                </PrivateRouteComponent>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRouteComponent allowedRoles={[UserRole.OWNER]}>
                  <MainLayout title="Reportes">
                    <Reports />
                  </MainLayout>
                </PrivateRouteComponent>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateRouteComponent allowedRoles={[UserRole.OWNER]}>
                  <MainLayout title="Usuarios">
                    <UsersPage />
                  </MainLayout>
                </PrivateRouteComponent>
              }
            />
            <Route
              path="/orders"
              element={
                <PrivateRouteComponent>
                  <MainLayout title="Pedidos">
                    <Orders />
                  </MainLayout>
                </PrivateRouteComponent>
              }
            />
            <Route
              path="/pos"
              element={
                <PrivateRouteComponent>
                  <MainLayout title="Punto de Venta">
                    <POSPage />
                  </MainLayout>
                </PrivateRouteComponent>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRouteComponent allowedRoles={[UserRole.OWNER]}>
                  <MainLayout title="Configuración">
                    <Settings />
                  </MainLayout>
                </PrivateRouteComponent>
              }
            />
            <Route
              path="/inventory/ingredients"
              element={
                <PrivateRouteComponent allowedRoles={[UserRole.OWNER, UserRole.ADMIN]}>
                  <MainLayout title="Ingredientes">
                    <IngredientsPage />
                  </MainLayout>
                </PrivateRouteComponent>
              }
            />
             {/* Ruta específica para settings/users si es diferente a /users */}
             <Route
              path="/settings/users" 
              element={
                <PrivateRouteComponent allowedRoles={[UserRole.OWNER]}>
                  <MainLayout title="Usuarios (Configuración)">
                    <UsersPage />
                  </MainLayout>
                </PrivateRouteComponent>
              }
            />

            {/* Redirección principal si el usuario está autenticado y va a "/" */}
            <Route
              path="/"
              element={
                <PrivateRouteComponent>
                  <Navigate to="/dashboard" replace />
                </PrivateRouteComponent>
              }
            />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
