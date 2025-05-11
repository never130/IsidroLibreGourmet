import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { User, UserRole } from '../../../src/types/auth'; // Ajusta la ruta según sea necesario
import { Edit2, Trash2, PlusCircle, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { UserForm } from './UserForm'; // Descomentar y asegurar que la ruta es correcta
import { useAuth } from '../../contexts/AuthContext'; // Importar useAuth

const fetchUsers = async (): Promise<User[]> => {
  const { data } = await axios.get('/api/users');
  return data;
};

export function UserList() {
  const { user: currentUser } = useAuth(); // Obtener el usuario actual
  const queryClient = useQueryClient();

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: users, isLoading, isError, error } = useQuery<User[], Error>({
    queryKey: ['users'],
    queryFn: fetchUsers
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleCloseForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
    queryClient.invalidateQueries({ queryKey: ['users'] }); // Refrescar la lista por si acaso
  };

  // Mutación para activar/desactivar usuario
  const toggleUserActiveMutation = useMutation<
    User, 
    AxiosError<any>,
    { userId: number; isActive: boolean }
  >({
    mutationFn: ({ userId, isActive }) => 
      axios.patch(`/api/users/${userId}`, { isActive }).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      alert(`Error al cambiar estado del usuario: ${error.response?.data?.message || error.message}`);
    }
  });

  // Mutación para eliminar usuario
  const deleteUserMutation = useMutation<
    void, 
    AxiosError<any>,
    number // userId
  >({
    mutationFn: (userId) => axios.delete(`/api/users/${userId}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      alert('Usuario eliminado correctamente.');
    },
    onError: (error) => {
      alert(`Error al eliminar usuario: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleDeleteUser = (userId: number, username: string) => {
    if (username === 'admin') {
      alert('El usuario \'admin\' no puede ser eliminado.');
      return;
    }
    if (currentUser && userId === currentUser.id) {
      alert('No puedes eliminarte a ti mismo.');
      return;
    }
    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${username}? Esta acción no se puede deshacer.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleToggleActive = (userToToggle: User) => {
    if (userToToggle.username === 'admin') {
      alert('El estado del usuario \'admin\' no puede ser cambiado desde aquí.');
      return;
    }
    if (currentUser && userToToggle.id === currentUser.id) {
      alert('No puedes desactivarte a ti mismo.');
      return;
    }
    const newStatus = !(userToToggle.isActive ?? true); // Si es undefined, tratar como true, luego negar
    if (window.confirm(`¿Estás seguro de que quieres ${newStatus ? 'activar' : 'desactivar'} al usuario ${userToToggle.username}?`)) {
      toggleUserActiveMutation.mutate({ userId: userToToggle.id, isActive: newStatus });
    }
  };

  if (isLoading) return <p className="text-center text-gray-500 py-8">Cargando usuarios...</p>;
  if (isError) return <p className="text-center text-red-500 py-8">Error al cargar usuarios: {error?.message}</p>;

  return (
    <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gestión de Usuarios</h2>
        <button
          onClick={handleAddNew}
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out"
        >
          <PlusCircle size={18} className="mr-2" />
          Nuevo Usuario
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users && users.length > 0 ? users.map((user) => {
              const isAdminUser = user.username === 'admin';
              const isCurrentUser = currentUser?.id === user.id;
              const canBeModified = !isAdminUser && !isCurrentUser;

              return (
                <tr key={user.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.username}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.firstName || '-'} {user.lastName || ''}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.email || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === UserRole.OWNER ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' :
                      user.role === UserRole.ADMIN ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' :
                      user.role === UserRole.DEVELOPER ? 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100' :
                      'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' /* CASHIER */
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={!canBeModified || toggleUserActiveMutation.isPending}
                      className={`p-1 rounded-full transition-colors duration-150 ease-in-out 
                        ${!canBeModified ? 'opacity-50 cursor-not-allowed' : (user.isActive ? 'hover:bg-red-100 dark:hover:bg-red-700' : 'hover:bg-green-100 dark:hover:bg-green-700')}
                      `}
                      title={canBeModified ? (user.isActive ? 'Desactivar' : 'Activar') : (isAdminUser ? 'Usuario admin no se puede modificar aquí' : 'No puedes modificarte a ti mismo')}
                    >
                      {user.isActive ? 
                        <ToggleRight size={22} className="text-green-500 dark:text-green-400" /> :
                        <ToggleLeft size={22} className="text-red-500 dark:text-red-400" />
                      }
                    </button>
                    <span className={`ml-2 text-xs ${user.isActive ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium space-x-2">
                    <button 
                        onClick={() => handleEdit(user)} 
                        disabled={isAdminUser && currentUser?.role !== UserRole.OWNER} // Solo OWNER puede editar al usuario admin
                        className={`text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={isAdminUser && currentUser?.role !== UserRole.OWNER ? 'Solo Owner puede editar al admin' : 'Editar'}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDeleteUser(user.id, user.username)} 
                        disabled={!canBeModified || deleteUserMutation.isPending}
                        className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={canBeModified ? 'Eliminar' : (isAdminUser ? 'Usuario admin no se puede eliminar' : 'No puedes eliminarte a ti mismo') }
                    >
                      {deleteUserMutation.isPending && deleteUserMutation.variables === user.id ? '...' : <Trash2 size={18} />}
                    </button>
                  </td>
                </tr>
              )}
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  <AlertTriangle size={20} className="inline mr-2 mb-1" /> No hay usuarios para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showUserForm && (
        <UserForm
          userToEdit={editingUser}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
} 