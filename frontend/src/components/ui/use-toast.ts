export const useToast = () => {
  return {
    toast: (message: string) => {
      console.log('Toast:', message);
      // Aquí puedes agregar la lógica para mostrar notificaciones
    },
  };
}; 