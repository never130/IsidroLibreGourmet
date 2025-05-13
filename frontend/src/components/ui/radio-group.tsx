import React from 'react';

export const RadioGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col space-y-2">
      {children}
    </div>
  );
};

export const RadioItem: React.FC<{ id: string; name: string; value: string; label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ id, name, value, label, checked, onChange }) => {
  return (
    <div className="flex items-center">
      <input type="radio" id={id} name={name} value={value} checked={checked} onChange={onChange} className="mr-2" />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}; 