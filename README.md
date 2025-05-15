# Isidro Libre Gourmet - Sistema de Gestión Integral

Bienvenido al repositorio del proyecto Isidro Libre Gourmet, un sistema de gestión completo diseñado para restaurantes y negocios de comida. Esta solución se compone de un backend robusto para la gestión de datos y lógica de negocio, y un frontend intuitivo para la interacción del usuario, construido con tecnologías modernas y enfocado en la eficiencia operativa.

## Descripción General del Proyecto

Isidro Libre Gourmet tiene como objetivo proporcionar una herramienta digital completa para administrar eficientemente las operaciones diarias de un negocio gastronómico. Esto incluye:

*   **Gestión de Pedidos**: Creación y seguimiento de pedidos para diferentes modalidades (comer en local, para llevar, delivery), con asignación de mesas y gestión de estados (pendiente, en progreso, completado, cancelado).
*   **Administración de Productos y Menú**: Definición de productos, categorías, precios, costos, y gestión de inventario (stock) tanto para productos finales como para ingredientes a través de recetas.
*   **Gestión de Recetas**: Permite definir los ingredientes y cantidades necesarias para cada producto elaborado, facilitando el descuento automático de stock de ingredientes.
*   **Gestión de Ingredientes**: Control de inventario de materias primas, con unidades de medida y seguimiento de stock.
*   **Terminal Punto de Venta (TPV/POS)**: Interfaz optimizada para la toma rápida de pedidos.
*   **Gestión de Clientes**: Registro básico de información de clientes para pedidos (especialmente delivery).
*   **Registro y Control de Gastos**: Seguimiento de gastos operativos del negocio.
*   **Gestión de Usuarios y Roles**: Sistema de autenticación y autorización con roles (ej. cajero, administrador, mesero) para controlar el acceso a diferentes funcionalidades.
*   **Dashboard y Reportes**: Visualización de métricas clave del negocio y generación de reportes básicos (ventas, gastos).
*   **Impresión de Comandas y Recibos**: Funcionalidad para imprimir comandas para cocina y recibos para clientes a través de impresoras térmicas.

## Arquitectura del Sistema

El sistema se divide en:

*   **Frontend**: Una aplicación de página única (SPA) desarrollada con React (usando Vite como empaquetador), TypeScript para tipado estático, Tailwind CSS para la interfaz de usuario, y TanStack Query para la gestión del estado del servidor y caching.
*   **Backend**: Una API RESTful construida con Node.js y Express.js, utilizando TypeScript. La interacción con la base de datos se gestiona a través del ORM TypeORM, y la base de datos subyacente es PostgreSQL. La autenticación se maneja con JSON Web Tokens (JWT).
*   **Base de Datos**: PostgreSQL, elegida por su robustez y características avanzadas.

## Componentes del Sistema

El proyecto está dividido en dos componentes principales:

### 1. Backend

*   **Propósito**: API RESTful que maneja toda la lógica de negocio, la interacción con la base de datos, la autenticación/autorización y la comunicación con periféricos como impresoras.
*   **Tecnologías Clave**: Node.js, Express.js, TypeScript, TypeORM, PostgreSQL, JWT.
*   **Ubicación**: Directorio `/backend`
*   **README Detallado**: [backend/README.md](./backend/README.md)

### 2. Frontend

*   **Propósito**: Interfaz de usuario web interactiva que permite a los usuarios interactuar con el sistema de forma amigable y eficiente.
*   **Tecnologías Clave**: React, Vite, TypeScript, Tailwind CSS, TanStack Query, Axios.
*   **Ubicación**: Directorio `/frontend`
*   **README Detallado**: [frontend/README.md](./frontend/README.md)

## Flujo de Creación y Procesamiento de una Comanda (Pedido)

1.  **Frontend (Toma de Pedido)**:
    *   El usuario (cajero/mesero) inicia un nuevo pedido a través del TPV/POS.
    *   Selecciona el tipo (local, llevar, delivery), ingresa datos del cliente, y añade productos al carrito.
    *   El sistema valida los datos en el frontend.
    *   Al confirmar, se envía una solicitud POST a `/api/orders` en el backend.

2.  **Backend (Procesamiento del Pedido)**:
    *   La API recibe la solicitud, autentica al usuario y valida los datos del pedido (DTO).
    *   El `OrderService` inicia una transacción en la base de datos.
    *   Crea una nueva entidad `Order` y las entidades `OrderItem` asociadas.
    *   Calcula el total y guarda la orden y sus ítems.
    *   Si el pedido es para cocina, se podría enviar una comanda a la impresora de cocina (ver sección "Impresión").
    *   Responde al frontend con la orden creada.

3.  **Frontend (Visualización y Cambios de Estado)**:
    *   El pedido aparece en la lista de pedidos.
    *   El personal puede cambiar el estado del pedido (ej. de "Pendiente" a "En Progreso", y luego a "Completado").
    *   Al completarse el pedido, se puede generar e imprimir un recibo para el cliente.
    *   El cambio de estado a "Completado" también puede implicar la deducción de stock de ingredientes según las recetas de los productos vendidos.

## Integración de Impresora Térmica (Planificación)

La impresión de comandas y recibos es una funcionalidad clave.

*   **Tecnología**: Se planea usar impresoras térmicas (ej. Hazar o compatibles) que soporten el lenguaje de comandos ESC/POS.
*   **Implementación en Backend**:
    *   Un `PrinterService` en el backend gestionará la comunicación con la(s) impresora(s) configurada(s).
    *   Se usarán librerías de Node.js como `escpos` o `node-thermal-printer` para enviar comandos ESC/POS.
    *   El servicio formateará los datos del pedido en el layout adecuado para comandas de cocina (detallando ítems y modificadores) y recibos de cliente (con precios, total, etc.).
*   **Puntos de Impresión**:
    *   **Comandas de Cocina**: Automáticamente después de crear un pedido que requiera preparación en cocina.
    *   **Recibos de Cliente**: Al marcar un pedido como "Completado" y/o al finalizar el proceso de pago.
    *   **Reimpresión**: Opción para reimprimir comandas o recibos desde la interfaz de gestión de pedidos.
*   **Configuración**: Las impresoras (USB, red, serial) se configurarán en el backend, posiblemente a través de variables de entorno o un archivo de configuración.

## Cómo Empezar

Para poner en marcha el sistema completo, necesitarás configurar y ejecutar tanto el backend como el frontend.

### Prerrequisitos Generales

*   Node.js (v18 o superior recomendado)
*   npm (v9 o superior recomendado) o yarn
*   Git
*   Una instancia de PostgreSQL en ejecución.

### Pasos Generales

1.  **Clonar el Repositorio**:
    ```bash
    git clone <url-del-repositorio-isidro-libre-gourmet>
    cd IsidroLibreGourmet
    ```

2.  **Configurar y Ejecutar el Backend**:
    *   Navega al directorio del backend: `cd backend`
    *   Sigue las instrucciones detalladas en el [README del Backend](./backend/README.md) para instalar dependencias, configurar variables de entorno (base de datos, JWT, impresoras) y arrancar el servidor.

3.  **Configurar y Ejecutar el Frontend**:
    *   Navega al directorio del frontend: `cd ../frontend` (o `cd frontend` desde la raíz del proyecto)
    *   Sigue las instrucciones detalladas en el [README del Frontend](./frontend/README.md) para instalar dependencias, configurar variables de entorno (principalmente la URL del API del backend) y arrancar la aplicación de desarrollo.

Una vez que ambos servicios (backend y frontend) estén en ejecución, deberías poder acceder a la aplicación frontend a través de tu navegador (generalmente en una dirección como `http://localhost:5173`) y esta se comunicará con el backend (generalmente en `http://localhost:3000`).

## Estructura del Repositorio

```
IsidroLibreGourmet/
├── backend/        # Código fuente y README del Backend
│   ├── src/
│   ├── package.json
│   └── README.md
├── frontend/       # Código fuente y README del Frontend
│   ├── src/
│   ├── package.json
│   └── README.md
└── README.md       # Este archivo (README Principal)
```

## Contribuciones

Las contribuciones son bienvenidas. Por favor, consulta los READMEs específicos de cada componente para más detalles sobre cómo contribuir a cada parte del proyecto.

## Licencia

Este proyecto puede estar bajo una licencia específica. Consulta el archivo `LICENSE` en el directorio correspondiente si existe. (Nota: Se añadió una licencia ISC en el backend/package.json, considera añadir un archivo LICENSE.md en la raíz o en cada subproyecto).

---

Por favor, revisa los READMEs individuales en las carpetas `backend` y `frontend` para obtener instrucciones de configuración y desarrollo más detalladas. 

3. Flujo de la Comanda (Pedido)
El flujo de una comanda en tu sistema, desde la creación hasta su procesamiento, involucra tanto el frontend como el backend:
Frontend (React - OrderForm.tsx, Orders.tsx):
Inicio de Creación:
Un usuario (cajero, mesero) hace clic en "Nuevo Pedido" en la página de Orders.tsx.
Esto abre el componente OrderForm.tsx.
Ingreso de Datos del Pedido (OrderForm.tsx):
El usuario selecciona el tipo de pedido (Local, Para Llevar, Delivery).
Ingresa datos del cliente (nombre, teléfono, dirección según el tipo).
Selecciona productos de una lista (cargada desde /api/products). Al seleccionar, se añaden al pedido actual con una cantidad.
Puede ajustar cantidades o eliminar productos del pedido.
Selecciona el método de pago y añade notas opcionales.
El formulario utiliza react-hook-form para la gestión del estado y Zod (orderFormSchema) para la validación de los datos en el cliente antes de enviar.
Envío del Pedido:
Al hacer clic en "Crear Pedido", la función onSubmit del formulario se activa.
Se construye un objeto orderPayload de tipo CreateOrderDto con los datos del formulario. Crucialmente, este payload no incluye un id de pedido, ya que es para una nueva orden.
Se llama a una mutación de @tanstack/react-query (mutation.mutate(orderPayload)).
Llamada a la API:
La función mutationFn dentro de la mutación ejecuta axios.post<Order>('/api/orders', orderPayload).
Esto envía una solicitud HTTP POST al endpoint /api/orders del backend con los datos del nuevo pedido.
Respuesta y Actualización de UI:
Si la solicitud es exitosa (el backend crea el pedido y devuelve un 201):
onSuccess de la mutación se dispara.
Se invalidan las queries de ['orders'] y ['products'] para refrescar los datos en la UI.
Se cierra el formulario y se limpia su estado.
Se muestra una notificación o la UI se actualiza para reflejar el nuevo pedido.
Si hay un error:
onError se dispara, mostrando un mensaje de error al usuario.
Backend (Node.js/Express - order.routes.ts, OrderController.ts, OrderService.ts):
Recepción de la Solicitud (order.routes.ts):
La ruta POST /api/orders está definida en order.routes.ts.
Aplica middlewares:
authMiddleware: Verifica la autenticación del usuario.
validateDto(CreateOrderDto): Valida que el cuerpo de la solicitud (req.body) cumpla con la estructura y reglas de CreateOrderDto (usando class-validator). Si no, devuelve un error 400.
Controlador (OrderController.create):
Si la validación es exitosa, se llama al método create de OrderController.
Este método extrae el userId del req.user (adjuntado por authMiddleware).
Llama a this.orderService.createOrder(...) pasándole los datos del pedido y el createdById.
Servicio (OrderService.createOrder):
Este es el núcleo de la lógica de creación y se ejecuta dentro de una transacción de base de datos para asegurar la atomicidad (o todo se hace, o nada se hace si hay un error).
Verificación de Usuario: Se busca el User que crea el pedido por su id.
Creación de Entidad Order: Se crea una instancia de la entidad Order (newOrderEntity) con los datos proporcionados, estableciendo el estado inicial a PENDING y el createdById.
Procesamiento de OrderItems:
Se itera sobre los items (productos y cantidades) del DTO.
Para cada ítem, se busca el Product en la base de datos para verificar su existencia y obtener su precio actual. Se realizan validaciones (ej. si el producto está activo).
Se crea una instancia de la entidad OrderItem, vinculándola al producto y especificando cantidad y precio. Estos OrderItems se coleccionan.
Cálculo del Total: Se calcula el total del pedido sumando los precios de los ítems.
Asignación de Items y Total a la Orden: El array de OrderItems creados y el total calculado se asignan a la instancia newOrderEntity.
Guardado en Base de Datos:
Se llama a orderRepo.save(newOrderEntity).
TypeORM se encarga de:
Insertar la nueva fila en la tabla order.
Debido a la configuración de { cascade: ['insert', 'update'] } en la relación Order.items, también inserta automáticamente cada OrderItem en la tabla order_item, estableciendo la clave foránea orderId con el ID de la Order recién creada.
Respuesta: Si todo es exitoso, la transacción se confirma (COMMIT). El método devuelve la Order recién creada (a menudo recargada con sus relaciones para tener todos los datos).
Respuesta HTTP (OrderController -> Cliente):
El OrderController recibe la Order creada del servicio.
Envía una respuesta HTTP 201 (Created) al frontend con los datos de la Order en formato JSON.
Cambios de Estado Posteriores (Simplificado):
A "En Progreso" / "Completado" / "Cancelado":
El frontend (ej. Orders.tsx) tiene botones para cambiar el estado.
Estos llaman a endpoints específicos del backend (ej. PATCH /api/orders/:id/status, POST /api/orders/:id/complete, POST /api/orders/:id/cancel).
El OrderController llama a los métodos correspondientes en OrderService (ej. updateOrderStatus, completeOrder, cancelOrder).
Estos métodos de servicio actualizan el estado de la Order en la base de datos.
Para completeOrder y cancelOrder (si estaba completado), también se maneja la lógica de deducción o reversión de stock de ingredientes a través de RecipeService e IngredientService.
4. Futura Implementación de la Impresora Hazar (Térmica)
La integración de una impresora térmica (como una Hazar) para imprimir comandas (para la cocina) y tickets/recibos (para el cliente) se puede planificar de la siguiente manera:
Suposiciones:
La impresora está conectada al mismo sistema donde se ejecuta el backend Node.js (vía USB, serial) o es una impresora de red accesible desde el backend.
Se utilizará un lenguaje de comandos de impresora común como ESC/POS, que la mayoría de las impresoras térmicas entienden.
Componentes y Flujo:
Servicio de Impresión en el Backend (PrinterService):
Crear un nuevo servicio, por ejemplo, backend/src/services/printer.service.ts.
Este servicio encapsulará toda la lógica de comunicación con la impresora.
Librerías: Utilizar una librería de Node.js como escpos o node-thermal-printer. Estas librerías facilitan la conexión a la impresora y el envío de comandos ESC/POS.
Apply to README.md
Run
Configuración de la Impresora:
El PrinterService necesitará saber cómo conectarse a la impresora (ej. Vendor ID y Product ID para USB, puerto serial, IP y puerto para red). Esta configuración podría ir en variables de entorno o un archivo de configuración.
Formateo del Ticket/Comanda:
El PrinterService tendrá métodos para generar el contenido del ticket. Por ejemplo:
formatOrderForKitchen(order: Order): string o (commands: EscPosCommand[])
formatOrderForCustomerReceipt(order: Order): string o (commands: EscPosCommand[])
Estos métodos tomarán un objeto Order y lo transformarán en una serie de comandos ESC/POS para:
Imprimir texto (nombre del local, fecha/hora, ID del pedido, nombre del cliente).
Listar ítems del pedido (cantidad, nombre, precio unitario, subtotal).
Imprimir totales, impuestos (si aplica), método de pago.
Aplicar formato (negrita, tamaño de fuente, alineación).
Comandos de corte de papel (CTL_VT, CTL_FF o GS V).
Comando para abrir el cajón portamonedas (si la impresora lo controla).
Puntos de Integración (Dónde llamar al PrinterService):
Comanda para Cocina:
Después de crear un nuevo pedido exitosamente: En OrderService.createOrder, después de que savedOrder se obtiene y la transacción está por confirmarse (o justo después si se mueve fuera de la transacción para no bloquearla).
Apply to README.md
Podría ser configurable (ej. imprimir solo para pedidos DINE_IN o TAKE_AWAY).
Ticket/Recibo para Cliente:
Al completar un pedido: En OrderService.completeOrder, después de que el pedido se marca como COMPLETED y se guarda.
Apply to README.md
Reimpresión:
El OrderController.reprint llamaría a un método del PrinterService que determine qué tipo de ticket reimprimir (cocina o cliente, o quizás ambos si se desea).
Apply to README.md
Manejo de Errores de Impresión:
La comunicación con la impresora puede fallar (desconectada, sin papel, etc.).
El PrinterService debe manejar estos errores elegantemente (ej. registrar el error, quizás ofrecer una opción de reintento manual desde la UI si la impresión es crítica). No deberían hacer que la operación principal del pedido (crear, completar) falle si la lógica del negocio principal ya tuvo éxito.
Ejemplo Simplificado (Conceptual) en PrinterService:
Apply to README.md
Interfaz de Usuario (Frontend):
Podrías añadir un botón de "Reimprimir Ticket" en la vista de cada pedido (Orders.tsx), que llame al endpoint de reimpresión del backend.
Mostrar feedback al usuario sobre el estado de la impresión si es posible y relevante.
Esta es una visión general. La implementación real requerirá pruebas cuidadosas con la impresora Hazar específica y el ajuste fino de los comandos ESC/POS para obtener el formato deseado.
Estoy listo para tus aclaraciones sobre el README y el alcance de la documentación del código para poder continuar.