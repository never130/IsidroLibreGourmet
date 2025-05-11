import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '../types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  updateAuthData: (data: AuthResponse) => void;
  // register: (data: RegisterData) => Promise<void>; // Comentado temporalmente
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean; // Añadido para manejar el estado de carga inicial
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define una URL base para Axios si no se usa proxy o para builds de producción
// Para desarrollo con proxy, las URLs relativas como '/api/auth/login' funcionarán.
// Si necesitas una URL base explícita, descomenta y ajusta:
// axios.defaults.baseURL = 'http://localhost:3000'; 

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true); // Estado de carga inicial

  useEffect(() => {
    const verifyUserAndToken = async () => {
      const storedToken = localStorage.getItem('token'); // Leer token directamente aquí
      if (storedToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        try {
          // Endpoint corregido para obtener el perfil del usuario
          const response = await axios.get<User>('/api/users/me');
          setUser(response.data);
          // Opcional: Actualizar localStorage con los datos frescos del usuario si es necesario
          localStorage.setItem('user', JSON.stringify(response.data)); 
        } catch (error) {
          console.error('Error al verificar el token o cargar datos del usuario:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user'); 
          setToken(null);
          setUser(null);
          delete axios.defaults.headers.common['Authorization'];
        }
      } else {
        // Asegurarse de limpiar si no hay token (ej. estado inicial o logout explícito)
        delete axios.defaults.headers.common['Authorization'];
        setUser(null); // Asegurar que el usuario sea null si no hay token
      }
      setIsLoading(false);
    };

    verifyUserAndToken();
  }, [token]); // Dejar la dependencia en [token] es correcto, 
                  // ya que si el token cambia (ej. por login), este efecto se re-ejecutará.
                  // Sin embargo, para la carga inicial, el token se lee de localStorage dentro del efecto.
                  // Podríamos considerar ejecutarlo una sola vez al montar si el token solo se establece mediante login/logout.
                  // Pero con [token] se maneja también el caso de un token que se establece programáticamente.

  const login = async (credentials: LoginCredentials) => {
    try {
      // Endpoint corregido para el login
      const response = await axios.post<AuthResponse>('/api/users/login', credentials);
      const { token: newToken, user: loggedInUser } = response.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(loggedInUser)); // Guardar usuario en localStorage
      setToken(newToken);
      setUser(loggedInUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      console.error('Error de login:', error);
      // Limpiar en caso de error de login para evitar estado inconsistente
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
      throw error;
    }
  };

  // Función para actualizar datos de autenticación directamente
  const updateAuthData = (data: AuthResponse) => {
    const { token: newToken, user: updatedUser } = data;
    localStorage.setItem('token', newToken); // Asumimos que el token puede o no cambiar
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setToken(newToken);
    setUser(updatedUser);
    // Actualizar el header por si el token ha cambiado (aunque al actualizar perfil usualmente no cambia)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  // const register = async (data: RegisterData) => { // Comentado temporalmente
  //   try {
  //     const response = await axios.post<AuthResponse>('/api/users/register', data);
  //     const { token, user } = response.data;
  //     localStorage.setItem('token', token);
  //     setToken(token);
  //     setUser(user);
  //   } catch (error) {
  //     console.error('Error de registro:', error);
  //     throw error;
  //   }
  // };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      updateAuthData,
      // register, // Comentado temporalmente
      logout,
      isAuthenticated: !!token && !isLoading, // Solo autenticado si hay token y no está cargando
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 