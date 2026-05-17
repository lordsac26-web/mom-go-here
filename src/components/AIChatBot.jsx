import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { X, MessageCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/stores/uiStore";
import { useGameActivityStore } from "@/stores/gameActivityStore";

import ChatBubbleMessage from "./chat/ChatBubbleMessage";
import TypingIndicator from "./chat/TypingIndicator";
import ChatEmptyState from "./chat/ChatEmptyState";
import ChatInput from "./chat/ChatInput";

// Window animation variants
const windowVariants = {
  hidden: {
    opacity: 0,
    scale: 0.4,
    y: 60,
    borderRadius: "50%",
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    borderRadius: "16px",
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 28,
      mass: 0.9,
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.3,
    y: 80,
    borderRadius: "50%",
    filter: "blur(6px)",
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// Floating bubble animation
const bubbleVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 400, damping: 18 },
  },
  exit: {
    scale: 0,
    rotate: 180,
    transition: { duration: 0.2 },
  },
  hover: {
    scale: 1.12,
    boxShadow: "0 0 0 8px rgba(245,158,11,0.15), 0 8px 32px rgba(0,0,0,0.3)",
  },
  tap: { scale: 0.88 },
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 22, delay: 0.05 },
  },
};

export default function AIChatBot() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [waitingForReply, setWaitingForReply] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatbotName, setChatbotName] = useState("Rosie");
  const scrollRef = useRef(null);
  const conversationRef = useRef(null);

  const [chatBubbleEnabled, setChatBubbleEnabled] = useState(
    () => useUIStore.getState().chatBubbleEnabled
  );
  const [unreadCount, setUnreadCount] = useState(
    () => useGameActivityStore.getState().unreadCount
  );

  useEffect(() => {
    const unsubUI = useUIStore.subscribe(
      (s) => setChatBubbleEnabled(s.chatBubbleEnabled)
    );
    const unsubActivity = useGameActivityStore.subscribe(
      (s) => setUnreadCount(s.unreadCount)
    );
    return () => { unsubUI(); unsubActivity(); };
  }, []);

  const consumeMessages = () => useGameActivityStore.getState().consumeMessages();

  // Load chatbot name from profile
  useEffect(() => {
    base44.auth.me()
      .then(user => {
        if (!user?.email) return;
        return base44.entities.UserProfile.filter({ user_email: user.email });
      })
      .then(profiles => {
        if (profiles?.[0]?.chatbot_name) setChatbotName(profiles[0].chatbot_name);
      })
      .catch(() => { /* offline or not authed — keep default name */ });
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      // Smooth scroll to bottom
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, waitingForReply]);

  async function initConversation() {
    setLoading(true);
    try {
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
      conversationRef.current = convo;

      // Inject any pending game activity messages after init
      setTimeout(() => {
        const pending = consumeMessages();
        if (pending.length > 0 && conversationRef.current) {
          pending.forEach(async (msg) => {
            try {
              await base44.agents.addMessage(conversationRef.current, {
                role: "user",
                content: `[System notification — respond warmly] ${msg.text}`,
              });
            } catch { /* ignore */ }
          });
        }
      }, 500);
    } catch (err) {
      console.warn("Chat init failed:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      const msgs = data.messages || [];
      setMessages(msgs);
      conversationRef.current = { ...conversationRef.current, messages: msgs };
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.role === "assistant" && lastMsg.content) {
        setWaitingForReply(false);
      }
    });
    return () => unsub();
  }, [conversation?.id]);

  function handleOpen() {
    setOpen(true);
    if (!conversation) {
      initConversation();
    } else {
      // Inject any pending game activity messages
      injectPendingMessages();
    }
  }

  async function injectPendingMessages() {
    const pending = consumeMessages();
    if (pending.length === 0 || !conversationRef.current) return;
    for (const msg of pending) {
      await base44.agents.addMessage(conversationRef.current, {
        role: "user",
        content: `[System notification — respond warmly] ${msg.text}`,
      });
    }
  }

  const handleSend = useCallback(async (text) => {
    if (!text || sending || !conversationRef.current) return;
    setSending(true);
    setWaitingForReply(true);
    await base44.agents.addMessage(conversationRef.current, { role: "user", content: text });
    setSending(false);
  }, [sending]);

  // Handle suggestion click from empty state
  function handleSuggestion(text) {
    handleSend(text);
  }

  async function handleClearChat() {
    setLoading(true);
    const convo = await base44.agents.createConversation({
      agent_name: "momHelper",
      metadata: { name: "Chat" },
    });
    setMessages([]);
    setConversation(convo);
    conversationRef.current = convo;
    setLoading(false);
  }

  const SYSTEM_PREFIX = "[System notification — respond warmly] ";
  const visibleMessages = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && m.content)
    .filter((m) => !(m.role === "user" && m.content.startsWith("[System notification")));

  if (!chatBubbleEnabled) return null;

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            onClick={handleOpen}
            className="fixed z-50 right-3 bottom-[5.5rem] bg-gradient-to-br from-primary via-amber-500 to-orange-500 text-primary-foreground w-12 h-12 rounded-full shadow-2xl flex items-center justify-center opacity-70 hover:opacity-100"
            variants={bubbleVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover="hover"
            whileTap="tap"
            aria-label="Chat with AI"
          >
            <MessageCircle size={24} />
            {/* Notification badge */}
            {unreadCount > 0 && (
              <motion.div
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-background shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{
                scale: [1, 1.4, 1.4],
                opacity: [0.6, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              className="fixed inset-0 z-[59] bg-black/40 backdrop-blur-sm sm:hidden"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setOpen(false)}
            />

            <motion.div
              className="fixed inset-0 z-[60] flex flex-col bg-background sm:inset-auto sm:bottom-24 sm:right-4 sm:w-[400px] sm:h-[620px] sm:rounded-2xl sm:border-2 sm:border-border sm:shadow-2xl overflow-hidden"
              variants={windowVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ originX: 1, originY: 1 }}
            >
              {/* Header */}
              <motion.div
                className="bg-gradient-to-r from-primary via-amber-500 to-orange-500 text-primary-foreground px-4 py-3 flex items-center justify-between sm:rounded-t-2xl shrink-0"
                variants={headerVariants}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="text-2xl">🌸</span>
                  </motion.div>
                  <div>
                    <p className="text-lg font-black leading-tight">{chatbotName}</p>
                    <div className="flex items-center gap-1.5">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-green-300"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <p className="text-xs opacity-90 font-semibold">Online</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={handleClearChat}
                    className="flex flex-col items-center gap-0.5 p-2 rounded-xl hover:bg-white/20 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    aria-label="Clear chat"
                  >
                    <Trash2 size={18} />
                    <span className="text-[10px] font-bold leading-none">Clear</span>
                  </motion.button>
                  <motion.button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <X size={22} />
                  </motion.button>
                </div>
              </motion.div>

              {/* Messages Area */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
              >
                {loading && (
                  <motion.div
                    className="flex justify-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                )}

                {!loading && visibleMessages.length === 0 && !waitingForReply && (
                  <ChatEmptyState onSuggestionClick={handleSuggestion} />
                )}

                <AnimatePresence initial={false}>
                  {visibleMessages.map((msg, i) => (
                    <ChatBubbleMessage
                      key={`${msg.role}-${i}-${msg.content?.slice(0, 15)}`}
                      message={msg}
                      isLatest={i === visibleMessages.length - 1}
                    />
                  ))}

                  {(sending || waitingForReply) && (
                    <TypingIndicator key="typing" />
                  )}
                </AnimatePresence>
              </div>

              {/* Input */}
              <ChatInput onSend={handleSend} disabled={sending} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}