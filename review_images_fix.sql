-- Añadir columna para imágenes en reseñas si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='image_url') THEN
        ALTER TABLE reviews ADD COLUMN image_url TEXT;
    END IF;
END $$;
