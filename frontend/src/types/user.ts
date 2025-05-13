import { Order } from './order'; // Puede ser necesario si User incluye lista de orders
import { UserRole as AuthUserRole } from './auth'; // <-- Importar UserRole y renombrar

export { AuthUserRole as UserRole }; // Re-exportar

// Interfaz para la información resumida del usuario, ej: para createdBy en Order
export interface UserSummary {
  id: number;
  username: string;
  role?: AuthUserRole; // Role podría ser útil en resúmenes
}

// Interfaz para el objeto User completo (como se recibiría del backend, ej: /api/users/profile)
export interface User {
  id: number;
  username: string;
  firstName: string; // Asumimos que siempre habrá un firstName
  lastName: string;  // Asumimos que siempre habrá un lastName
  // email?: string | null; // Comentado si no es un campo principal para el CRUD de usuarios
  role: AuthUserRole;
  isActive: boolean;
  lastLogin?: string | null; // Asumir que fechas vienen como string ISO
  // orders?: Partial<Order>[]; // Omitir si no es necesario en el contexto general del usuario
  createdAt: string;          // Asumir que fechas vienen como string ISO
  updatedAt: string;
}

// DTO para crear un usuario
export interface CreateUserDto {
  username: string;
  firstName: string;
  lastName: string;
  password?: string; // Password es usualmente requerido en la creación.
                   // El backend lo esperará. Frontend no lo debe enviar vacío.
  role: AuthUserRole;
  isActive?: boolean; // Opcional, el backend podría tener un default (e.g., true)
}

// DTO para actualizar un usuario
// El password se manejaría por un endpoint/flujo separado si se quiere cambiar.
// No se permite cambiar username usualmente.
export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: AuthUserRole;
  isActive?: boolean;
  password?: string; // Añadido para permitir cambio de contraseña opcional
}

// Tipo para los datos del formulario de usuario. Puede ser más general
// y luego mapearse a CreateUserDto o UpdateUserDto.
export type UserFormData = {
  username: string;        // username siempre es string en el form, deshabilitado en edición.
  firstName: string;
  lastName: string;
  password?: string;        // Opcional en el form, validación Zod se encarga del resto.
  confirmPassword?: string; 
  role: AuthUserRole;
  isActive: boolean;
};

// DTO para actualizar el perfil del usuario (ejemplo, si existiera un endpoint)
/*
export interface UpdateUserProfileDto {
  firstName?: string;
  lastName?: string;
  email?: string;
}
*/

// DTO para cambio de contraseña (ejemplo)
/*
export interface ChangePasswordDto {
  currentPassword?: string;
  newPassword?: string;
}
*/ 