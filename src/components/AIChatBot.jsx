import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, Send, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AIChatBot() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function initConversation() {
    setLoading(true);
    // Try to load existing conversations
    const convos = await base44.agents.listConversations({ agent_name: "momHelper" });
    let convo;
    if (convos.length > 0) {
      convo = await base44.agents.getConversation(convos[0].id);
      setMessages(convo.messages || []);
    } else {
      convo = await base44.agents.createConversation({
        agent_name: "momHelper",
        metadata: { name: "Chat" },
      });
      setMessages([]);
    }
    setConversation(convo);
    setLoading(false);
  }

  // Subscribe to live updates
  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsub();
  }, [conversation?.id]);

  function handleOpen() {
    setOpen(true);
    if (!conversation) initConversation();
  }

  async function handleSend() {
    if (!input.trim() || sending || !conversation) return;
    setSending(true);
    const msg = input.trim();
    setInput("");
    await base44.agents.addMessage(conversation, { role: "user", content: msg });
    setSending(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Filter to only show user and assistant messages with content
  const visibleMessages = messages.filter(m => (m.role === "user" || m.role === "assistant") && m.content);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-24 right-4 z-50 bg-primary text-primary-foreground w-16 h-16 rounded-full shadow-2xl flex items-center justify-center animate-pulse-gold"
          aria-label="Chat with AI"
        >
          <MessageCircle size={32} />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background sm:inset-auto sm:bottom-24 sm:right-4 sm:w-96 sm:h-[600px] sm:rounded-2xl sm:border-2 sm:border-border sm:shadow-2xl">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between sm:rounded-t-2xl">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌸</span>
              <div>
                <p className="text-lg font-black leading-tight">Mom's Helper</p>
                <p className="text-sm opacity-80">Ask me anything!</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-white/20">
              <X size={24} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && visibleMessages.length === 0 && (
              <div className="text-center py-8">
                <span className="text-6xl">👋</span>
                <p className="text-xl font-bold text-foreground mt-3">Hi there!</p>
                <p className="text-muted-foreground mt-1">I'm here to help. Ask me about games, settings, or just chat!</p>
              </div>
            )}

            {visibleMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border text-foreground rounded-bl-sm"
                }`}>
                  {msg.role === "user" ? (
                    <p className="text-base">{msg.content}</p>
                  ) : (
                    <ReactMarkdown className="text-base prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-card sm:rounded-b-2xl">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 bg-secondary border-2 border-border rounded-xl px-4 py-3 text-base text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className={`px-4 rounded-xl transition-all ${
                  input.trim() && !sending
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Send size={22} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}