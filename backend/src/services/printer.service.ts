/**
 * Servicio de impresión
 * Maneja la comunicación con la impresora térmica y el formato de los tickets
 */

import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer';
import type { Order } from '../entities/Order';
import type { OrderItem } from '../entities/OrderItem';

// --- Configuración (Idealmente en variables de entorno) ---
const KITCHEN_PRINTER_IP = process.env.KITCHEN_PRINTER_IP || 'YOUR_KITCHEN_PRINTER_IP_HERE'; // CAMBIAR ESTO
const KITCHEN_PRINTER_PORT = process.env.KITCHEN_PRINTER_PORT || '9100';

// Para la impresora USB, los detalles pueden variar.
// Si solo hay una impresora USB ESC/POS, a menudo no se necesita especificar vid/pid.
// Si hay varias o hay problemas, podrías necesitar identificarlos:
// const CASH_REGISTER_PRINTER_VID = process.env.CASH_REGISTER_PRINTER_VID;
// const CASH_REGISTER_PRINTER_PID = process.env.CASH_REGISTER_PRINTER_PID;

class PrinterService {
  private async initializePrinter(type: PrinterTypes, address?: string, port?: string | number): Promise<ThermalPrinter> {
    let printer: ThermalPrinter;

    if (type === PrinterTypes.EPSON || type === PrinterTypes.STAR) { // EPSON es un buen genérico para ESC/POS
      printer = new ThermalPrinter({
        type: type,
        interface: address && port ? `tcp://${address}:${port}` : 'printer', // 'printer' para USB/serial, o el nombre del dispositivo
        characterSet: CharacterSet.PC852_LATIN2, // Usando string directo. Alternativas: PC437_USA, ISO-8859-1
        removeSpecialCharacters: false,
        // breakLine: Omitido por ahora, el default suele ser suficiente.
        options: {
          timeout: 5000
        }
      });
    } else {
      throw new Error('Tipo de impresora no soportado para inicialización genérica.');
    }
    return printer;
  }

  private formatPrice(price: number | string): string {
    return Number(price).toFixed(2);
  }

  public async printKitchenOrder(order: Order): Promise<void> {
    if (!KITCHEN_PRINTER_IP || KITCHEN_PRINTER_IP === 'YOUR_KITCHEN_PRINTER_IP_HERE') {
      console.error('Error: IP de la impresora de cocina no configurada.');
      // Podrías lanzar un error o simplemente loguearlo y no imprimir
      // throw new Error('IP de la impresora de cocina no configurada.');
      return; 
    }

    let printer: ThermalPrinter;
    try {
      printer = await this.initializePrinter(PrinterTypes.EPSON, KITCHEN_PRINTER_IP, KITCHEN_PRINTER_PORT);
      console.log(`Conectando a impresora de cocina en: tcp://${KITCHEN_PRINTER_IP}:${KITCHEN_PRINTER_PORT}`);

      printer.alignCenter();
      printer.bold(true);
      printer.println("--- NUEVO PEDIDO COCINA ---");
      printer.bold(false);
      printer.newLine();
      
      printer.alignLeft();
      printer.println(`Pedido ID: ${order.id}`);
      // Asumiendo que order.customerName existe. Si es para mesa, sería order.tableNumber
      printer.println(`Cliente: ${order.customerName || 'N/A'}`); 
      printer.println(`Fecha: ${new Date(order.createdAt).toLocaleString()}`);
      printer.drawLine();

      if (order.items && order.items.length > 0) {
        order.items.forEach((item: OrderItem) => { // FIXME: Asegúrate que OrderItem tenga product y quantity
          printer.setTextNormal();
          // FIXME: Asumiendo que item.product.name existe
          printer.println(`${item.quantity} x ${item.product?.name || 'Producto Desconocido'}`); 
          // Si los items tienen notas individuales:
          // if (item.notes) {
          //   printer.setTextSize(0,0); // Texto más pequeño para notas
          //   printer.println(`  Nota: ${item.notes}`);
          //   printer.setTextNormal();
          // }
        });
      } else {
        printer.println("No hay items en este pedido.");
      }
      
      printer.drawLine();

      if (order.notes) {
        printer.println("Notas Generales:");
        printer.bold(true);
        printer.println(order.notes);
        printer.bold(false);
        printer.newLine();
      }

      printer.cut();
      
      await printer.execute();
      console.log('Comanda de cocina enviada a la impresora.');
    } catch (error: any) {
      console.error("Error al imprimir comanda de cocina:", error.message || error);
      // Considera un reintento o un sistema de logging/notificación más robusto
      throw new Error('Fallo al imprimir comanda de cocina: ' + (error.message || error));
    }
  }

  public async printCashRegisterReceipt(order: Order): Promise<void> {
    let printer: ThermalPrinter;
    try {
      // Para USB, 'printer' suele ser el nombre del dispositivo o dejar que la biblio detecte.
      // Si necesitas VID/PID:
      // printer = new ThermalPrinter({ type: PrinterTypes.EPSON, interface: 'printer:NOMBRE_IMPRESORA_USB', options: { vid: CASH_REGISTER_PRINTER_VID, pid: CASH_REGISTER_PRINTER_PID } });
      printer = await this.initializePrinter(PrinterTypes.EPSON /*, puedes añadir nombre de impresora USB aquí si es necesario */);
      console.log('Conectando a impresora de caja (USB/default)');
      
      printer.alignCenter();
      // printer.printLogo(path.join(__dirname, 'logo.png')); // Si tienes un logo y la impresora lo soporta
      printer.bold(true);
      printer.println("Isidro Libre Gourmet"); // Reemplazar con el nombre de tu local
      printer.bold(false);
      printer.println("Dirección de tu Local, Ciudad"); // Reemplazar
      printer.println("Tel: (123) 456-7890"); // Reemplazar
      printer.newLine();

      printer.alignLeft();
      printer.println(`Recibo #: ${order.id}`);
      printer.println(`Fecha: ${new Date(order.createdAt).toLocaleString()}`);
      // if (order.cashier) printer.println(`Cajero: ${order.cashier.name}`);
      printer.println(`Cliente: ${order.customerName || 'Varios'}`);
      printer.drawLine();

      printer.tableCustom([
        { text: "Cant.", align: "LEFT", width: 0.15, bold: true },
        { text: "Producto", align: "LEFT", width: 0.50, bold: true },
        { text: "P.U.", align: "RIGHT", width: 0.15, bold: true },
        { text: "Total", align: "RIGHT", width: 0.20, bold: true }
      ]);

      let calculatedTotal = 0;
      if (order.items && order.items.length > 0) {
        order.items.forEach((item: OrderItem) => {
          // FIXME: Asumiendo que item.product.name y item.priceAtPurchase (o item.product.price) existen
          const productName = item.product?.name || 'Producto Desc.';
          const unitPrice = item.price || item.product?.price || 0;
          const itemTotal = item.quantity * unitPrice;
          calculatedTotal += itemTotal;
          printer.tableCustom([
            { text: `${item.quantity}`, align: "LEFT" },
            { text: productName, align: "LEFT" },
            { text: this.formatPrice(unitPrice), align: "RIGHT" },
            { text: this.formatPrice(itemTotal), align: "RIGHT" }
          ]);
        });
      }
      printer.drawLine();
      
      printer.alignRight();
      printer.bold(true);
      printer.setTextSize(1,1);
      printer.println(`TOTAL: $${this.formatPrice(order.total || calculatedTotal)}`); // FIXME: Usar order.totalAmount si existe y es confiable
      printer.setTextNormal(); // Reset text size and bold
      printer.bold(false);
      printer.newLine();

      printer.alignLeft();
      printer.println(`Método de Pago: ${order.paymentMethod || 'N/A'}`);
      printer.newLine();

      printer.alignCenter();
      printer.println("¡Gracias por su compra!");
      // printer.printQR("URL de tu web o promo"); // Si quieres un QR
      // printer.barcode("123456789012", "EAN13"); // Ejemplo de código de barras
      printer.newLine();
      printer.cut();

      await printer.execute();
      console.log('Recibo de caja enviado a la impresora.');
    } catch (error: any) {
      console.error("Error al imprimir recibo de caja:", error.message || error);
      throw new Error('Fallo al imprimir recibo de caja: ' + (error.message || error));
    }
  }

  public async printOrder(order: Order): Promise<void> {
    try {
      console.log(`Iniciando proceso de impresión para la orden ID: ${order.id}`);
      
      // Imprimir comanda de cocina
      await this.printKitchenOrder(order);
      console.log(`Comanda de cocina para la orden ID: ${order.id} enviada correctamente.`);
      
      // Imprimir recibo de caja
      await this.printCashRegisterReceipt(order);
      console.log(`Recibo de caja para la orden ID: ${order.id} enviado correctamente.`);
      
      console.log(`Todas las impresiones para la orden ID: ${order.id} se completaron exitosamente.`);
    } catch (error: any) {
      // Es importante loguear el ID de la orden para facilitar la depuración
      console.error(`Error durante el proceso de impresión múltiple para la orden ID: ${order.id}:`, error.message || error);
      // Relanzar el error para que el controlador pueda manejarlo (e.g., enviar una respuesta de error al cliente)
      // Se podría considerar un manejo de error más granular si, por ejemplo, una impresión falla pero la otra no,
      // y se quisiera informar de un éxito parcial. Por ahora, un fallo en cualquiera de las impresiones
      // se considerará un fallo total del método printOrder.
      throw new Error(`Fallo al completar todos los trabajos de impresión para la orden ${order.id}: ${error.message || error}`);
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