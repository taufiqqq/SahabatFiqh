import { useConversations, useCreateConversation, useDeleteConversation } from "@/hooks/use-chat";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { PlusCircle, MessageSquare, Trash2, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { data: conversations, isLoading } = useConversations();
  const createMutation = useCreateConversation();
  const deleteMutation = useDeleteConversation();
  const [isOpen, setIsOpen] = useState(false);

  const handleCreate = async () => {
    try {
      const newConv = await createMutation.mutateAsync();
      setLocation(`/chat/${newConv.id}`);
      setIsOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this conversation?")) {
      await deleteMutation.mutateAsync(id);
      if (location === `/chat/${id}`) {
        setLocation("/");
      }
    }
  };

  const Content = (
    <div className="flex flex-col h-full bg-[#F9F7F0] border-r border-border/50">
      <div className="p-6 border-b border-border/50 bg-white/50 backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <span className="text-3xl">☪</span> SahabatFiqh
        </h1>
        <p className="text-xs text-muted-foreground mt-1 font-medium">Islamic AI Assistant</p>
      </div>

      <div className="p-4">
        <Button
          onClick={handleCreate}
          disabled={createMutation.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
        >
          {createMutation.isPending ? (
            "Creating..."
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Discussion
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-black/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : conversations?.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No discussions yet.
            <br />Start a new one!
          </div>
        ) : (
          conversations?.map((conv) => (
            <Link
              key={conv.id}
              href={`/chat/${conv.id}`}
              className={cn(
                "group flex items-center justify-between p-3 rounded-xl transition-all duration-200 border border-transparent",
                location === `/chat/${conv.id}`
                  ? "bg-white border-primary/20 shadow-md shadow-primary/5"
                  : "hover:bg-white/60 hover:border-black/5"
              )}
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare className={cn(
                  "h-4 w-4 shrink-0",
                  location === `/chat/${conv.id}` ? "text-secondary" : "text-muted-foreground"
                )} />
                <div className="flex flex-col min-w-0 text-left">
                  <span className={cn(
                    "truncate text-sm font-medium",
                    location === `/chat/${conv.id}` ? "text-primary" : "text-foreground/80"
                  )}>
                    {conv.title || "New Conversation"}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {conv.createdAt ? formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true }) : ''}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-md transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Link>
          ))
        )}
      </div>

      <div className="p-4 border-t border-border/50 bg-white/30 text-center">
        <p className="text-[10px] text-muted-foreground">
          Built with respect for Islamic values.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 h-screen fixed left-0 top-0 z-30">
        {Content}
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white/80 backdrop-blur border-primary/20 shadow-sm">
              <Menu className="h-5 w-5 text-primary" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 border-r-0">
            {Content}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
