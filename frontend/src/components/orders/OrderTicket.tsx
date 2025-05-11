import React, { useEffect, useRef } from 'react';
import { Order, OrderStatus, OrderType, PaymentMethod } from '../../types/order'; // Ajusta la ruta según tu estructura

interface OrderTicketProps {
  order: Order | null;
  onClose: () => void;
}

const OrderTicket: React.FC<OrderTicketProps> = ({ order, onClose }) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (order && ticketRef.current) {
      // Pequeño delay para asegurar que el DOM está listo antes de imprimir
      const timer = setTimeout(() => {
        // Solo intenta imprimir si hay una orden
        // y si no se ha cerrado ya la modal (podríamos añadir una validación extra aquí si onClose se llama antes)
        window.print();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [order]);

  if (!order) {
    return null;
  }

  // Estilos en línea para la impresión. Podrían moverse a un CSS con @media print
  const printStyles = `
    @media print {
      body * {
        visibility: hidden;
      }
      .printable-ticket, .printable-ticket * {
        visibility: visible;
      }
      .printable-ticket {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        max-width: 300px; /* Ancho típico de ticket térmico */
        margin: 0 auto;
        font-family: 'monospace', sans-serif;
        font-size: 10px; /* Tamaño más pequeño para ticket */
        line-height: 1.4;
        color: #000;
        background: #fff !important; /* Fondo blanco para impresión */
        padding: 10px; /* Padding para el contenido */
        box-shadow: none !important; /* Sin sombras en impresión */
        border-radius: 0 !important; /* Sin bordes redondeados */
      }
      .printable-ticket h1, .printable-ticket h2, .printable-ticket h3, .printable-ticket p, .printable-ticket td, .printable-ticket th {
        color: #000 !important;
        font-size: 10px !important;
      }
      .printable-ticket .title-store { font-size: 14px !important; font-weight: bold; margin-bottom: 5px; }
      .printable-ticket .subtitle-ticket { font-size: 9px !important; margin-bottom: 8px; }
      .printable-ticket .section-title { font-size: 11px !important; font-weight: bold; margin-top: 5px; margin-bottom: 2px; border-bottom: 1px dashed #000; padding-bottom: 2px; }
      .printable-ticket .text-center { text-align: center; }
      .printable-ticket .text-right { text-align: right; }
      .printable-ticket .font-bold { font-weight: bold; }
      .printable-ticket .mb-1 { margin-bottom: 0.25rem; } // Ajustar espaciado para impresión
      .printable-ticket .mb-2 { margin-bottom: 0.5rem; }
      .printable-ticket .mt-4 { margin-top: 1rem; }
      .printable-ticket .py-1 { padding-top: 0.1rem; padding-bottom: 0.1rem; }
      .printable-ticket .border-b { border-bottom-width: 1px; border-bottom-style: dashed; border-color: #000; }
      .printable-ticket table { width: 100%; }
      .no-print {
        display: none !important;
      }
    }
  `;

  const formatEnumValue = (value?: string) => {
    return value ? value.toString().replace('_', ' ').toUpperCase() : 'N/A';
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4 no-print">
      <style>{printStyles}</style>
      <div ref={ticketRef} className="printable-ticket bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-black">
        <div className="text-center mb-4">
          <h1 className="title-store">Isidro Libre Gourmet</h1>
          {/* <p className="text-xs">Dirección del Negocio</p> */}
          {/* <p className="text-xs">Tel: (123) 456-7890</p> */}
          <p className="subtitle-ticket">Ticket de Venta</p>
        </div>

        <div className="mb-2 border-b pb-1">
          <p><strong>ID Pedido:</strong> #{order.id}</p>
          <p><strong>Fecha:</strong> {new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Cliente:</strong> {order.customerName || 'Consumidor Final'}</p>
          {order.customerPhone && <p><strong>Tel:</strong> {order.customerPhone}</p>}
          <p><strong>Tipo:</strong> {formatEnumValue(order.type)}</p>
          {order.type === OrderType.DELIVERY && order.address && (
            <p><strong>Dirección:</strong> {order.address}</p>
          )}
          {/* {order.tableNumber && <p><strong>Mesa:</strong> {order.tableNumber}</p>} // Campo no existe en backend Order entity */}
          <p><strong>Pago:</strong> {formatEnumValue(order.paymentMethod)}</p>
          <p><strong>Estado:</strong> {formatEnumValue(order.status)}</p>
          {order.createdBy?.username && <p><strong>Atendido por:</strong> {order.createdBy.username}</p>}
        </div>

        {order.notes && (
          <div className="mb-2 border-b pb-1">
            <p><strong>Notas:</strong> {order.notes}</p>
          </div>
        )}

        <h2 className="section-title">Detalle del Pedido:</h2>
        <table className="w-full text-xs mb-2">
          <thead>
            <tr>
              <th className="text-left py-1">Cant.</th>
              <th className="text-left py-1">Producto</th>
              <th className="text-right py-1">P.Unit.</th>
              <th className="text-right py-1">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id} className="border-b">
                <td className="py-1">{item.quantity}</td>
                <td className="py-1">{item.product?.name || `ID:${item.productId}`}</td>
                <td className="text-right py-1">${item.price.toFixed(2)}</td>
                <td className="text-right py-1">${(item.quantity * item.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 border-t pt-2 text-right">
          <p className="font-bold text-sm">TOTAL: ${order.total.toFixed(2)}</p>
        </div>

        <div className="text-center mt-4 text-xs">
          <p>¡Gracias por su preferencia!</p>
        </div>
        
        <button 
            onClick={onClose} 
            className="no-print mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out"
        >
            Cerrar Vista Previa
        </button>
      </div>
    </div>
  );
};

export default OrderTicket; 