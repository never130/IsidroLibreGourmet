import { z } from 'zod';

export enum Currency {
  MXN = 'MXN',
  USD = 'USD',
  EUR = 'EUR',
}

export const currencyOptions = [
  { value: Currency.MXN, label: 'MXN (Peso Mexicano)' },
  { value: Currency.USD, label: 'USD (Dólar Estadounidense)' },
  { value: Currency.EUR, label: 'EUR (Euro)' },
];

export interface BusinessSetting {
  id?: number; // El ID puede no estar presente si aún no se ha guardado nada
  name: string | null;
  address: string | null;
  phone: string | null;
  currency: Currency;
  // createdAt y updatedAt no suelen ser necesarios en el formulario del frontend
}

export const UpdateBusinessSettingSchema = z.object({
  name: z.string().min(3, 'El nombre del negocio debe tener al menos 3 caracteres.').max(255).nullable().or(z.literal('')),
  address: z.string().max(1000, 'La dirección no debe exceder los 1000 caracteres.').nullable().or(z.literal('')),
  phone: z.string().max(50, 'El teléfono no debe exceder los 50 caracteres.').nullable().or(z.literal('')),
  currency: z.nativeEnum(Currency, {
    errorMap: () => ({ message: 'Debe seleccionar una moneda válida.' }),
  }),
});

export type UpdateBusinessSettingPayload = z.infer<typeof UpdateBusinessSettingSchema>; 