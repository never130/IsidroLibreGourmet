import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { Layout } from './components/layout/Layout';
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
import { MainLayout } from './components/layout/MainLayout';
import { Toaster } from "@/components/ui/toaster";
import { UnitsOfMeasurePage } from './pages/Inventory/UnitsOfMeasurePage';
import IngredientsPage from './pages/Inventory/IngredientsPage';
import RecipesPage from './pages/Inventory/RecipesPage';

const queryClient = new QueryClient();

// Componente para rutas privadas
const PrivateRouteComponent: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Cargando...</p></div>;
  }

  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={<Login />} />

            {/* Rutas Privadas */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <MainLayout title="Isidro Libre Gourmet">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/inventory/units" element={<UnitsOfMeasurePage />} />
                      <Route path="/inventory/ingredients" element={<IngredientsPage />} />
                      <Route path="/inventory/recipes" element={<RecipesPage />} />
                      <Route path="/users" element={<UsersPage />} />
                      <Route
                        path="/orders"
                        element={<Orders />}
                      />
                      <Route
                        path="/pos"
                        element={<POSPage />}
                      />
                      <Route
                        path="/settings"
                        element={<Settings />}
                      />
                      <Route path="settings/users" element={<UsersPage />} />
                      <Route index element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </MainLayout>
                </PrivateRoute>
              }
            />

            {/* Redirecciones */}
            <Route path="/" element={<Navigate to="/pos" replace />} />

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
