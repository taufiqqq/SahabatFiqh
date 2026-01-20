import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { User, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id?: number;
  role: string;
  content: string;
  createdAt?: string | Date;
}

interface ChatWindowProps {
  messages: Message[];
  isStreaming: boolean;
  streamedContent: string;
}

export function ChatWindow({ messages, isStreaming, streamedContent }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamedContent]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 pb-32 custom-scrollbar">
      {messages.length === 0 && !isStreaming ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-60 mt-20">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            As-salamu alaykum
          </h2>
          <p className="max-w-md text-muted-foreground">
            I am your SmartFiqh assistant. Ask me anything about Islamic values, history, or daily life.
          </p>
        </div>
      ) : (
        <>
          {messages.map((msg, index) => (
            <MessageBubble key={msg.id || index} role={msg.role} content={msg.content} />
          ))}

          {isStreaming && (
            <MessageBubble 
              role="assistant" 
              content={streamedContent || "Thinking..."} 
              isThinking={!streamedContent}
            />
          )}
          
          <div ref={scrollRef} className="h-4" />
        </>
      )}
    </div>
  );
}

function MessageBubble({ role, content, isThinking }: { role: string; content: string; isThinking?: boolean }) {
  const isUser = role === "user";

  return (
    <div className={cn(
      "flex w-full gap-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 border border-secondary/30 mt-1">
          <span className="text-lg">🕌</span>
        </div>
      )}

      <div className={cn(
        "max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 text-sm md:text-base leading-relaxed shadow-sm",
        isUser 
          ? "bg-primary text-primary-foreground rounded-tr-sm" 
          : "bg-white border border-border/60 text-foreground rounded-tl-sm",
        isThinking && "animate-pulse italic opacity-80"
      )}>
        {isThinking ? (
          <div className="flex gap-1 items-center h-6">
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
             <ReactMarkdown 
               components={{
                 p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                 strong: ({children}) => <span className="font-bold text-secondary-foreground">{children}</span>,
               }}
             >
               {content}
             </ReactMarkdown>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
          <User className="w-4 h-4 text-primary" />
        </div>
      )}
    </div>
  );
}
