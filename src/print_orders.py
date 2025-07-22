import requests
import time
import json
from escpos.printer import Usb
import pygame  # <-- Usar pygame para reproducir audio

# --- CONFIGURACIÓN ---
GRAPHQL_URL = "https://choripam-backend-real.vercel.app/graphql"
RESTAURANT_ID = "ay-wey"
CHECK_INTERVAL_SECONDS = 2  # Tiempo de espera en segundos entre cada consulta
PRINTED_ORDERS_FILE = "printed_orders.json"  # Archivo para guardar las órdenes impresas

PRINTER_VID = 0x0483
PRINTER_PID = 0x070b

# --- FUNCIONES DE PERSISTENCIA ---
def load_printed_orders(file_path: str) -> dict:
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            # Si es una lista antigua, conviértela a dict vacío
            if isinstance(data, list):
                print("⚠️  El archivo de órdenes impresas es una lista antigua. Se convertirá a dict vacío.")
                return {}
            print(f"📄 Se cargaron {len(data)} órdenes del archivo de registro.")
            return data
    except FileNotFoundError:
        print("📄 No se encontró el archivo de registro. Se creará uno nuevo.")
        return {}
    except json.JSONDecodeError:
        print(f"⚠️  El archivo '{file_path}' está corrupto o vacío. Empezando de cero.")
        return {}

def save_printed_orders(file_path: str, data: dict):
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=4)

# --- FUNCIONES PRINCIPALES ---
def get_orders_graphql(restaurant_id: str):
    query = """
    query GetOrders($restaurantId: String!) {
      orders(restaurantId: $restaurantId) {
        id
        status
        customer { name }
        products { name, quantity, price }
        total
        mesa
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

def order_products_snapshot(order):
    return sorted([(p['name'], p['quantity']) for p in order['products']])

def imprimir_pedido(items, total_pago, nombre_cliente, numero_pedido, modificacion=False):
    printer = None
    try:
        printer = Usb(PRINTER_VID, PRINTER_PID)
        printer.set(align='center', font='b', height=2, width=2)
        if modificacion:
            printer.text("MODIFICACIÓN DE PEDIDO\n")
        else:
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

def sonar_audio_nuevo_pedido():
    try:
        pygame.mixer.init()
        pygame.mixer.music.load("/home/mafcota/Downloads/grito_mexicano.mp3")  # Cambia la ruta si tu mp3 está en otro lugar
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            time.sleep(0.1)
    except Exception as e:
        print(f"⚠️  No se pudo reproducir el sonido: {e}")

def imprimir_pedido_cocina(items, nombre_cliente, numero_pedido, modificacion=False):
    printer = None
    try:
        printer = Usb(PRINTER_VID, PRINTER_PID)
        printer.set(align='center', font='b', height=2, width=2)
        if modificacion:
            printer.text("MODIFICACIÓN DE PEDIDO\n")
        else:
            printer.text("ORDEN DE COCINA\n")
        printer.text("----------------\n")
        printer.set(align='left', height=1, width=1)
        printer.text(f"Pedido #: {numero_pedido}\n")
        printer.text(f"Mesa/Cliente: {nombre_cliente}\n")
        printer.text("--------------------------------\n")
        printer.text("PRODUCTO         CANT.\n")
        printer.text("--------------------------------\n")
        for item in items:
            linea = f"{item['nombre']:<15} {item['cantidad']:>5}\n"
            printer.text(linea)
        printer.text("--------------------------------\n\n")
        printer.cut()
        print(f"✅ Recibo de cocina para pedido #{numero_pedido} enviado a la impresora.")
        return True
    except Exception as e:
        print(f"❌ Error al imprimir recibo de cocina: {e}")
        return False
    finally:
        if printer:
            printer.close()

def main_loop():
    printed_orders = load_printed_orders(PRINTED_ORDERS_FILE)
    print("🖨️  Iniciando sistema de impresión de órdenes...")
    print(f"Consultando órdenes para '{RESTAURANT_ID}' cada {CHECK_INTERVAL_SECONDS} segundos.")
    while True:
        print("\n🔄 Buscando nuevas órdenes...")
        orders = get_orders_graphql(RESTAURANT_ID)
        if orders:
            for order in orders:
                if order["status"] == "pending":
                    current_snapshot = order_products_snapshot(order)
                    prev_snapshot = printed_orders.get(order["id"])
                    if prev_snapshot != current_snapshot:
                        if prev_snapshot is None:
                            print(f"   -> Nueva orden pendiente: {order['id']}")
                        else:
                            print(f"   -> Modificación de orden existente: {order['id']}")
                        sonar_audio_nuevo_pedido()
                        items_to_print = [{'nombre': p['name'], 'cantidad': p['quantity'], 'precio': p['price']} for p in order['products']]
                        imprimir_pedido_cocina(
                            items=items_to_print,
                            nombre_cliente=order['mesa'],
                            numero_pedido=order['id'],
                            modificacion=(prev_snapshot is not None)
                        )
                        try:
                            printer_sep = Usb(PRINTER_VID, PRINTER_PID)
                            printer_sep.text("\n================================\n\n")
                            printer_sep.cut()
                            printer_sep.close()
                        except Exception as e:
                            print(f"⚠️  No se pudo imprimir la línea separadora: {e}")
                        success = imprimir_pedido(
                            items=items_to_print,
                            total_pago=order['total'],
                            nombre_cliente=order['mesa'],
                            numero_pedido=order['id'],
                            modificacion=(prev_snapshot is not None)
                        )
                        if success:
                            printed_orders[order['id']] = current_snapshot
                            save_printed_orders(PRINTED_ORDERS_FILE, printed_orders)
                            print(f"   💾 Orden #{order['id']} guardada en el registro.")
        time.sleep(CHECK_INTERVAL_SECONDS)

if __name__ == "__main__":
    try:
        main_loop()
    except KeyboardInterrupt:
        print("\n🛑 Sistema de impresión detenido por el usuario.") 