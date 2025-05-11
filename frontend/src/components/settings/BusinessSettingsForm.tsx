import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BusinessSetting, UpdateBusinessSettingSchema, UpdateBusinessSettingPayload, Currency, currencyOptions } from '../../types/business-setting';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'; // Asumiendo que tienes un componente Select
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner'; // Asumiendo que usas sonner para notificaciones

const fetchBusinessSettings = async (): Promise<BusinessSetting | null> => {
  const response = await fetch('/api/business-settings');
  if (!response.ok) {
    if (response.status === 404) { // Si no hay configuraciones, devuelve null o un objeto default
        return null;
    }
    throw new Error('Error al obtener la configuración del negocio');
  }
  return response.json();
};

const updateBusinessSettings = async (data: UpdateBusinessSettingPayload): Promise<BusinessSetting> => {
  const response = await fetch('/api/business-settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Error al actualizar la configuración del negocio');
  }
  return response.json();
};

export const BusinessSettingsForm: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error: loadError } = useQuery<BusinessSetting | null, Error>({
    queryKey: ['businessSettings'],
    queryFn: fetchBusinessSettings,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, control } = useForm<UpdateBusinessSettingPayload>({
    resolver: zodResolver(UpdateBusinessSettingSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      currency: Currency.MXN, // Moneda por defecto
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name || '',
        address: settings.address || '',
        phone: settings.phone || '',
        currency: settings.currency || Currency.MXN,
      });
    }
  }, [settings, reset]);

  const mutation = useMutation<BusinessSetting, Error, UpdateBusinessSettingPayload>({
    mutationFn: updateBusinessSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['businessSettings'], data);
      toast.success('Configuración del negocio actualizada con éxito');
    },
    onError: (error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });

  const onSubmit = (data: UpdateBusinessSettingPayload) => {
    mutation.mutate(data);
  };

  if (isLoading) return <p>Cargando configuración...</p>;
  // Manejo básico del error de carga, podría ser un toast también o un mensaje más elaborado
  if (loadError) return <p className="text-red-500">Error al cargar la configuración: {loadError.message}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del Negocio</CardTitle>
        <CardDescription>
          Actualiza los detalles de tu negocio. Estos datos podrían usarse en facturas o tickets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Negocio</label>
            <Input id="name" {...register('name')} placeholder="Mi Tiendita POS" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección</label>
            <Textarea id="address" {...register('address')} placeholder="Calle Falsa 123, Colonia Centro..." />
            {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
            <Input id="phone" {...register('phone')} placeholder="(55) 1234 5678" />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Moneda Principal</label>
            {/* 
              Necesitarás un Controller de react-hook-form para integrar componentes de UI como Select de shadcn/ui 
              o asegurarte de que tu componente Select maneje `onChange`, `onBlur`, `value`, `name`, `ref` apropiadamente.
              Ejemplo simplificado si tu Select es compatible directamente:
            */}
            <Select
              onValueChange={(value: Currency) => reset({ ...control._formValues, currency: value })}
              defaultValue={control._formValues.currency || Currency.MXN}
              name={register('currency').name} // Solo para el name, el control es mejor con Controller
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Selecciona una moneda" />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.currency && <p className="mt-1 text-xs text-red-500">{errors.currency.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {isSubmitting || mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}; 