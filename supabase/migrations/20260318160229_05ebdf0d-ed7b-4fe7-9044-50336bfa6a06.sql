
-- Chat conversations
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id TEXT,
  page_context TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat feedback
CREATE TABLE public.chat_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('good', 'bad')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;

-- Conversations: users see own
CREATE POLICY "Users read own conversations"
  ON public.chat_conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own conversations"
  ON public.chat_conversations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own conversations"
  ON public.chat_conversations FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Allow anon inserts for guest conversations (via edge function with service role)
CREATE POLICY "Service role manages guest conversations"
  ON public.chat_conversations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Messages: via conversation ownership
CREATE POLICY "Users read own messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (conversation_id IN (
    SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users insert own messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (conversation_id IN (
    SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role manages all messages"
  ON public.chat_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Feedback: anyone can insert
CREATE POLICY "Anyone can leave feedback"
  ON public.chat_feedback FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Service role manages feedback"
  ON public.chat_feedback FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Index for fast conversation lookup
CREATE INDEX idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_guest_id ON public.chat_conversations(guest_id);
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
