import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // ELIMINADO
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

// const queryClient = new QueryClient(); // ELIMINADO

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
    // <QueryClientProvider client={queryClient}> // ELIMINADO
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={<Login />} />

            {/* Rutas Privadas */}
            <Route
              path="/"
              element={<PrivateRoute><Dashboard /></PrivateRoute>}
            />
            <Route
              path="/dashboard"
              element={<PrivateRoute><Dashboard /></PrivateRoute>}
            />
            <Route path="/users" element={<PrivateRoute><UsersPage /></PrivateRoute>} />
            <Route
              path="/products"
              element={<PrivateRoute><Products /></PrivateRoute>}
            />
            <Route
              path="/orders"
              element={<PrivateRoute><Orders /></PrivateRoute>}
            />
            <Route
              path="/pos"
              element={<PrivateRoute><POSPage /></PrivateRoute>}
            />
            <Route
              path="/settings"
              element={<PrivateRoute><Settings /></PrivateRoute>}
            />

            {/* Redirecciones */}
            <Route path="/" element={<Navigate to="/pos" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    // </QueryClientProvider> // ELIMINADO
  );
}
