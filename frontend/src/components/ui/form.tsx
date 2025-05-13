import React from 'react';

export const Form: React.FC<{ onSubmit: (e: React.FormEvent) => void; children: React.ReactNode }> = ({ onSubmit, children }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {children}
    </form>
  );
};

export const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}; 