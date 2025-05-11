import { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { ProfileForm } from '../components/settings/ProfileForm';
import { UserList } from '../components/settings/UserList';
import { BusinessSettingsForm } from '../components/settings/BusinessSettingsForm';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'users'>('profile');

  return (
    <MainLayout title="Configuración">
      <div className="space-y-6 p-4 md:p-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              type="button"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              Perfil
            </button>
            <button
              type="button"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'business'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
              }`}
              onClick={() => setActiveTab('business')}
            >
              Negocio
            </button>
            <button
              type="button"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
              }`}
              onClick={() => setActiveTab('users')}
            >
              Usuarios
            </button>
          </nav>
        </div>

        {/* Contenido */}
        <div className="mt-6">
          {activeTab === 'profile' && (
            <ProfileForm />
          )}

          {activeTab === 'business' && (
            <BusinessSettingsForm />
          )}

          {activeTab === 'users' && (
            <UserList />
          )}
        </div>
      </div>
    </MainLayout>
  );
} 