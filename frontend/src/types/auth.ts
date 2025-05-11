export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  CASHIER = 'cashier',
  DEVELOPER = 'developer'
  // EMPLOYEE ya no se usa, se reemplaza por roles más específicos como CASHIER
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
  // Los siguientes campos no son devueltos actualmente por /api/auth/profile o /api/auth/login
  // Si son necesarios globalmente, el backend debería incluirlos.
  // Por ahora, los comentamos para evitar errores con undefined.
  // createdAt: string;
  // updatedAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
} 