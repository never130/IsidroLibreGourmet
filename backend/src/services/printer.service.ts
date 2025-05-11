/**
 * Servicio de impresión
 * Maneja la comunicación con la impresora térmica y el formato de los tickets
 */

import { Order } from '../entities/Order';

class PrinterService {
  async printOrder(order: Order): Promise<void> {
    try {
      // Simulación de impresión
      console.log('=== TICKET DE PEDIDO ===');
      console.log(`Pedido #${order.id}`);
      console.log(`Cliente: ${order.customerName}`);
      if (order.customerPhone) {
        console.log(`Teléfono: ${order.customerPhone}`);
      }
      if (order.address) {
        console.log(`Dirección: ${order.address}`);
      }
      console.log('------------------------');
      console.log('PRODUCTOS:');
      
      order.items.forEach(item => {
        // Asegurarse de que item.product exista y tenga un nombre
        const productName = item.product?.name || 'Producto Desconocido';
        // Asegurarse de que item.price sea un número antes de usar toFixed
        const priceAsNumber = parseFloat(String(item.price));
        const quantityAsNumber = Number(item.quantity) || 0;

        console.log(`${quantityAsNumber}x ${productName}`);
        if (!isNaN(priceAsNumber)) {
          console.log(`   $${priceAsNumber.toFixed(2)} c/u`);
          console.log(`   Subtotal: $${(quantityAsNumber * priceAsNumber).toFixed(2)}`);
        } else {
          console.log(`   Precio no disponible`);
          console.log(`   Subtotal no disponible`);
        }
      });

      console.log('------------------------');
      // Asegurarse de que order.total sea un número
      const totalAsNumber = parseFloat(String(order.total));
      if (!isNaN(totalAsNumber)) {
        console.log(`Total: $${totalAsNumber.toFixed(2)}`);
      } else {
        console.log(`Total no disponible`);
      }
      console.log('========================');
    } catch (error) {
      console.error('Error al imprimir la orden:', error);
      throw new Error('Error al imprimir la orden');
    }
  }

  /**
   * Obtiene la etiqueta en español para el tipo de pedido
   * @param type - Tipo de pedido
   * @returns Etiqueta traducida
   */
  private getOrderTypeLabel(type: string): string {
    const types: Record<string, string> = {
      'dine_in': 'Comer en el local',
      'takeaway': 'Para llevar',
      'delivery': 'Delivery'
    };
    return types[type] || type;
  }

  /**
   * Obtiene la etiqueta en español para el estado del pedido
   * @param status - Estado del pedido
   * @returns Etiqueta traducida
   */
  private getOrderStatusLabel(status: string): string {
    const statuses: Record<string, string> = {
      'pending': 'Pendiente',
      'in_progress': 'En Progreso',
      'ready': 'Listo',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };
    return statuses[status] || status;
  }
}

export const printerService = new PrinterService(); 