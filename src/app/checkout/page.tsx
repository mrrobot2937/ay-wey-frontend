"use client";
import { useCart, CartItem } from "../../contexts/CartContext";
import { useState } from "react";
import Image from "next/image";
import { apiService } from "../../services/api-service";
import { generateNumericId } from "../../types/graphql";

const paymentOptions = [
  { value: "efectivo", label: "Efectivo a la entrega" },
  { value: "transferencia", label: "Transferencia bancaria (Nequi)" },
];
const deliveryOptions = [
  { value: "mesa", label: "Para la mesa" },
  { value: "recoger", label: "Para recoger" },
  { value: "domicilio", label: "A domicilio" },
];

const NEQUI_NUMBER = "3001234567"; // Cambia por el número real
const QR_IMAGE = "/qr-nequi.png"; // Debes agregar esta imagen en public

export default function CheckoutPage() {
  const { cart, clearCart, getTotalPrice, restaurantId } = useCart();
  const [payment, setPayment] = useState(paymentOptions[0].value);
  const [delivery, setDelivery] = useState(deliveryOptions[0].value);
  // Campos de cliente removidos para pedidos por mesero
  const [address, setAddress] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mesa, setMesa] = useState("");
  const [orderId, setOrderId] = useState("");

  const subtotal = getTotalPrice();
  const total = subtotal - discount;

  function handleApplyCoupon() {
    if (coupon.toUpperCase() === "PRIMERA10" && !couponApplied) {
      setDiscount(Math.round(subtotal * 0.1));
      setCouponApplied(true);
    }
  }

  // Generar nombre del producto con variante
  function getProductDisplayName(item: CartItem) {
    if (item.selectedVariant) {
      return `${item.name} (${item.selectedVariant.size})`;
    }
    return item.name;
  }

  // Generar clave única para cada item del carrito
  function getCartItemKey(item: CartItem) {
    return item.selectedVariant ? `${item.id}-${item.selectedVariant.size}` : item.id;
  }

  async function handleOrder() {
    setLoading(true);
    setError("");
    
    try {
      // Convertir productos del carrito al formato requerido por la API
      const productos = cart.map((item) => {
        const productId = item.originalId || item.id;
        const numericId = typeof productId === 'string' 
          ? generateNumericId(productId)
          : Number(productId);
        
        return {
          id: numericId,
          // El 'nombre' del producto aquí no es crucial para el backend,
          // pero lo mantenemos por si alguna lógica lo usa.
          nombre: getProductDisplayName(item), 
          cantidad: item.quantity,
          precio: item.price
        };
      });

      // El tipo exacto que espera apiService.createOrder
      const orderData = {
        nombre: "Cliente de mesa",
        telefono: "3000000000",
        correo: "cliente@ay-wey.com",
        direccion: delivery === "domicilio" ? address : "",
        mesa: delivery === "mesa" ? mesa : "",
        productos: productos,
        total: total,
        metodo_pago: payment,
        modalidad_entrega: delivery
      };

      const response = await apiService.createOrder(orderData, restaurantId);
      
      if (response.success) {
        setOrderId(response.order_id);
        setOrderSent(true);
        clearCart();
      } else {
        throw new Error(response.message || "Error al crear el pedido");
      }
    } catch (err) {
      console.error("Error al crear pedido:", err);
      setError(err instanceof Error ? err.message : "No se pudo guardar el pedido. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // Mensaje de WhatsApp personalizado
  const WHATSAPP_NUMBER = "3000000000"; // Assuming a default phone number for WhatsApp link
  let whatsappMsg = "";
  
  if (payment === "transferencia") {
    whatsappMsg = encodeURIComponent(
      `🍽️ Pedido Ay Wey #${orderId}:\n\n${cart
        .map((item) => `- ${getProductDisplayName(item)} x${item.quantity}`)
        .join("\n")}\n\nTotal: $${total.toLocaleString()}\nPago: Transferencia bancaria (Nequi)\nEntrega: ${delivery}${delivery === "domicilio" ? `\nDirección: ${address}` : ""}${delivery === "mesa" ? `\nMesa: ${mesa}` : ""}\n\nPedido realizado por mesero.`
    );
  } else {
    whatsappMsg = encodeURIComponent(
      `🍽️ Pedido Ay Wey #${orderId}:\n\n${cart
        .map((item) => `- ${getProductDisplayName(item)} x${item.quantity}`)
        .join("\n")}\n\nTotal: $${total.toLocaleString()}\nPago: Efectivo a la entrega\nEntrega: ${delivery}${delivery === "domicilio" ? `\nDirección: ${address}` : ""}${delivery === "mesa" ? `\nMesa: ${mesa}` : ""}\n\nPedido realizado por mesero.`
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl bg-zinc-900 rounded-3xl shadow-2xl p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="text-3xl">🍽️</div>
          <div>
            <h1 className="text-3xl font-extrabold">Finalizar pedido</h1>
            <p className="text-gray-400 capitalize">Ay Wey - Pedido por Mesero</p>
          </div>
        </div>
        
        {orderSent ? (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-400">¡Pedido realizado!</h2>
            <div className="bg-zinc-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400">Número de pedido</p>
              <p className="text-2xl font-bold text-yellow-400">#{orderId}</p>
            </div>
            <p className="text-lg">
              El pedido ha sido registrado exitosamente. 
              Se envió una notificación al WhatsApp del restaurante.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-8 py-3 rounded-full bg-green-400 text-black font-bold text-lg shadow-lg hover:bg-green-300 transition-colors"
            >
              Ver Pedido en WhatsApp
            </a>
            {payment === "transferencia" && (
              <div className="mt-6 p-4 bg-yellow-400/10 border border-yellow-400 rounded-lg">
                <p className="text-yellow-400 font-bold mb-2">📱 Instrucciones de pago</p>
                <p className="text-sm">
                  El cliente debe enviar el comprobante de la transferencia al WhatsApp. 
                  El sistema lo analizará automáticamente para confirmar el pago.
                </p>
              </div>
            )}
          </div>
        ) : (
          <form
            className="space-y-6"
            onSubmit={async e => {
              e.preventDefault();
              await handleOrder();
            }}
          >
            {/* Campos de cliente removidos - pedidos por mesero */}
            <div className="bg-zinc-800 rounded-xl p-4 mb-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-2">🍽️ Pedido por Mesero</h3>
              <p className="text-gray-300 text-sm">
                Este pedido será realizado por el mesero. No se requiere información del cliente.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-bold">Método de pago</label>
                <select
                  value={payment}
                  onChange={e => setPayment(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  {paymentOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-bold">Modalidad de entrega</label>
                <select
                  value={delivery}
                  onChange={e => setDelivery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  {deliveryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {delivery === "domicilio" && (
              <div>
                <label className="block mb-2 font-bold">Dirección</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Dirección completa para la entrega"
                />
              </div>
            )}
            
            {delivery === "mesa" && (
              <div>
                <label className="block mb-2 font-bold">Número de mesa</label>
                <input
                  type="text"
                  required
                  value={mesa}
                  onChange={e => setMesa(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Ej: Mesa 5"
                />
              </div>
            )}
            
            {payment === "transferencia" && (
              <div className="bg-zinc-800 rounded-xl p-4 mt-4 flex flex-col items-center">
                <p className="text-lg font-bold text-yellow-400 mb-2">💳 Transfiere a Nequi</p>
                <Image src={QR_IMAGE} alt="QR Nequi" width={120} height={120} className="mb-2 rounded-lg" />
                <p className="text-white text-lg">
                  Número: <span className="font-mono text-yellow-400">{NEQUI_NUMBER}</span>
                </p>
                                 <p className="text-sm text-gray-400 mt-2 text-center">
                   El cliente debe transferir y enviar el comprobante al WhatsApp 
                   que se abrirá automáticamente al confirmar el pedido.
                 </p>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cupón de descuento"
                value={coupon}
                onChange={e => setCoupon(e.target.value)}
                className="flex-1 px-4 py-2 rounded-full bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                disabled={couponApplied}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-4 py-2 rounded-full bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50"
                disabled={couponApplied}
              >
                {couponApplied ? "Aplicado" : "Aplicar"}
              </button>
            </div>
            
            <div className="bg-zinc-800 rounded-xl p-4 mt-4">
              <h2 className="text-xl font-bold mb-4">Resumen del pedido</h2>
              {cart.length === 0 ? (
                <p className="text-zinc-400">No hay productos en el carrito.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {cart.map((item) => {
                    const itemKey = getCartItemKey(item);
                    return (
                      <div key={itemKey} className="flex justify-between items-center">
                        <div className="flex-1">
                          <span className="font-medium">{getProductDisplayName(item)}</span>
                          <span className="text-gray-400 ml-2">x{item.quantity}</span>
                          {item.selectedVariant && (
                            <div className="text-xs text-yellow-400">
                              {item.selectedVariant.size} • ${item.selectedVariant.price.toLocaleString()}
                            </div>
                          )}
                        </div>
                        <span className="font-bold">${(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="border-t border-zinc-700 pt-4 space-y-2">
                <div className="flex justify-between text-lg">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-lg text-green-400">
                    <span>Descuento (10%)</span>
                    <span>- ${discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-2xl font-extrabold text-yellow-400">
                  <span>Total</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            
            <button
              type="submit"
              className="w-full mt-6 py-4 rounded-full bg-green-400 text-black font-bold text-2xl shadow-lg hover:bg-green-300 transition-colors disabled:opacity-50"
              disabled={cart.length === 0 || loading}
            >
              {loading ? "Procesando..." : "Registrar Pedido"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 