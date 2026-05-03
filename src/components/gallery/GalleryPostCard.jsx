import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function GalleryPostCard({ post, currentUserEmail, onLikeToggle, onOpenComments }) {
  const [animating, setAnimating] = useState(false);
  const isLiked = (post.likes || []).includes(currentUserEmail);
  const likeCount = post.like_count || 0;
  const commentCount = post.comment_count || 0;

  async function handleLike() {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
    onLikeToggle(post);
  }

  const timeAgo = post.created_date
    ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true })
    : "";

  return (
    <div className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-lg">
      {/* Image */}
      <div className="relative">
        <img
          src={post.image_url}
          alt={post.prompt}
          className="w-full aspect-square object-cover"
          loading="lazy"
        />
        {/* Style badge */}
        {post.style && (
          <span className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
            {post.style}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Artist & time */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-black text-foreground">
            🎨 {post.artist_name || "Anonymous"}
          </span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-all active:scale-90 ${
              isLiked ? "text-red-500" : "text-muted-foreground"
            }`}
          >
            <Heart
              size={22}
              fill={isLiked ? "currentColor" : "none"}
              className={animating ? "scale-125 transition-transform" : "transition-transform"}
            />
            <span className="text-sm font-bold">{likeCount}</span>
          </button>
          <button
            onClick={() => onOpenComments(post)}
            className="flex items-center gap-1.5 text-muted-foreground active:scale-90 transition-all"
          >
            <MessageCircle size={22} />
            <span className="text-sm font-bold">{commentCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}