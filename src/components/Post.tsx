import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import "../styles/socialFeed.css";

export type SocialPost = {
  id: string;
  userId: string;
  nickname: string;
  isAnonymous: boolean;
  title: string;
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



const Post = ({ post }: PostProps) => {
  const authorLabel = post.isAnonymous ? "Anonymous" : post.nickname;
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  const [likedByCurrentUser, setLikedByCurrentUser] = useState(false);
  const [liking, setLiking] = useState(false);
  const [interactionError, setInteractionError] = useState<string | null>(null);

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



  return (
    <article
      className="post-card post-card--clickable"
      onClick={() => navigate(`/social/${post.id}`)}
    >
      <header className="post-header">
        <strong className="post-author">{authorLabel}</strong>
        <span className="post-date">{formatCreatedAt(post.createdAt)}</span>
      </header>

      <h3 className="post-title">{post.title || "Innlegg uten navn"}</h3>

      <p className="post-topic-line">
        <span className="post-tag">Emne: {post.theme || "General"}</span>
        <span className="post-tag">Tema: {post.topic || "General"}</span>
      </p>

      <p className="post-content">{post.content}</p>

      <footer className="post-footer" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`post-action-btn ${likedByCurrentUser ? "active" : ""}`}
          onClick={handleToggleLike}
          disabled={liking}
        >
          {likedByCurrentUser ? "❤️" : "🤍"} ({post.likesCount})
        </button>
        <span className="post-comment-count">💬 {post.commentsCount}</span>
      </footer>

      {interactionError && <p className="post-form-error">{interactionError}</p>}
    </article>
  );
};

export default Post;
