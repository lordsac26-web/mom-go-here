import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDailyMissions } from "../hooks/useDailyMissions";
import { ArrowLeft, TrendingUp, Clock, Palette } from "lucide-react";
import GalleryPostCard from "../components/gallery/GalleryPostCard";
import GalleryCommentSheet from "../components/gallery/GalleryCommentSheet";
import { toast } from "sonner";

const SORT_OPTIONS = [
  { key: "recent", label: "Recent", icon: Clock },
  { key: "popular", label: "Popular", icon: TrendingUp },
];

export default function Gallery() {
  const [sortBy, setSortBy] = useState("recent");
  const [currentUser, setCurrentUser] = useState(null);
  const [commentPost, setCommentPost] = useState(null);
  const queryClient = useQueryClient();
  const { reportMissionProgress } = useDailyMissions();

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u));
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["gallery_posts", sortBy],
    queryFn: () => base44.entities.GalleryPost.list(
      sortBy === "popular" ? "-like_count" : "-created_date",
      50
    ),
  });

  async function handleLikeToggle(post) {
    if (!currentUser?.email) return;
    const likes = post.likes || [];
    const isLiked = likes.includes(currentUser.email);
    const newLikes = isLiked
      ? likes.filter(e => e !== currentUser.email)
      : [...likes, currentUser.email];

    await base44.entities.GalleryPost.update(post.id, {
      likes: newLikes,
      like_count: newLikes.length,
    });
    // Report gallery like mission (only on new likes, not unlikes)
    if (!isLiked) reportMissionProgress("gallery_like");
    queryClient.invalidateQueries({ queryKey: ["gallery_posts"] });
  }

  async function handleAddComment(post, text) {
    if (!currentUser?.email) return;

    let displayName = "Anonymous";
    const profiles = await base44.entities.UserProfile.filter({ user_email: currentUser.email });
    if (profiles[0]?.display_name) displayName = profiles[0].display_name;
    else if (currentUser.full_name) displayName = currentUser.full_name;

    const newComment = {
      user_email: currentUser.email,
      user_name: displayName,
      text,
      date: new Date().toISOString(),
    };

    const updatedComments = [...(post.comments || []), newComment];
    await base44.entities.GalleryPost.update(post.id, {
      comments: updatedComments,
      comment_count: updatedComments.length,
    });

    // Update local commentPost state for the sheet
    setCommentPost(prev => prev ? {
      ...prev,
      comments: updatedComments,
      comment_count: updatedComments.length,
    } : null);

    queryClient.invalidateQueries({ queryKey: ["gallery_posts"] });
    toast.success("Comment added!");
  }

  return (
    <div className="min-h-screen px-4 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="flex items-center gap-1 text-primary font-bold">
          <ArrowLeft size={20} /> Home
        </Link>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Palette size={24} className="text-primary" /> Gallery
        </h1>
        <Link
          to="/games/artstudio"
          className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1.5 rounded-xl"
        >
          + Create
        </Link>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 mb-4">
        {SORT_OPTIONS.map(opt => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                sortBy === opt.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-foreground border-border"
              }`}
            >
              <Icon size={16} /> {opt.label}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🖼️</div>
          <h2 className="text-xl font-black text-foreground mb-2">No artwork yet!</h2>
          <p className="text-muted-foreground mb-4">Be the first to share your AI creation.</p>
          <Link
            to="/games/artstudio"
            className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl inline-block"
          >
            🎨 Create Art
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {posts.map(post => (
            <GalleryPostCard
              key={post.id}
              post={post}
              currentUserEmail={currentUser?.email}
              onLikeToggle={handleLikeToggle}
              onOpenComments={setCommentPost}
            />
          ))}
        </div>
      )}

      {/* Comment Sheet */}
      {commentPost && (
        <GalleryCommentSheet
          post={commentPost}
          currentUserEmail={currentUser?.email}
          currentUserName={currentUser?.full_name}
          onClose={() => setCommentPost(null)}
          onAddComment={handleAddComment}
        />
      )}
    </div>
  );
}