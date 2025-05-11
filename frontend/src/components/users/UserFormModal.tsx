import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserForm } from './UserForm';
import type { User } from '@/types/user';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSaved: (user: User) => void; // Callback cuando el usuario se guarda/crea
  userToEdit?: User | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onUserSaved,
  userToEdit,
}) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-center text-2xl font-semibold">
            {userToEdit ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </DialogTitle>
        </DialogHeader>
        <UserForm 
          userToEdit={userToEdit}
          onSuccess={(savedUser) => {
            onUserSaved(savedUser); 
            // onClose(); // No es necesario llamar a onClose aquí si onUserSaved ya lo hace en UsersPage
          }}
          onCancel={onClose} 
        />
      </DialogContent>
    </Dialog>
  );
}; 