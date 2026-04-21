
-- 1. Asegurar que la tabla profiles sea pública para lectura
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede ver perfiles" ON public.profiles;
CREATE POLICY "Cualquiera puede ver perfiles" 
ON public.profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
ON public.profiles FOR ALL 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. Asegurar que el bucket de imagenes sea público
-- Primero, habilitamos acceso de lectura pública a los objetos en el bucket 'product-images'
DROP POLICY IF EXISTS "Imagenes publicas" ON storage.objects;
CREATE POLICY "Imagenes publicas"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

DROP POLICY IF EXISTS "Usuarios pueden subir sus imagenes" ON storage.objects;
CREATE POLICY "Usuarios pueden subir sus imagenes"
ON storage.objects FOR INSERT
WITH CHECK ( 
    bucket_id = 'product-images' 
    AND (auth.role() = 'authenticated')
);

DROP POLICY IF EXISTS "Usuarios pueden borrar sus imagenes" ON storage.objects;
CREATE POLICY "Usuarios pueden borrar sus imagenes"
ON storage.objects FOR DELETE
USING ( 
    bucket_id = 'product-images' 
    AND (auth.uid() = owner)
);
