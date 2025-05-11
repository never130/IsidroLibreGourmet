import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { User, UserRole } from '../../../src/types/auth'; // Ajusta la ruta si es necesario

// Esquema Zod único y más permisivo para el formulario
const userManagementSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  firstName: z.string().max(50).optional().or(z.literal('')),
  lastName: z.string().max(50).optional().or(z.literal('')),
  email: z.string().email('Debe ser un correo electrónico válido').max(100).optional().or(z.literal('')),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  password: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine(data => {
  // Si se proporciona una nueva contraseña, debe tener al menos 6 caracteres
  if (data.password && data.password.length > 0 && data.password.length < 6) {
    return false;
  }
  return true;
}, {
  message: 'La contraseña debe tener al menos 6 caracteres si se desea cambiar',
  path: ['password'], 
}).refine(data => {
  // Si se proporciona una nueva contraseña, las contraseñas deben coincidir
  if (data.password) {
    return data.password === data.confirmPassword;
  }
  return true; // Si no se establece nueva contraseña, no es necesario que coincidan
}, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type UserFormValues = z.infer<typeof userManagementSchema>;

interface UserFormProps {
  userToEdit?: User | null;
  onClose: () => void;
}

export function UserForm({ userToEdit, onClose }: UserFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!userToEdit;

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<UserFormValues>({
    resolver: zodResolver(userManagementSchema), // Usar el esquema único
    defaultValues: {
      username: userToEdit?.username || '',
      firstName: userToEdit?.firstName || '',
      lastName: userToEdit?.lastName || '',
      email: userToEdit?.email || '',
      role: userToEdit?.role || UserRole.CASHIER,
      isActive: userToEdit?.isActive ?? true,
      password: '',
      confirmPassword: '',
    }
  });

  const mutation = useMutation<
    User, 
    AxiosError<any>,
    Partial<UserFormValues>
  >({
    mutationFn: async (userData) => {
      const { confirmPassword, ...payloadToSend } = userData;
      
      // En modo creación, la contraseña es obligatoria
      if (!isEditMode && (!payloadToSend.password || payloadToSend.password.trim() === '')) {
        // Este error debería ser capturado por Zod si hacemos password no opcional para creación
        // o necesitaríamos un esquema Zod condicional (que queremos evitar aquí por simplicidad de resolver)
        // Por ahora, confiamos en la validación del backend o en que el esquema lo capture si se ajusta.
        throw new Error("La contraseña es obligatoria para crear un usuario.");
      }

      // Si es modo edición y la contraseña está vacía, no la enviamos
      if (isEditMode && (!payloadToSend.password || payloadToSend.password.trim() === '')) {
        delete payloadToSend.password;
      }

      if (isEditMode && userToEdit?.id) {
        const { data } = await axios.patch(`/api/users/${userToEdit.id}`, payloadToSend);
        return data;
      } else {
        // Asegurarse de que en modo creación, el username (y otros campos requeridos) estén presentes
        if (!payloadToSend.username) throw new Error("Username es requerido");
        const { data } = await axios.post('/api/users', payloadToSend);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose(); 
    },
    onError: (error) => {
      // Si el error es por validación manual de contraseña en creación
      if (error.message === "La contraseña es obligatoria para crear un usuario.") {
        alert(error.message); // O manejarlo en el estado del formulario
        return;
      }
      const errorMessage = error.response?.data?.message || error.message || (isEditMode ? 'Error al actualizar usuario.' : 'Error al crear usuario.');
      alert(`Error: ${errorMessage}`); // Usar alert temporalmente
      console.error('Error en formulario de usuario:', errorMessage, error.response?.data);
    }
  });

  const onSubmit: SubmitHandler<UserFormValues> = data => {
     // En modo creación, la contraseña es obligatoria
     if (!isEditMode && (!data.password || data.password.trim() === '')) {
      alert("La contraseña es obligatoria para crear un usuario.");
      // Podrías usar setError de react-hook-form aquí para mostrar el error en el campo
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="relative bg-white dark:bg-gray-800 w-full max-w-lg mx-auto rounded-lg shadow-xl p-6">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
          {isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <input id="username" {...register('username')} disabled={isEditMode && userToEdit?.username === 'admin'} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${isEditMode && userToEdit?.username === 'admin' ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : (isEditMode ? 'bg-gray-100 dark:bg-gray-700' : 'border-gray-300 dark:border-gray-600')}`} />
            {errors.username && <p className="mt-1 text-sm text-red-500">{(errors.username as any).message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
              <input id="firstName" {...register('firstName')} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm" />
              {errors.firstName && <p className="mt-1 text-sm text-red-500">{(errors.firstName as any).message}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Apellido</label>
              <input id="lastName" {...register('lastName')} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm" />
              {errors.lastName && <p className="mt-1 text-sm text-red-500">{(errors.lastName as any).message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input id="email" type="email" {...register('email')} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm" />
            {errors.email && <p className="mt-1 text-sm text-red-500">{(errors.email as any).message}</p>}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
            <input id="password" type="password" {...register('password')} placeholder={isEditMode ? 'Dejar en blanco para no cambiar' : 'Requerida'} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm" />
            {errors.password && <p className="mt-1 text-sm text-red-500">{(errors.password as any).message}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Contraseña</label>
            <input id="confirmPassword" type="password" {...register('confirmPassword')} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm" />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{(errors.confirmPassword as any).message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
              <select id="role" {...register('role')} disabled={isEditMode && userToEdit?.username === 'admin' && userToEdit.role === UserRole.OWNER} className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white ${isEditMode && userToEdit?.username === 'admin' && userToEdit.role === UserRole.OWNER ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-600' : '' }`}>
                {Object.values(UserRole).map(roleValue => (
                  <option key={roleValue} value={roleValue}>{roleValue.charAt(0).toUpperCase() + roleValue.slice(1)}</option>
                ))}
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-500">{(errors.role as any).message}</p>}
            </div>
            <div className="flex items-center mt-6 md:mt-0">
              <input id="isActive" type="checkbox" {...register('isActive')} disabled={isEditMode && userToEdit?.username === 'admin'} className={`h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 ${isEditMode && userToEdit?.username === 'admin' ? 'cursor-not-allowed' : ''}`} />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Activo</label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={mutation.isPending || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {mutation.isPending ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 