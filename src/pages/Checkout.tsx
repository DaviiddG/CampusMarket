import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFeedContext } from '@/contexts/FeedContext';
import type { OrderData } from '@/contexts/FeedContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ShoppingBag, MapPin, CreditCard, MessageSquare, Hash, CheckCircle2, Package, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export default function Checkout() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { posts, createOrder } = useFeedContext();

  // Find post from context
  const post = posts.find(p => p.id === postId);

  // Form state — autofilled from user
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Autofill user data
  useEffect(() => {
    if (!user) return;
    setBuyerName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
    setBuyerEmail(user.email || '');

    // Try to get phone from profile
    supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.phone) setBuyerPhone(data.phone);
      });
  }, [user]);

  // Parse numeric price from string like "$7.190.000"
  const parseNumericPrice = (priceStr: string): number => {
    const cleaned = priceStr.replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
  };

  const formatPrice = (amount: number): string => {
    return '$' + amount.toLocaleString('es-CO');
  };

  const unitPrice = post ? parseNumericPrice(post.price) : 0;
  const totalPrice = unitPrice * quantity;

  const handleSubmit = async () => {
    if (!post || !user) return;

    // Validation
    if (!buyerName.trim() || !buyerEmail.trim() || !deliveryAddress.trim()) {
      alert('Por favor completa los campos obligatorios: nombre, email y dirección de entrega.');
      return;
    }

    setIsSubmitting(true);

    const orderData: OrderData = {
      post_id: post.id,
      seller_id: post.user_id,
      buyer_name: buyerName.trim(),
      buyer_email: buyerEmail.trim(),
      buyer_phone: buyerPhone.trim(),
      delivery_address: deliveryAddress.trim(),
      meeting_point: meetingPoint.trim(),
      payment_method: paymentMethod,
      notes: notes.trim(),
      quantity,
      total_price: formatPrice(totalPrice),
      product_name: post.businessName + ' — ' + post.description.slice(0, 60),
      product_image: post.imageUrl,
      product_price: post.price,
    };

    const success = await createOrder(orderData);

    if (success) {
      setShowSuccess(true);
      // Save phone to profile for future use
      if (buyerPhone.trim()) {
        await supabase.from('profiles').update({ phone: buyerPhone.trim() }).eq('id', user.id);
      }
    } else {
      alert('Hubo un error al crear tu pedido. Intenta nuevamente.');
    }
    setIsSubmitting(false);
  };

  // Redirect after success
  const handleGoHome = () => {
    navigate('/home');
  };

  // If post not found
  if (!post) {
    return (
      <MobileContainer className="bg-white" justifyCenter={true} hideRightSidebar>
        <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
          <Package size={48} className="text-gray-300" />
          <p className="font-roboto text-gray-500">Producto no encontrado.</p>
          <button
            onClick={() => navigate('/home')}
            className="text-primary font-roboto font-bold text-sm hover:underline"
          >
            Volver al inicio
          </button>
        </div>
      </MobileContainer>
    );
  }

  // Payment method options
  const paymentMethods = [
    { value: 'efectivo', label: '💵 Efectivo', desc: 'Paga al recibir' },
    { value: 'nequi', label: '📱 Nequi', desc: 'Transferencia Nequi' },
    { value: 'daviplata', label: '📲 Daviplata', desc: 'Transferencia Daviplata' },
    { value: 'bancolombia', label: '🏦 Bancolombia', desc: 'Transferencia bancaria' },
  ];

  return (
    <MobileContainer className="bg-[#F9FAFB]" justifyCenter={false} hideRightSidebar>
      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 12 }}
                  className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5"
                >
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="font-roboto font-bold text-xl text-black mb-2"
                >
                  ¡Pedido enviado!
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="font-roboto font-light text-gray-500 mb-8 px-2 leading-relaxed"
                >
                  Tu pedido ha sido enviado al vendedor. Recibirás una notificación cuando confirme tu compra.
                </motion.p>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoHome}
                  className="w-full h-14 bg-primary text-white rounded-2xl font-roboto font-bold text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  Volver al inicio
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full pb-[80px] lg:pb-10">
        <div className="max-w-[900px] mx-auto w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex items-center px-4 lg:px-0 pt-6 pb-4 gap-3"
          >
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </button>
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-primary" />
              <h1 className="font-roboto font-bold text-[18px] text-[#102042]">Confirmar compra</h1>
            </div>
          </motion.div>

          {/* Two Column Layout */}
          <div className="flex flex-col lg:flex-row gap-6 px-4 lg:px-0">
            
            {/* LEFT COLUMN — Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 space-y-5"
            >
              {/* Personal Info Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag size={16} className="text-primary" />
                  </div>
                  <h2 className="font-roboto font-bold text-[15px] text-[#102042]">Datos del comprador</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Nombre completo *</label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full h-[46px] bg-gray-50 rounded-xl border border-gray-100 px-4 font-roboto text-[14px] text-black placeholder:text-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Email *</label>
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full h-[46px] bg-gray-50 rounded-xl border border-gray-100 px-4 font-roboto text-[14px] text-black placeholder:text-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Teléfono</label>
                    <input
                      type="tel"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="300 123 4567"
                      className="w-full h-[46px] bg-gray-50 rounded-xl border border-gray-100 px-4 font-roboto text-[14px] text-black placeholder:text-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <Truck size={16} className="text-blue-500" />
                  </div>
                  <h2 className="font-roboto font-bold text-[15px] text-[#102042]">Datos de entrega</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Dirección de entrega *</label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Ej: Edificio A, Oficina 301, Universidad..."
                      rows={2}
                      className="w-full bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 font-roboto text-[14px] text-black placeholder:text-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5 ml-1">
                      <MapPin size={12} className="inline mr-1" />
                      Punto de encuentro en campus
                    </label>
                    <input
                      type="text"
                      value={meetingPoint}
                      onChange={(e) => setMeetingPoint(e.target.value)}
                      placeholder="Ej: Cafetería central, Bloque B..."
                      className="w-full h-[46px] bg-gray-50 rounded-xl border border-gray-100 px-4 font-roboto text-[14px] text-black placeholder:text-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                    <CreditCard size={16} className="text-green-600" />
                  </div>
                  <h2 className="font-roboto font-bold text-[15px] text-[#102042]">Método de pago</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <motion.button
                      key={method.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod(method.value)}
                      className={cn(
                        "flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left",
                        paymentMethod === method.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-gray-100 bg-gray-50 hover:border-gray-200"
                      )}
                    >
                      <span className="text-[16px] mb-1">{method.label.split(' ')[0]}</span>
                      <span className={cn(
                        "font-roboto font-bold text-[13px]",
                        paymentMethod === method.value ? "text-primary" : "text-gray-700"
                      )}>
                        {method.label.split(' ').slice(1).join(' ')}
                      </span>
                      <span className="font-roboto text-[11px] text-gray-400 mt-0.5">{method.desc}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={16} className="text-gray-400" />
                  <h2 className="font-roboto font-bold text-[15px] text-[#102042]">Notas adicionales</h2>
                  <span className="text-[11px] text-gray-300 font-roboto">(opcional)</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="¿Alguna indicación especial para el vendedor?"
                  rows={3}
                  maxLength={250}
                  className="w-full bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 font-roboto text-[14px] text-black placeholder:text-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none"
                />
              </div>

            </motion.div>

            {/* RIGHT COLUMN — Product Preview & Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full lg:w-[340px] lg:sticky lg:top-6 space-y-5 flex-shrink-0"
            >
              {/* Product Card */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                {/* Product Image */}
                <div className="w-full aspect-square overflow-hidden bg-gray-50 relative">
                  <img
                    src={post.imageUrl}
                    alt={post.description}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="bg-white/95 backdrop-blur-sm text-primary font-roboto font-bold text-[18px] px-4 py-1.5 rounded-full shadow-lg">
                      {post.price}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-100 flex-shrink-0">
                      <img
                        src={post.avatarUrl}
                        alt={post.businessName}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+'; }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-roboto font-bold text-[14px] text-black truncate">{post.businessName}</p>
                      <p className="font-roboto text-[11px] text-gray-400">Vendedor</p>
                    </div>
                  </div>
                  <p className="font-roboto font-light text-[13px] text-gray-600 leading-relaxed line-clamp-3">
                    {post.description}
                  </p>
                </div>
              </div>

              {/* Order Summary Card */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-roboto font-bold text-[14px] text-[#102042] mb-4 flex items-center gap-2">
                  <Hash size={15} className="text-gray-400" />
                  Resumen del pedido
                </h3>

                {/* Quantity Selector */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                  <span className="font-roboto text-[13px] text-gray-600">Cantidad</span>
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-roboto font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      −
                    </motion.button>
                    <span className="font-roboto font-bold text-[16px] text-primary w-8 text-center">{quantity}</span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-roboto font-bold text-primary hover:bg-primary/20 transition-colors"
                    >
                      +
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="font-roboto text-[13px] text-gray-500">Precio unitario</span>
                    <span className="font-roboto font-medium text-[13px] text-gray-700">{post.price}</span>
                  </div>
                  {quantity > 1 && (
                    <div className="flex justify-between">
                      <span className="font-roboto text-[13px] text-gray-500">× {quantity} unidades</span>
                      <span className="font-roboto font-medium text-[13px] text-gray-700">{formatPrice(totalPrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 mt-2 border-t border-gray-100">
                    <span className="font-roboto font-bold text-[15px] text-[#102042]">Total</span>
                    <span className="font-roboto font-bold text-[18px] text-primary">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button — Desktop only */}
              <div className="hidden lg:block">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="w-full h-[56px] bg-gradient-to-r from-primary to-[#1a3a6b] text-white rounded-2xl font-roboto font-bold text-[16px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      <span>Confirmar pedido</span>
                    </>
                  )}
                </motion.button>
              </div>

              {/* Security Note */}
              <div className="px-4 py-3 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-[11px] text-primary/60 font-roboto leading-relaxed text-center">
                  🔒 Tu información está protegida. El vendedor recibirá los datos necesarios para coordinar la entrega de tu pedido.
                </p>
              </div>

              {/* Submit Button — Mobile only (moved here to be at the absolute bottom) */}
              <div className="lg:hidden pb-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="w-full h-[56px] bg-gradient-to-r from-primary to-[#1a3a6b] text-white rounded-2xl font-roboto font-bold text-[16px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      <span>Confirmar pedido — {formatPrice(totalPrice)}</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
}
