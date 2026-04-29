import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function GalleryCommentSheet({ post, currentUserEmail, currentUserName, onClose, onAddComment }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [post?.comments]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    await onAddComment(post, text.trim());
    setText("");
    setSubmitting(false);
  }

  const comments = post?.comments || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-card border-t-4 border-primary rounded-t-3xl w-full max-w-lg max-h-[75vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-lg font-black text-foreground">
            💬 Comments ({comments.length})
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
            <X size={22} className="text-muted-foreground" />
          </button>
        </div>

        {/* Comment list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No comments yet — be the first! 💬
            </p>
          ) : (
            comments.map((c, i) => (
              <div key={i} className={`flex gap-2 ${c.user_email === currentUserEmail ? "flex-row-reverse" : ""}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                  c.user_email === currentUserEmail
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-secondary text-foreground rounded-tl-sm"
                }`}>
                  <p className="text-xs font-bold opacity-80 mb-0.5">{c.user_name || "Anon"}</p>
                  <p className="text-sm leading-snug">{c.text}</p>
                  <p className="text-[10px] opacity-60 mt-1">
                    {c.date ? formatDistanceToNow(new Date(c.date), { addSuffix: true }) : ""}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t border-border">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value.slice(0, 200))}
            placeholder="Add a comment..."
            className="flex-1 bg-secondary border-2 border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="bg-primary text-primary-foreground p-2.5 rounded-xl disabled:opacity-40 active:scale-90 transition-all"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}