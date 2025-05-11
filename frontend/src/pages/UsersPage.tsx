import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { MainLayout } from '@/components/layout/MainLayout'; // Usar MainLayout para la barra de navegación completa
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, AlertTriangle } from 'lucide-react';
import type { User, UserRole } from '@/types/user'; // Importar tipos de usuario
// Importar UserFormModal (se creará después o se adaptará uno existente)
import { UserFormModal } from '@/components/users/UserFormModal'; 

const fetchUsers = async (): Promise<User[]> => {
  const response = await axios.get('/api/users');
  return response.data;
};

// Placeholder para la función de eliminar, se implementará después
const deleteUser = async (userId: number): Promise<void> => {
  await axios.delete(`/api/users/${userId}`);
};

export function UsersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: users, isLoading, error, refetch } = useQuery<User[], Error>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const deleteUserMutation = useMutation({ 
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Podríamos añadir una notificación de éxito aquí
      alert('Usuario eliminado exitosamente');
    },
    onError: (err: any) => {
      console.error("Error deleting user:", err.response?.data?.message || err.message);
      alert("Error al eliminar el usuario: " + (err.response?.data?.message || err.message));
    }
  });

  const handleAddNewUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
    // alert('Funcionalidad de añadir usuario pendiente (abrir modal con UserForm).');
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
    // alert(`Funcionalidad de editar usuario ${user.username} pendiente (abrir modal con UserForm).`);
  };

  const handleDeleteUser = (userId: number, username: string) => {
    if (window.confirm(`¿Está seguro de que desea eliminar al usuario "${username}"? Esta acción no se puede deshacer.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Cargando Usuarios...">
        <div className="container mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Error">
        <div className="container mx-auto p-4">
          <div className="text-red-500 bg-red-100 p-4 rounded-md flex flex-col items-center">
            <AlertTriangle className="h-10 w-10 mb-2" />
            <p className="text-lg font-semibold">Error al cargar usuarios:</p>
            <p>{error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">Reintentar</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Para depurar qué datos de usuarios se están recibiendo
  console.log('Datos de usuarios recibidos en UsersPage:', users);

  return (
    <MainLayout title="Gestión de Usuarios">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <Button onClick={handleAddNewUser} className="flex items-center">
            <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nuevo Usuario
          </Button>
        </div>

        <div className="bg-card p-4 sm:p-6 rounded-lg shadow-lg">
          {users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre Completo</th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-card-foreground">{user.username}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-card-foreground">{`${user.firstName} ${user.lastName}`}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.role === 'owner' ? 'bg-purple-100 text-purple-800' : 
                            user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                            'bg-green-100 text-green-800'}
                          dark:${user.role === 'owner' ? 'bg-purple-800 text-purple-100' : 
                                user.role === 'admin' ? 'bg-red-800 text-red-100' : 
                                'bg-green-800 text-green-100'}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(user)} className="hover:bg-blue-500 hover:text-white">
                          <Edit className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Editar</span>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id, user.username)} disabled={deleteUserMutation.isPending && deleteUserMutation.variables === user.id}>
                          <Trash2 className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Eliminar</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <h3 className="text-xl font-semibold text-muted-foreground">No se encontraron usuarios.</h3>
              <p className="text-sm text-muted-foreground">Puede empezar añadiendo un nuevo usuario.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA CREAR/EDITAR USUARIO */}
      {isModalOpen && (
        <UserFormModal 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
          onUserSaved={(savedUser) => {
            setIsModalOpen(false);
            setEditingUser(null);
            queryClient.invalidateQueries({ queryKey: ['users'] });
            if (editingUser) {
              alert('Usuario "' + savedUser.username + '" actualizado exitosamente.');
            } else {
              alert('Usuario "' + savedUser.username + '" creado exitosamente.');
            }
          }}
          userToEdit={editingUser}
        />
      )}
    </MainLayout>
  );
}

// export default UsersPage; // Si se usa como default export 