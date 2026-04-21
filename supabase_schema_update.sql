
-- 1. Table for Comments
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede ver comentarios" 
ON public.comments FOR SELECT 
USING (true);

CREATE POLICY "Usuarios autenticados pueden comentar" 
ON public.comments FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Dueños pueden borrar sus comentarios" 
ON public.comments FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT user_id FROM public.posts WHERE id = post_id
));

-- 2. Table for Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(target_user_id, reviewer_id) -- One review per user pair
);

-- RLS for Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede ver reseñas" 
ON public.reviews FOR SELECT 
USING (true);

CREATE POLICY "Usuarios pueden dejar reseñas a otros" 
ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() = reviewer_id AND auth.uid() <> target_user_id);

CREATE POLICY "Solo el autor puede borrar su reseña" 
ON public.reviews FOR DELETE 
USING (auth.uid() = reviewer_id);

-- 3. Notifications trigger function (Optional improvement, but I'll do it via code for now to keep it simple as requested)
