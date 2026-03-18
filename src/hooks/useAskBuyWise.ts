import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getOrCreateGuestId } from '@/utils/guestId';
import { trackEvent } from '@/lib/analytics';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  id?: string; // DB message ID (set after persistence)
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-buywise`;
const MAX_MESSAGES = 20;

export function useAskBuyWise() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const isAtLimit = userMessageCount >= MAX_MESSAGES;

  // Load existing conversation on mount
  useEffect(() => {
    loadConversation();
  }, []);

  async function loadConversation() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Authenticated: load latest conversation
        const { data: convos } = await supabase
          .from('chat_conversations')
          .select('id')
          .eq('user_id', session.user.id)
          .order('updated_at', { ascending: false })
          .limit(1) as any;

        if (convos?.length) {
          const convoId = convos[0].id;
          setConversationId(convoId);
          const { data: msgs } = await supabase
            .from('chat_messages')
            .select('id, role, content')
            .eq('conversation_id', convoId)
            .order('created_at', { ascending: true }) as any;
          if (msgs?.length) {
            setMessages(msgs.map((m: any) => ({ role: m.role, content: m.content, id: m.id })));
          }
        }
      }
      // Guest conversations are ephemeral in the UI but persisted via edge function
    } catch (e) {
      console.error('Failed to load conversation:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function getOrCreateConversation(pageContext: string): Promise<string | null> {
    if (conversationId) return conversationId;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data, error: err } = await supabase
          .from('chat_conversations')
          .insert({ user_id: session.user.id, page_context: pageContext } as any)
          .select('id')
          .single() as any;
        if (err) throw err;
        setConversationId(data.id);
        return data.id;
      } else {
        // For guests, we'll persist via a separate mechanism if needed
        // For now, create a local-only conversation marker
        const localId = crypto.randomUUID();
        setConversationId(localId);
        return localId;
      }
    } catch (e) {
      console.error('Failed to create conversation:', e);
      return null;
    }
  }

  async function persistMessage(convoId: string, role: string, content: string): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null; // Only persist for authenticated users client-side

      const { data, error: err } = await supabase
        .from('chat_messages')
        .insert({ conversation_id: convoId, role, content } as any)
        .select('id')
        .single() as any;
      if (err) throw err;

      // Touch conversation updated_at
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() } as any)
        .eq('id', convoId) as any;

      return data.id;
    } catch (e) {
      console.error('Failed to persist message:', e);
      return null;
    }
  }

  const sendMessage = useCallback(async (input: string, pageContext: string) => {
    if (!input.trim() || isStreaming || isAtLimit) return;

    setError(null);
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsStreaming(true);

    trackEvent('chat_message_sent', 'ask_buywise', pageContext);

    const convoId = await getOrCreateConversation(pageContext);

    // Persist user message
    if (convoId) {
      const msgId = await persistMessage(convoId, 'user', input.trim());
      if (msgId) {
        setMessages(prev => prev.map((m, i) => i === prev.length - 1 && m.role === 'user' && !m.id ? { ...m, id: msgId } : m));
      }
    }

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantContent = '';

    // Get auth token for profile injection
    const { data: { session } } = await supabase.auth.getSession();

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          ...(session?.access_token ? { 'x-user-token': session.access_token } : {}),
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          pageContext,
          sessionId: getOrCreateGuestId(),
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        const errorMsg = errorData.error || 'Something went wrong. Please try again.';
        setError(errorMsg);
        setIsStreaming(false);
        return;
      }

      if (!resp.body) {
        setError('No response received.');
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              const finalContent = assistantContent;
              setMessages(prev =>
                prev.map((m, i) =>
                  i === prev.length - 1 && m.role === 'assistant'
                    ? { ...m, content: finalContent }
                    : m
                )
              );
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              const finalContent = assistantContent;
              setMessages(prev =>
                prev.map((m, i) =>
                  i === prev.length - 1 && m.role === 'assistant'
                    ? { ...m, content: finalContent }
                    : m
                )
              );
            }
          } catch { /* ignore */ }
        }
      }

      // Persist assistant message
      if (convoId && assistantContent) {
        const asstId = await persistMessage(convoId, 'assistant', assistantContent);
        if (asstId) {
          setMessages(prev => prev.map((m, i) => i === prev.length - 1 && m.role === 'assistant' ? { ...m, id: asstId } : m));
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setError('Connection lost. Please try again.');
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [messages, isStreaming, isAtLimit, conversationId]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  const submitFeedback = useCallback(async (messageId: string, rating: 'good' | 'bad') => {
    try {
      await supabase.from('chat_feedback').insert({ message_id: messageId, rating } as any);
      trackEvent('chat_feedback_given', 'ask_buywise', rating);
    } catch (e) {
      console.error('Failed to submit feedback:', e);
    }
  }, []);

  return {
    messages,
    isStreaming,
    error,
    isAtLimit,
    isLoading,
    sendMessage,
    stopStreaming,
    clearChat,
    submitFeedback,
  };
}
