import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizontal, Square } from "lucide-react";

interface MessageInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  disabled: boolean;
  isStreaming: boolean;
}

export function MessageInput({ onSend, onStop, disabled, isStreaming }: MessageInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  return (
    <div className="max-w-3xl mx-auto w-full relative z-20">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl shadow-xl shadow-primary/5 border border-primary/10 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isStreaming}
          placeholder="Ask about Islamic history, values, or Fiqh..."
          className="w-full px-5 py-4 pr-16 resize-none bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70 min-h-[60px] max-h-[150px]"
          rows={1}
        />
        
        <div className="absolute right-3 bottom-3">
          {isStreaming ? (
            <Button
              type="button"
              onClick={onStop}
              size="icon"
              className="h-9 w-9 bg-destructive hover:bg-destructive/90 text-white rounded-xl shadow-md transition-all duration-200"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!input.trim() || disabled}
              size="icon"
              className="h-9 w-9 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl shadow-md disabled:opacity-50 disabled:shadow-none transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <SendHorizontal className="h-5 w-5 ml-0.5" />
            </Button>
          )}
        </div>
      </form>
      <div className="text-center mt-2 text-[10px] text-muted-foreground/60 select-none">
        SmartFiqh may make mistakes. Please consult with scholars for fatwas.
      </div>
    </div>
  );
}
