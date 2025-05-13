import React from 'react';

export const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative inline-block text-left">
      {children}
    </div>
  );
};

export const DropdownMenuTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <button className="p-2 rounded hover:bg-gray-100">
      {children}
    </button>
  );
};

export const DropdownMenuContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg z-10">
      {children}
    </div>
  );
};

export const DropdownMenuItem: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => {
  return (
    <button onClick={onClick} className="block w-full text-left px-4 py-2 hover:bg-gray-100">
      {children}
    </button>
  );
}; 