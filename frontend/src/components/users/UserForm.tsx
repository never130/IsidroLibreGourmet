import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { UserRole } from '@/types/user';
import type { User, CreateUserDto, UpdateUserDto, UserFormData } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Esquema base para campos comunes
const baseUserSchema = {
  firstName: z.string().min(1, 'El nombre es requerido').max(100),
  lastName: z.string().min(1, 'El apellido es requerido').max(100),
  role: z.nativeEnum(UserRole, { required_error: 'El rol es requerido' }),
  isActive: z.boolean().default(true),
};

// Esquema para creación de usuario
const createUserSchema = z.object({
  ...baseUserSchema,
  username: z.string().min(3, 'El username debe tener al menos 3 caracteres').max(50),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword'],
    });
  }
});

// Esquema para edición de usuario
const updateUserSchema = z.object({
  ...baseUserSchema,
  username: z.string(), // Username no se edita, pero se incluye para el tipo
  password: z.string().optional(), // Opcional para actualización
  confirmPassword: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.password && data.password.length > 0 && data.password.length < 6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La nueva contraseña debe tener al menos 6 caracteres',
      path: ['password'],
    });
  }
  if (data.password && data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword'],
    });
  }
});

interface UserFormProps {
  onSuccess: (user: User) => void;
  onCancel: () => void;
  userToEdit?: User | null;
}

export function UserForm({ onSuccess, onCancel, userToEdit }: UserFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!userToEdit;

  const currentFormSchema = isEditMode ? updateUserSchema : createUserSchema;

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<UserFormData>({
    resolver: zodResolver(currentFormSchema),
    defaultValues: {
      username: userToEdit?.username || '',
      firstName: userToEdit?.firstName || '',
      lastName: userToEdit?.lastName || '',
      password: '',
      confirmPassword: '',
      role: userToEdit?.role || UserRole.CASHIER, // Rol por defecto CASHIER para nuevos usuarios
      isActive: userToEdit?.isActive === undefined ? true : userToEdit.isActive,
    }
  });

  useEffect(() => {
    if (userToEdit) {
      reset({
        username: userToEdit.username,
        firstName: userToEdit.firstName,
        lastName: userToEdit.lastName,
        role: userToEdit.role,
        isActive: userToEdit.isActive,
        password: '', 
        confirmPassword: '',
      });
    } else {
      reset({
        username: '',
        firstName: '',
        lastName: '',
        password: '',
        confirmPassword: '',
        role: UserRole.CASHIER,
        isActive: true,
      });
    }
  }, [userToEdit, reset]);

  const mutation = useMutation<User, Error, CreateUserDto | UpdateUserDto>({
    mutationFn: async (userData) => {
      if (isEditMode && userToEdit) {
        const response = await axios.patch<User>(`/api/users/${userToEdit.id}`, userData as UpdateUserDto);
        return response.data;
      } else {
        const response = await axios.post<User>('/api/users', userData as CreateUserDto);
        return response.data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess(data);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Error desconocido";
      console.error('Error guardando usuario:', errorMessage, error.response?.data);
      alert('Error guardando usuario: ' + errorMessage);
    }
  });

  const onSubmitHandler = (data: UserFormData) => {
    if (isEditMode && userToEdit) {
      const payload: UpdateUserDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isActive: data.isActive,
      };
      if (data.password && data.password.length >= 6) {
        payload.password = data.password;
      } else if (data.password && data.password.length > 0) {
        // Si se ingresó algo pero no cumple la longitud, Zod ya lo habrá atrapado.
        // Pero por si acaso, no lo enviamos.
        return;
      }
      mutation.mutate(payload);
    } else {
      // Para creación, username y password son requeridos por el schema createUserSchema
      const payload: CreateUserDto = {
        username: data.username!, // username es requerido por createUserSchema
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password!, // password es requerido por createUserSchema
        role: data.role,
        isActive: data.isActive,
      };
      mutation.mutate(payload);
    }
  };

  const availableRoles = Object.values(UserRole).filter(role => isEditMode ? true : role !== UserRole.OWNER);

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4 md:space-y-6 p-1">
      <h3 className="text-xl font-semibold text-center mb-4">{isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
      
      <div>
        <Label htmlFor="username">Username</Label>
        <Input id="username" {...register('username')} disabled={isEditMode} />
        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Nombre</Label>
          <Input id="firstName" {...register('firstName')} />
          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <Label htmlFor="lastName">Apellido</Label>
          <Input id="lastName" {...register('lastName')} />
          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
        </div>
      </div>
      
      <div>
        <Label htmlFor="password">{isEditMode ? 'Nueva Contraseña (opcional)' : 'Contraseña'}</Label>
        <Input id="password" type="password" {...register('password')} placeholder={isEditMode ? 'Dejar vacío para no cambiar' : ''} />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>
      
      {(watch('password') || !isEditMode) && (
        <div>
          <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
          <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>
      )}

      <div>
        <Label htmlFor="role">Rol</Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Seleccionar un rol" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
                <Checkbox 
                    id="isActive" 
                    checked={field.value}
                    onCheckedChange={(checkedState: boolean | 'indeterminate') => field.onChange(!!checkedState)} 
                />
            )}
        />
        <Label htmlFor="isActive" className="cursor-pointer">Usuario Activo</Label>
        {errors.isActive && <p className="text-red-500 text-xs mt-1">{errors.isActive.message}</p>}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          {isSubmitting || mutation.isPending ? 'Guardando...' : (isEditMode ? 'Actualizar Usuario' : 'Crear Usuario')}
        </Button>
      </div>
    </form>
  );
} 