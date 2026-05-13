-- 1. Add columns to chats table for tracking soft deletion per user
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS deleted_by_participant1 BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS deleted_by_participant2 BOOLEAN DEFAULT FALSE;

-- 2. Add columns to messages table for tracking deletion
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_by_sender BOOLEAN DEFAULT FALSE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_by_receiver BOOLEAN DEFAULT FALSE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_deleted_for_everyone BOOLEAN DEFAULT FALSE;

-- 3. Update the trigger function to reset deletion flags when a new message arrives
CREATE OR REPLACE FUNCTION public.update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chats 
  SET 
    updated_at = NOW(), 
    last_message = CASE 
      WHEN NEW.is_deleted_for_everyone THEN '🚫 Este mensaje fue eliminado' 
      ELSE NEW.content 
    END,
    deleted_by_participant1 = FALSE,
    deleted_by_participant2 = FALSE
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Add a trigger AFTER UPDATE to also update last_message if it's updated to is_deleted_for_everyone
CREATE OR REPLACE FUNCTION public.update_chat_on_message_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If the message was marked deleted for everyone, and it happens to be the most recent, 
  -- let's update the chats.last_message to reflect it
  IF NEW.is_deleted_for_everyone = TRUE AND OLD.is_deleted_for_everyone = FALSE THEN
    UPDATE public.chats
    SET last_message = '🚫 Este mensaje fue eliminado'
    WHERE id = NEW.chat_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_updated ON public.messages;
CREATE TRIGGER on_message_updated
AFTER UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.update_chat_on_message_change();
