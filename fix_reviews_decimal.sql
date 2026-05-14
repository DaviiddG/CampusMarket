-- Cambiar el tipo de dato de la columna 'rating' para permitir decimales (ej. 4.5)
-- Ejecuta este comando en el editor SQL de tu panel de Supabase

ALTER TABLE public.reviews 
ALTER COLUMN rating TYPE NUMERIC(3,1);

-- También actualizamos el CHECK para asegurar que siga entre 1 y 5
ALTER TABLE public.reviews
DROP CONSTRAINT IF EXISTS reviews_rating_check;

ALTER TABLE public.reviews
ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5);
