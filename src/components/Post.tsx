import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import "../styles/socialFeed.css";

export type SocialPost = {
  id: string;
  userId: string;
  nickname: string;
  isAnonymous: boolean;
  theme: string;
  topic: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  createdAt: Date | null;
};

type PostProps = {
  post: SocialPost;
};

type PostComment = {
  id: string;
  content: string;
  nickname: string;
  createdAt: Date | null;
};

const getReadableFirestoreError = (
  err: unknown,
  fallback: string
): string => {
  const candidate = err as { code?: unknown; message?: unknown };
  const code = typeof candidate?.code === "string" ? candidate.code : "";
  const message =
    typeof candidate?.message === "string" ? candidate.message : "";

  if (code === "permission-denied") {
    return "Permission denied. Update Firestore rules for this action.";
  }

  if (message) return `${fallback} (${message})`;
  return fallback;
};

const formatCreatedAt = (date: Date | null): string => {
  if (!date) return "Unknown date";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const toDateFromUnknown = (value: unknown): Date | null => {
  if (value instanceof Date) return value;

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    const converted = (value as { toDate: () => Date }).toDate();
    return converted instanceof Date ? converted : null;
  }

  if (typeof value === "string" || typeof value === "number") {
    const converted = new Date(value);
    if (!Number.isNaN(converted.getTime())) return converted;
  }

  return null;
};

const toComment = (id: string, data: DocumentData): PostComment | null => {
  const content = typeof data.content === "string" ? data.content : "";
  if (!content.trim()) return null;

  const nickname =
    typeof data.nickname === "string" && data.nickname.trim()
      ? data.nickname.trim()
      : "Anonymous";

  return {
    id,
    content,
    nickname,
    createdAt: toDateFromUnknown(data.createdAt),
  };
};

const Post = ({ post }: PostProps) => {
  const authorLabel = post.isAnonymous ? "Anonymous" : post.nickname;
  const currentUser = auth.currentUser;

  const [likedByCurrentUser, setLikedByCurrentUser] = useState(false);
  const [liking, setLiking] = useState(false);
  const [interactionError, setInteractionError] = useState<string | null>(null);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setLikedByCurrentUser(false);
      return;
    }

    const likeRef = doc(db, "posts", post.id, "likes", currentUser.uid);
    const unsubscribe = onSnapshot(likeRef, (snap) => {
      setLikedByCurrentUser(snap.exists());
    });

    return () => unsubscribe();
  }, [currentUser, post.id]);

  useEffect(() => {
    if (!commentsOpen) return;

    const commentsQuery = query(
      collection(db, "posts", post.id, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const nextComments = snapshot.docs
        .map((docSnap) => toComment(docSnap.id, docSnap.data()))
        .filter((comment): comment is PostComment => comment !== null);
      setComments(nextComments);
    });

    return () => unsubscribe();
  }, [commentsOpen, post.id]);

  const handleToggleLike = async () => {
    setInteractionError(null);

    const user = auth.currentUser;
    if (!user) {
      setInteractionError("Sign in to like posts.");
      return;
    }

    setLiking(true);

    try {
      const postRef = doc(db, "posts", post.id);
      const likeRef = doc(db, "posts", post.id, "likes", user.uid);
      const likeSnap = await getDoc(likeRef);

      if (likeSnap.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
      } else {
        await setDoc(likeRef, {
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        await updateDoc(postRef, { likesCount: increment(1) });
      }
    } catch (err) {
      console.error("[Post] Failed to update like", err);
      setInteractionError(
        getReadableFirestoreError(err, "Failed to update like.")
      );
    } finally {
      setLiking(false);
    }
  };

  const handleAddComment = async () => {
    setInteractionError(null);

    const user = auth.currentUser;
    if (!user) {
      setInteractionError("Sign in to comment.");
      return;
    }

    const trimmedComment = newComment.trim();
    if (!trimmedComment) return;

    setCommenting(true);

    try {
      const userDocSnap = await getDoc(doc(db, "users", user.uid));
      const nicknameFromDoc =
        userDocSnap.exists() && typeof userDocSnap.data().nickname === "string"
          ? userDocSnap.data().nickname.trim()
          : "";
      const nickname = nicknameFromDoc || "Anonymous";

      await addDoc(collection(db, "posts", post.id, "comments"), {
        userId: user.uid,
        nickname,
        content: trimmedComment,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "posts", post.id), {
        commentsCount: increment(1),
      });

      setNewComment("");
      setCommentsOpen(true);
    } catch (err) {
      console.error("[Post] Failed to add comment", err);
      setInteractionError(
        getReadableFirestoreError(err, "Failed to add comment.")
      );
    } finally {
      setCommenting(false);
    }
  };

  return (
    <article className="post-card">
      <header className="post-header">
        <strong className="post-author">{authorLabel}</strong>
        <span className="post-date">{formatCreatedAt(post.createdAt)}</span>
      </header>

      <p className="post-topic-line">
        <span className="post-tag">Theme: {post.theme || "General"}</span>
        <span className="post-tag">Topic: {post.topic || "General"}</span>
      </p>

      <p className="post-content">{post.content}</p>

      <footer className="post-footer">
        <button
          type="button"
          className={`post-action-btn ${likedByCurrentUser ? "active" : ""}`}
          onClick={handleToggleLike}
          disabled={liking}
        >
          {likedByCurrentUser ? "❤️ Liked" : "🤍 Like"} ({post.likesCount})
        </button>
        <button
          type="button"
          className="post-action-btn"
          onClick={() => setCommentsOpen((prev) => !prev)}
        >
          💬 Comment ({post.commentsCount})
        </button>
      </footer>

      {interactionError && <p className="post-form-error">{interactionError}</p>}

      {commentsOpen && (
        <div className="post-comments-section">
          <div className="post-comment-form">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              maxLength={500}
            />
            <button
              type="button"
              onClick={handleAddComment}
              disabled={commenting || !newComment.trim()}
            >
              {commenting ? "Sending..." : "Send"}
            </button>
          </div>

          <div className="post-comments-list">
            {comments.length === 0 ? (
              <p className="post-no-comments">No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="post-comment-item">
                  <div className="post-comment-meta">
                    <strong>{comment.nickname}</strong>
                    <span>{formatCreatedAt(comment.createdAt)}</span>
                  </div>
                  <p>{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </article>
  );
};

export default Post;
