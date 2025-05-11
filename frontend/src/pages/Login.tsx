import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { LoginCredentials } from '../types/auth';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const credentials: LoginCredentials = {
      username: formData.get('username') as string,
      password: formData.get('password') as string,
    };

    try {
      await login(credentials);
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold">Iniciar Sesión</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Nombre de Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full p-2 border rounded-md"
              placeholder="Ingrese su nombre de usuario"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full p-2 border rounded-md"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
} 