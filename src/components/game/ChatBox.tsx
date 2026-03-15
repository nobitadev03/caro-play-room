import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: number;
  isAdmin?: boolean;
}

interface ChatBoxProps {
  roomId: string;
  myPlayerName: string;
}

export default function ChatBox({ roomId, myPlayerName }: ChatBoxProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  
  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const channel = supabase.channel(`room-${roomId}`);
    channelRef.current = channel;
    
    // Subscribe to chat broadcasts
    channel.on(
      "broadcast",
      { event: "chat" },
      (payload) => {
        const newMessage = payload.payload as ChatMessage;
        setMessages((prev) => [...prev, newMessage]);
      }
    );

    return () => {
      // Don't unsubscribe the room channel entirely here as useMultiplayerGame also uses it
      // Supabase's channel system allows multiple listeners without collision as long as we only listen for 'chat' events here
    };
  }, [roomId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      senderName: myPlayerName || "Guest",
      text: inputValue.trim(),
      timestamp: Date.now(),
      isAdmin: profile?.is_admin || false,
    };

    // Optimistically add to UI
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    // Broadcast to others
    if (channelRef.current) {
      console.log("ChatBox handleSend. profile?.is_admin:", (profile as any)?.is_admin);
      await channelRef.current.send({
        type: "broadcast",
        event: "chat",
        payload: newMessage,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/50">
        <h3 className="font-semibold text-sm">Trò chuyện</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[150px] max-h-[300px] lg:max-h-none">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Chưa có tin nhắn nào. Mọi người có thể trò chuyện tại đây!
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderName === myPlayerName;
            const messageIsAdmin = msg.isAdmin || (isMe && (profile as any)?.is_admin);

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className={`text-[10px] mb-0.5 px-1 ${messageIsAdmin ? "text-amber-600 dark:text-amber-500 font-semibold flex items-center gap-0.5" : "text-muted-foreground"}`}>
                  {isMe ? "Bạn" : msg.senderName} 
                  {messageIsAdmin && <span className="text-xs">👑</span>}
                </span>
                <div 
                  className={`text-sm py-1.5 px-3 rounded-lg max-w-[90%] break-words ${
                    messageIsAdmin 
                    ? "bg-amber-500 text-black font-medium " + (isMe ? "rounded-tr-none" : "rounded-tl-none")
                    : isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted text-foreground rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-2 border-t flex items-center gap-2 bg-muted/20">
        <Input 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Nhập tin nhắn..." 
          className="h-9 px-3 bg-background"
          maxLength={100}
        />
        <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!inputValue.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
