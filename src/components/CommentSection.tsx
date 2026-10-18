import { useState } from "react";
import { Comment } from "@/lib/types";
import { useComments } from "@/lib/hooks";
import { Avatar } from "./Avatar";
import { MessageCircle, Send, Heart } from "lucide-react";
import { classNames, timeAgo } from "@/lib/utils";

interface CommentSectionProps {
  contestantId: string;
  contestantFirstName: string;
  contestantLastName: string;
}

export function CommentSection({ contestantId, contestantFirstName, contestantLastName }: CommentSectionProps) {
  const { comments, loading, addComment } = useComments(contestantId);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  async function submit() {
    if (!body.trim()) return;
    setPosting(true);
    await addComment(name, body);
    setBody("");
    setPosting(false);
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="h-5 w-5 text-brand-400" />
        <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">
          Fan comments {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {/* Comment input */}
      <div className="rounded-xl bg-ink-800/60 border border-white/10 p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          className="w-full px-3 py-2 rounded-lg bg-ink-700 border border-white/5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-brand-400 mb-2"
        />
        <div className="flex gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Say something nice about ${contestantFirstName}...`}
            rows={2}
            className="flex-1 px-3 py-2 rounded-lg bg-ink-700 border border-white/5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-brand-400 resize-none"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
          />
          <button
            onClick={submit}
            disabled={!body.trim() || posting}
            className="self-end px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 disabled:opacity-40 text-ink-900 font-bold text-sm transition-all active:scale-95 flex items-center gap-1"
          >
            <Send className="h-4 w-4" /> Post
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {loading && comments.length === 0 ? (
          <div className="text-center text-white/30 text-xs py-6">Loading comments…</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-white/30 text-xs py-6">
            <Heart className="h-5 w-5 mx-auto mb-1 text-white/20" />
            No comments yet. Be the first to hype {contestantFirstName}!
          </div>
        ) : (
          comments.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))
        )}
      </div>
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-2.5 animate-fade-in">
      <Avatar
        id={comment.id}
        firstName={comment.voter_name}
        lastName=""
        size="sm"
        className="!h-8 !w-8 !text-xs"
      />
      <div className="flex-1 min-w-0">
        <div className="rounded-xl bg-ink-700/60 border border-white/5 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-xs">{comment.voter_name}</span>
            <span className="text-white/30 text-[10px]">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-white/70 text-sm mt-0.5 break-words">{comment.body}</p>
        </div>
      </div>
    </div>
  );
}
