-- 1. Create chats table
CREATE TABLE public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1_id UUID REFERENCES auth.users(id) NOT NULL,
  participant2_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message TEXT
);

-- 2. Create messages table
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- 3. Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for chats
CREATE POLICY "Users can access their own chats" ON public.chats
  FOR ALL USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- 5. Create Policies for messages
CREATE POLICY "Users can access messages in their chats" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chats c 
      WHERE c.id = chat_id 
      AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );

-- 6. Trigger to update chat updated_at and last_message
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chats 
  SET updated_at = NOW(), last_message = NEW.content
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_inserted
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION update_chat_timestamp();

-- 7. Configure Realtime for new tables
alter publication supabase_realtime add table public.chats;
alter publication supabase_realtime add table public.messages;
