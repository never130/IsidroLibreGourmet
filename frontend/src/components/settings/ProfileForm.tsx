import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types/auth'; // Asegúrate que esta ruta es correcta y User tiene los nuevos campos

// Esquema Zod para la validación del formulario de perfil
const profileSchema = z.object({
  username: z.string().optional(), // No editable, pero lo incluimos para mostrarlo
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50).optional().or(z.literal('')),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').max(50).optional().or(z.literal('')),
  email: z.string().email('Debe ser un correo electrónico válido').max(100).optional().or(z.literal('')),
  currentPassword: z.string().optional().or(z.literal('')),
  newPassword: z.string().optional().or(z.literal('')),
  confirmNewPassword: z.string().optional().or(z.literal('')),
}).refine(data => {
  // Si newPassword tiene valor, currentPassword también debe tenerlo
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: 'La contraseña actual es requerida para establecer una nueva contraseña',
  path: ['currentPassword'], 
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Las nuevas contraseñas no coinciden',
  path: ['confirmNewPassword'],
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Tipado para la respuesta esperada del backend al actualizar el perfil (sin la contraseña)
type UpdateProfileResponse = Omit<User, 'password'>;

export function ProfileForm() {
  const { user, login: updateUserInContext } = useAuth();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting: isFormSubmitting }, reset, watch } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    }
  });

  const mutation = useMutation<UpdateProfileResponse, AxiosError<any>, Partial<ProfileFormValues>>({
    mutationFn: async (dataToUpdate: Partial<ProfileFormValues>) => {
      const payload: Partial<ProfileFormValues> = { ...dataToUpdate };
      if (!payload.currentPassword) delete payload.currentPassword;
      if (!payload.newPassword) delete payload.newPassword;
      delete payload.confirmNewPassword;
      delete payload.username;
      const { data } = await axios.put('/api/users/me/profile', payload);
      return data;
    },
    onSuccess: (updatedUserData: UpdateProfileResponse) => {
      console.log('Perfil actualizado:', updatedUserData);
      const currentToken = localStorage.getItem('token');
      if (currentToken && updateUserInContext) {
        // Asumimos que updateUserInContext (originalmente login) espera un objeto { user: User, token: string }
        // y que la respuesta del backend `updatedUserData` es compatible con la interfaz `User` del frontend.
        updateUserInContext({ user: updatedUserData as User, token: currentToken });
      }
      // Intenta invalidar con una sintaxis más simple de queryKey
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] }); 
      reset({
        username: updatedUserData.username,
        firstName: updatedUserData.firstName || '',
        lastName: updatedUserData.lastName || '',
        email: updatedUserData.email || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      // alert('Perfil actualizado con éxito!'); // Descomentar para notificaciones
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage = error.response?.data?.message || error.message || 'Error al actualizar el perfil.';
      console.error('Error al actualizar perfil:', errorMessage);
      // alert(`Error: ${errorMessage}`); // Descomentar para notificaciones
    },
  });

  const onSubmit: SubmitHandler<ProfileFormValues> = (data) => {
    const dataToSubmit: Partial<ProfileFormValues> = {};
    if (data.firstName !== user?.firstName) dataToSubmit.firstName = data.firstName;
    if (data.lastName !== user?.lastName) dataToSubmit.lastName = data.lastName;
    if (data.email !== user?.email) dataToSubmit.email = data.email;
    if (data.newPassword) {
        dataToSubmit.currentPassword = data.currentPassword;
        dataToSubmit.newPassword = data.newPassword;
    }
    // Solo mutar si hay cambios o se intenta cambiar la contraseña
    if (Object.keys(dataToSubmit).length > 0) {
        mutation.mutate(dataToSubmit);
    }
  };

  // Lógica para deshabilitar campos de contraseña si newPassword está vacío
  const newPasswordValue = watch("newPassword");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg mx-auto p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-center mb-6">Editar Perfil</h2>
      
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nombre de usuario (no editable)</label>
        <input 
          id="username" 
          type="text" 
          {...register('username')} 
          readOnly 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Nombre</label>
        <input id="firstName" type="text" {...register('firstName')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        {errors.firstName && <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>}
      </div>

      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Apellido</label>
        <input id="lastName" type="text" {...register('lastName')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        {errors.lastName && <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
        <input id="email" type="email" {...register('email')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <hr className="my-6" />
      <h3 className="text-lg font-medium text-gray-900">Cambiar Contraseña</h3>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
        <input 
          id="newPassword" 
          type="password" 
          {...register('newPassword')} 
          placeholder="Dejar en blanco para no cambiar"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {errors.newPassword && <p className="mt-2 text-sm text-red-600">{errors.newPassword.message}</p>}
      </div>

      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Contraseña Actual</label>
        <input 
          id="currentPassword" 
          type="password" 
          {...register('currentPassword')} 
          disabled={!newPasswordValue} // Deshabilitar si newPassword está vacío
          className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${!newPasswordValue ? 'bg-gray-100' : ''}`}
        />
        {errors.currentPassword && <p className="mt-2 text-sm text-red-600">{errors.currentPassword.message}</p>}
      </div>

      <div>
        <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">Confirmar Nueva Contraseña</label>
        <input 
          id="confirmNewPassword" 
          type="password" 
          {...register('confirmNewPassword')} 
          disabled={!newPasswordValue} // Deshabilitar si newPassword está vacío
          className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${!newPasswordValue ? 'bg-gray-100' : ''}`}
        />
        {errors.confirmNewPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmNewPassword.message}</p>}
      </div>

      <button 
        type="submit" 
        disabled={isFormSubmitting || mutation.isPending}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
      >
        {isFormSubmitting || mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </form>
  );
} 