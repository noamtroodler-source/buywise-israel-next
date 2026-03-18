import { useState, useRef, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Square, RotateCcw, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import ReactMarkdown from 'react-markdown';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAskBuyWise, type ChatMessage } from '@/hooks/useAskBuyWise';
import { usePageContext } from '@/hooks/usePageContext';
import { cn } from '@/lib/utils';

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-2.5 mb-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        )}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : message.content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_li]:mb-0.5 [&_a]:text-primary [&_a]:underline">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex gap-1 py-1">
            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionChips({
  suggestions,
  onSelect,
  disabled,
}: {
  suggestions: string[];
  onSelect: (s: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          disabled={disabled}
          className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function ChatHeader({ onClose, onClear, showClear }: { onClose: () => void; onClear: () => void; showClear: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Ask BuyWise</h2>
          <p className="text-[10px] text-muted-foreground">AI-powered • Always verify with a professional</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {showClear && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear} title="New chat">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function ChatBody({ 
  messages, suggestions, isStreaming, error, isAtLimit, onSuggestion, scrollRef 
}: { 
  messages: ChatMessage[]; suggestions: string[]; isStreaming: boolean; error: string | null; isAtLimit: boolean; onSuggestion: (s: string) => void; scrollRef: React.RefObject<HTMLDivElement>; 
}) {
  const showSuggestions = messages.length === 0;
  return (
    <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
      {showSuggestions && (
        <div className="mb-4">
          <div className="flex gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-sm text-foreground">
              <p className="mb-2">
                Hey! 👋 I'm here to help you navigate buying property in Israel. Ask me anything — from purchase tax to mortgage rules to understanding Hebrew terms.
              </p>
              <p className="text-muted-foreground text-xs">Try one of these:</p>
            </div>
          </div>
          <div className="ml-9">
            <SuggestionChips suggestions={suggestions} onSelect={onSuggestion} disabled={isStreaming} />
          </div>
        </div>
      )}
      {messages.map((msg, i) => (
        <ChatBubble key={i} message={msg} />
      ))}
      {error && (
        <div className="mx-9 mb-3 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs">{error}</div>
      )}
      {isAtLimit && (
        <div className="mx-9 mb-3 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-xs">
          You've reached the message limit for this session. Start a new chat to continue!
        </div>
      )}
    </ScrollArea>
  );
}

function ChatInput({ onSubmit, isStreaming, isAtLimit, onStop }: { onSubmit: (msg: string) => void; isStreaming: boolean; isAtLimit: boolean; onStop: () => void }) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSubmit(input);
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-border">
      <div className="flex gap-2 items-center">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isAtLimit ? 'Session limit reached' : 'Ask anything about buying in Israel...'}
          disabled={isAtLimit}
          className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        {isStreaming ? (
          <Button type="button" size="icon" variant="outline" className="h-9 w-9 rounded-full flex-shrink-0" onClick={onStop}>
            <Square className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <Button type="submit" size="icon" className="h-9 w-9 rounded-full flex-shrink-0" disabled={!input.trim() || isAtLimit}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </form>
  );
}

function ChatPanel({ onClose }: { onClose: () => void }) {
  const { messages, isStreaming, error, isAtLimit, sendMessage, stopStreaming, clearChat } = useAskBuyWise();
  const { description, suggestions } = usePageContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (msg: string) => sendMessage(msg, description);

  return (
    <div className="flex flex-col h-full">
      <ChatHeader onClose={onClose} onClear={clearChat} showClear={messages.length > 0} />
      <ChatBody
        messages={messages}
        suggestions={suggestions}
        isStreaming={isStreaming}
        error={error}
        isAtLimit={isAtLimit}
        onSuggestion={(s) => sendMessage(s, description)}
        scrollRef={scrollRef}
      />
      <ChatInput onSubmit={handleSend} isStreaming={isStreaming} isAtLimit={isAtLimit} onStop={stopStreaming} />
    </div>
  );
}

export function AskBuyWiseButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* FAB button */}
      <AnimatePresence>
        {isVisible && !isOpen && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
            aria-label="Ask BuyWise AI Assistant"
          >
            <MessageCircle className="w-6 h-6 lg:w-7 lg:h-7" />
            <span className="absolute right-full mr-3 px-3 py-1.5 bg-card text-foreground text-sm rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-border hidden lg:block">
              Ask BuyWise
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Desktop: popover card anchored bottom-right */}
      {!isMobile && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col"
            >
              <ChatPanel onClose={() => setIsOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Mobile: bottom drawer */}
      {isMobile && (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="max-h-[80vh]">
            <DrawerTitle className="sr-only">Ask BuyWise</DrawerTitle>
            <ChatPanel onClose={() => setIsOpen(false)} />
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
