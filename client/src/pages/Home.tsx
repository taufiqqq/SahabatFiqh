import { useRoute } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { MessageInput } from "@/components/MessageInput";
import { CharacterDisplay } from "@/components/CharacterDisplay";
import { useChatStream, useConversation } from "@/hooks/use-chat";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  const [match, params] = useRoute("/chat/:id");
  const conversationId = match && params?.id ? parseInt(params.id) : 0;
  
  const { data: conversation, isLoading, isError } = useConversation(conversationId);
  const { sendMessage, stopStream, isStreaming, streamedContent } = useChatStream(conversationId);

  // Focus management or other side effects could go here
  useEffect(() => {
    if (conversationId) {
      document.title = conversation?.title ? `${conversation.title} | SmartFiqh` : "SmartFiqh";
    } else {
      document.title = "SmartFiqh - Islamic AI Assistant";
    }
  }, [conversation, conversationId]);

  return (
    <div className="flex h-screen bg-[#F9F7F0] overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col relative md:ml-72 transition-all duration-300 w-full">
        {/* Header - Mobile only mostly */}
        <header className="md:hidden h-16 border-b border-border/50 bg-white/50 backdrop-blur flex items-center justify-center">
          <h1 className="text-xl font-bold font-display text-primary">SmartFiqh</h1>
        </header>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {!match ? (
            // Empty State (Landing)
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
              <div className="mb-8 relative">
                <div className="absolute inset-0 bg-secondary/20 blur-3xl rounded-full" />
                <h1 className="relative text-6xl md:text-8xl font-display font-bold text-primary mb-2">
                  SmartFiqh
                </h1>
                <p className="relative text-xl text-muted-foreground font-light">
                  Faith-Focused Intelligence
                </p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 max-w-2xl w-full">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-border/50 hover:border-secondary/50 transition-colors">
                  <h3 className="text-lg font-bold text-primary mb-2">Islamic Knowledge</h3>
                  <p className="text-sm text-muted-foreground">Ask about history, values, and general guidance.</p>
                </div>
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-border/50 hover:border-secondary/50 transition-colors">
                  <h3 className="text-lg font-bold text-primary mb-2">Safe Environment</h3>
                  <p className="text-sm text-muted-foreground">A respectful space designed with Islamic etiquette in mind.</p>
                </div>
              </div>
              
              <p className="mt-12 text-sm text-muted-foreground">
                Select a conversation from the sidebar to begin.
              </p>
            </div>
          ) : isLoading ? (
            // Loading State
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-secondary animate-spin" />
            </div>
          ) : isError ? (
            // Error State
            <div className="flex-1 flex items-center justify-center flex-col gap-4">
              <p className="text-destructive">Failed to load conversation.</p>
            </div>
          ) : (
            // Chat Interface
            <div className="flex flex-col h-full relative">
              <ChatWindow 
                messages={conversation?.messages || []} 
                isStreaming={isStreaming} 
                streamedContent={streamedContent}
              />
              
              {/* Input Area */}
              <div className="p-4 md:p-6 pb-6 md:pb-10 w-full z-10 bg-gradient-to-t from-[#F9F7F0] via-[#F9F7F0] to-transparent">
                <MessageInput 
                  onSend={sendMessage} 
                  onStop={stopStream}
                  disabled={isStreaming} 
                  isStreaming={isStreaming}
                />
              </div>
            </div>
          )}
          
          {/* Character Overlay - Always visible at bottom left */}
          <CharacterDisplay isTalking={isStreaming} />
        </div>
      </main>
    </div>
  );
}
