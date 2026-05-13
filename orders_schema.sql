-- ============================================================
-- CampusMarket — Tabla de Pedidos (Orders)
-- Ejecutar en la consola SQL de Supabase
-- ============================================================

-- 1. Crear tabla de pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos del comprador (snapshot al momento de compra)
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT DEFAULT '',
  
  -- Datos de entrega
  delivery_address TEXT NOT NULL,
  meeting_point TEXT DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT 'efectivo',
  notes TEXT DEFAULT '',
  
  -- Datos del producto (snapshot al momento de compra)
  product_name TEXT NOT NULL,
  product_image TEXT NOT NULL,
  product_price TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price TEXT NOT NULL,
  
  -- Estado del pedido
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para queries eficientes
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_post ON public.orders(post_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 3. Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Política: usuarios autenticados pueden crear pedidos (solo como buyer)
CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Política: compradores y vendedores pueden ver sus pedidos
CREATE POLICY "Users can view their orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Política: vendedores pueden actualizar estado de sus pedidos
CREATE POLICY "Sellers can update order status"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- 4. Agregar campo phone a profiles (si no existe)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
