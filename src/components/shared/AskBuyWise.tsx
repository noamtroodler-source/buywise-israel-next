import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Square, RotateCcw, Sparkles, ThumbsUp, ThumbsDown, Loader2, History, ChevronLeft, Calculator, BookOpen, UserPlus, Copy, Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import ReactMarkdown from 'react-markdown';
import { useNavigate, Link } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAskBuyWise, type ChatMessage, type ConversationSummary } from '@/hooks/useAskBuyWise';
import { usePageContext } from '@/hooks/usePageContext';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

// --- CTA Detection ---
function detectCTAs(content: string): { label: string; icon: React.ReactNode; path: string }[] {
  const ctas: { label: string; icon: React.ReactNode; path: string }[] = [];
  const lower = content.toLowerCase();

  if (lower.includes('purchase tax') || lower.includes('mas rechisha')) {
    ctas.push({ label: 'Calculate Purchase Tax', icon: <Calculator className="w-3 h-3" />, path: '/tools?tool=purchase-tax' });
  } else if (lower.includes('mortgage') || lower.includes('monthly payment')) {
    ctas.push({ label: 'Try Mortgage Calculator', icon: <Calculator className="w-3 h-3" />, path: '/tools?tool=mortgage' });
  } else if (lower.includes('true cost') || lower.includes('hidden cost') || lower.includes('closing cost')) {
    ctas.push({ label: 'Calculate True Cost', icon: <Calculator className="w-3 h-3" />, path: '/tools?tool=true-cost' });
  } else if (lower.includes('afford')) {
    ctas.push({ label: 'Check Affordability', icon: <Calculator className="w-3 h-3" />, path: '/tools?tool=affordability' });
  }

  // Guide CTAs
  const guidePatterns: [RegExp, string, string][] = [
    [/buying.*(guide|process)/i, 'Read Buying Guide', '/guides/buying-in-israel'],
    [/oleh|olim|new immigrant/i, 'Read Oleh Guide', '/guides/oleh-buyer'],
    [/new construction|developer|off.?plan/i, 'Read New Construction Guide', '/guides/new-construction'],
    [/rent vs.? buy/i, 'Read Rent vs Buy Guide', '/guides/rent-vs-buy'],
  ];

  for (const [pattern, label, path] of guidePatterns) {
    if (pattern.test(content) && ctas.length < 2) {
      ctas.push({ label, icon: <BookOpen className="w-3 h-3" />, path });
      break;
    }
  }

  return ctas.slice(0, 2);
}

// --- Markdown with SPA links ---
function ChatMarkdown({ content }: { content: string }) {
  const navigate = useNavigate();

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_li]:mb-0.5 [&_a]:text-primary [&_a]:underline">
      <ReactMarkdown
        components={{
          a: ({ href, children, ...props }) => {
            if (href && href.startsWith('/')) {
              return (
                <a
                  {...props}
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(href);
                  }}
                  className="text-primary underline cursor-pointer hover:text-primary/80"
                >
                  {children}
                </a>
              );
            }
            return (
              <a {...props} href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// --- Feedback Buttons ---
function FeedbackButtons({ messageId, onFeedback }: { messageId: string; onFeedback: (id: string, rating: 'good' | 'bad') => void }) {
  const [submitted, setSubmitted] = useState<'good' | 'bad' | null>(null);

  const handleClick = (rating: 'good' | 'bad') => {
    if (submitted) return;
    setSubmitted(rating);
    onFeedback(messageId, rating);
  };

  if (submitted) {
    return (
      <span className="text-[10px] text-muted-foreground">
        {submitted === 'good' ? '👍' : '🙏'}
      </span>
    );
  }

  return (
    <>
      <button onClick={() => handleClick('good')} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Helpful">
        <ThumbsUp className="w-3 h-3" />
      </button>
      <button onClick={() => handleClick('bad')} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Not helpful">
        <ThumbsDown className="w-3 h-3" />
      </button>
    </>
  );
}

// --- Inline CTAs ---
function InlineCTAs({ content }: { content: string }) {
  const navigate = useNavigate();
  const ctas = detectCTAs(content);
  if (ctas.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 ml-9 mt-1.5">
      {ctas.map((cta) => (
        <button
          key={cta.path}
          onClick={() => navigate(cta.path)}
          className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
        >
          {cta.icon}
          {cta.label}
        </button>
      ))}
    </div>
  );
}

// --- Follow-up Chips ---
function FollowUpChips({ followUps, onSelect, disabled }: { followUps: string[]; onSelect: (s: string) => void; disabled: boolean }) {
  if (!followUps.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 ml-9 mt-2">
      {followUps.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          disabled={disabled}
          className="text-[11px] px-2.5 py-1 rounded-full border border-primary/20 text-primary/80 hover:bg-primary/5 transition-colors disabled:opacity-50 text-left"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// --- Copy Button ---
function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      title="Copy answer"
    >
      {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// --- Chat Bubble ---
function ChatBubble({
  message, isLast, isStreaming, onFeedback, onFollowUp,
}: {
  message: ChatMessage; isLast: boolean; isStreaming: boolean;
  onFeedback: (id: string, rating: 'good' | 'bad') => void;
  onFollowUp: (s: string) => void;
}) {
  const isUser = message.role === 'user';
  const showFeedback = !isUser && message.id && message.content && !(isLast && isStreaming);
  const showFollowUps = !isUser && isLast && !isStreaming && (message.followUps?.length ?? 0) > 0;
  const showCTAs = !isUser && message.content && !(isLast && isStreaming);

  return (
    <div className="mb-4">
      <div className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
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
            <ChatMarkdown content={message.content} />
          ) : (
            <div className="flex gap-1 py-1">
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          )}
        </div>
      </div>
      {showCTAs && <InlineCTAs content={message.content} />}
      {showFeedback && (
        <div className="flex gap-1 ml-9 mt-0.5 items-center">
          <CopyButton content={message.content} />
          <FeedbackButtons messageId={message.id!} onFeedback={onFeedback} />
        </div>
      )}
      {showFollowUps && <FollowUpChips followUps={message.followUps!} onSelect={onFollowUp} disabled={isStreaming} />}
    </div>
  );
}

// --- Guest Signup Nudge ---
function GuestNudge() {
  return (
    <div className="mx-4 mb-3 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20 text-sm">
      <div className="flex items-start gap-2">
        <UserPlus className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-foreground font-medium text-xs">Sign up for unlimited chat & history</p>
          <p className="text-muted-foreground text-[11px] mt-0.5">
            Save your conversations and get personalized advice.
          </p>
          <Link
            to="/signup"
            className="inline-block mt-1.5 text-[11px] font-medium text-primary hover:text-primary/80 underline"
          >
            Create free account →
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- Suggestion Chips ---
function SuggestionChips({ suggestions, onSelect, disabled }: { suggestions: string[]; onSelect: (s: string) => void; disabled: boolean }) {
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

// --- History Panel ---
function HistoryPanel({ conversations, currentId, onSelect, onNewChat, onBack }: {
  conversations: ConversationSummary[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-sm font-semibold flex-1">Chat History</h3>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onNewChat}>
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <p className="text-muted-foreground text-xs text-center py-8">No previous conversations</p>
        ) : (
          <div className="py-2">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={cn(
                  'w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors',
                  c.id === currentId && 'bg-muted'
                )}
              >
                <p className="text-sm font-medium truncate">{c.title || 'Untitled conversation'}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(c.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// --- Chat Header ---
function ChatHeader({ onClose, onClear, onHistory, showClear, showHistory }: {
  onClose: () => void; onClear: () => void; onHistory: () => void; showClear: boolean; showHistory: boolean;
}) {
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
        {showHistory && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onHistory} title="Chat history">
            <History className="w-3.5 h-3.5" />
          </Button>
        )}
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

// --- Chat Body ---
function ChatBody({
  messages, suggestions, isStreaming, error, isAtLimit, isLoading, showGuestNudge, onSuggestion, onFeedback, onFollowUp, scrollRef,
}: {
  messages: ChatMessage[]; suggestions: string[]; isStreaming: boolean; error: string | null; isAtLimit: boolean; isLoading: boolean; showGuestNudge: boolean;
  onSuggestion: (s: string) => void; onFeedback: (id: string, rating: 'good' | 'bad') => void; onFollowUp: (s: string) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
}) {
  const showSuggestions = messages.length === 0 && !isLoading;
  return (
    <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
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
        <ChatBubble
          key={msg.id || i}
          message={msg}
          isLast={i === messages.length - 1}
          isStreaming={isStreaming}
          onFeedback={onFeedback}
          onFollowUp={onFollowUp}
        />
      ))}
      {error && (
        <div className="mx-9 mb-3 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs">{error}</div>
      )}
      {showGuestNudge && <GuestNudge />}
      {isAtLimit && (
        <div className="mx-9 mb-3 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-xs">
          You've reached the message limit for this session. Start a new chat to continue!
        </div>
      )}
    </ScrollArea>
  );
}

// --- Chat Input ---
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
    <div className="px-4 py-3 border-t border-border">
      <form onSubmit={handleSubmit}>
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
      <p className="text-[9px] text-muted-foreground text-center mt-1.5">AI-powered • Always verify with a licensed professional</p>
    </div>
  );
}

// --- Chat Panel ---
function ChatPanel({ onClose }: { onClose: () => void }) {
  const {
    messages, isStreaming, error, isAtLimit, isLoading, isAuthenticated, showGuestNudge, conversations,
    sendMessage, stopStreaming, clearChat, submitFeedback, loadConversationById,
  } = useAskBuyWise();
  const { description, suggestions } = usePageContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (msg: string) => sendMessage(msg, description);

  if (showHistory) {
    return (
      <HistoryPanel
        conversations={conversations}
        currentId={null}
        onSelect={(id) => {
          loadConversationById(id);
          setShowHistory(false);
        }}
        onNewChat={() => {
          clearChat();
          setShowHistory(false);
        }}
        onBack={() => setShowHistory(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        onClose={onClose}
        onClear={clearChat}
        onHistory={() => setShowHistory(true)}
        showClear={messages.length > 0}
        showHistory={isAuthenticated === true && conversations.length > 0}
      />
      <ChatBody
        messages={messages}
        suggestions={suggestions}
        isStreaming={isStreaming}
        error={error}
        isAtLimit={isAtLimit}
        isLoading={isLoading}
        showGuestNudge={showGuestNudge}
        onSuggestion={(s) => sendMessage(s, description)}
        onFeedback={submitFeedback}
        onFollowUp={(s) => sendMessage(s, description)}
        scrollRef={scrollRef}
      />
      <ChatInput onSubmit={handleSend} isStreaming={isStreaming} isAtLimit={isAtLimit} onStop={stopStreaming} />
    </div>
  );
}

// --- Main Button ---
export function AskBuyWiseButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    trackEvent('chat_opened', 'ask_buywise');
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && !isOpen && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpen}
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
