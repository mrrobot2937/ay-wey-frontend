import requests
import time
import json
from escpos.printer import Usb

# --- CONFIGURACIÓN ---
GRAPHQL_URL = "https://choripam-backend-real.vercel.app/graphql"
RESTAURANT_ID = "ay-wey"
CHECK_INTERVAL_SECONDS = 2  # Tiempo de espera en segundos entre cada consulta
PRINTED_ORDERS_FILE = "printed_orders.json"  # Archivo para guardar las órdenes impresas

# ID de Vendedor (VID) y Producto (PID) de tu impresora térmica.
# Búscalo con 'lsusb' en Linux o en el Administrador de Dispositivos de Windows.
# Si no estás seguro, los valores para Xprinter suelen ser otros, pero puedes probar.
PRINTER_VID = 0x0483
PRINTER_PID = 0x070b

# --- FUNCIONES DE PERSISTENCIA ---

def load_printed_orders(file_path: str) -> set:
    """Carga los IDs de las órdenes ya impresas desde un archivo JSON."""
    try:
        with open(file_path, 'r') as f:
            order_ids = json.load(f)
            print(f"📄 Se cargaron {len(order_ids)} IDs de órdenes del archivo de registro.")
            return set(order_ids)
    except FileNotFoundError:
        print("📄 No se encontró el archivo de registro. Se creará uno nuevo.")
        return set()
    except json.JSONDecodeError:
        print(f"⚠️  El archivo '{file_path}' está corrupto o vacío. Empezando de cero.")
        return set()

def save_printed_orders(file_path: str, order_ids: set):
    """Guarda el conjunto de IDs de órdenes impresas en un archivo JSON."""
    with open(file_path, 'w') as f:
        json.dump(list(order_ids), f, indent=4)

# --- FUNCIONES PRINCIPALES ---

def get_orders_graphql(restaurant_id: str):
    """Consulta las órdenes a través de la API de GraphQL."""
    query = """
    query GetOrders($restaurantId: String!) {
      orders(restaurantId: $restaurantId) {
        id
        status
        customer { name }
        products { name, quantity, price }
        total
      }
    }
    """
    variables = {"restaurantId": restaurant_id}
    try:
        response = requests.post(GRAPHQL_URL, json={"query": query, "variables": variables})
        response.raise_for_status()
        data = response.json()
        if "errors" in data:
            print(f"❌ Error en la respuesta de GraphQL: {data['errors']}")
            return None
        return data["data"]["orders"]
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de red al consultar la API: {e}")
        return None
    except Exception as e:
        print(f"❌ Error inesperado al procesar la respuesta: {e}")
        return None

def imprimir_pedido(items, total_pago, nombre_cliente, numero_pedido):
    """Imprime un recibo de pedido en una impresora térmica."""
    printer = None
    try:
        printer = Usb(PRINTER_VID, PRINTER_PID)
        printer.set(align='center', font='b', height=2, width=2)
        printer.text("NUEVO PEDIDO\n")
        printer.text("----------------\n")
        printer.set(align='left', height=1, width=1)
        printer.text(f"Pedido #: {numero_pedido}\n")
        printer.text(f"Cliente: {nombre_cliente}\n")
        printer.text("--------------------------------\n")
        printer.text("PRODUCTO         CANT.   PRECIO\n")
        printer.text("--------------------------------\n")
        for item in items:
            linea = f"{item['nombre']:<15} {item['cantidad']:>5}   {item['precio']:>8.2f}\n"
            printer.text(linea)
        printer.text("--------------------------------\n")
        printer.text(f"TOTAL:          {total_pago:>10.2f} COP\n")
        printer.text("--------------------------------\n\n")
        printer.cut()
        print(f"✅ Pedido #{numero_pedido} enviado a la impresora.")
        return True
    except Exception as e:
        print(f"❌ Error al conectar o imprimir: {e}")
        print(f"   Verifica que el VID (0x{PRINTER_VID:04x}) y PID (0x{PRINTER_PID:04x}) sean correctos.")
        return False
    finally:
        if printer:
            printer.close()

def main_loop():
    """Bucle principal que consulta e imprime nuevas órdenes."""
    printed_orders = load_printed_orders(PRINTED_ORDERS_FILE)
    print("🖨️  Iniciando sistema de impresión de órdenes...")
    print(f"Consultando órdenes para '{RESTAURANT_ID}' cada {CHECK_INTERVAL_SECONDS} segundos.")
    
    while True:
        print("\n🔄 Buscando nuevas órdenes...")
        orders = get_orders_graphql(RESTAURANT_ID)
        
        if orders:
            new_orders_found = False
            for order in orders:
                if order["status"] == "pending" and order["id"] not in printed_orders:
                    new_orders_found = True
                    print(f"   -> Encontrada nueva orden pendiente: {order['id']}")
                    
                    items_to_print = [{'nombre': p['name'], 'cantidad': p['quantity'], 'precio': p['price']} for p in order['products']]
                    
                    success = imprimir_pedido(
                        items=items_to_print,
                        total_pago=order['total'],
                        nombre_cliente=order['customer']['name'],
                        numero_pedido=order['id']
                    )
                    
                    if success:
                        printed_orders.add(order['id'])
                        save_printed_orders(PRINTED_ORDERS_FILE, printed_orders)
                        print(f"   💾 Orden #{order['id']} guardada en el registro.")
            
            if not new_orders_found:
                print("...no hay órdenes nuevas pendientes.")
        
        time.sleep(CHECK_INTERVAL_SECONDS)

if __name__ == "__main__":
    try:
        main_loop()
    except KeyboardInterrupt:
        print("\n🛑 Sistema de impresión detenido por el usuario.") 
