import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

type PostData = {
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

type PostComment = {
  id: string;
  content: string;
  nickname: string;
  createdAt: Date | null;
};

const toDateFromUnknown = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

const formatDate = (date: Date | null): string => {
  if (!date) return "Unknown date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const toComment = (id: string, data: DocumentData): PostComment | null => {
  const content = typeof data.content === "string" ? data.content : "";
  if (!content.trim()) return null;
  return {
    id,
    content,
    nickname:
      typeof data.nickname === "string" && data.nickname.trim()
        ? data.nickname.trim()
        : "Anonymous",
    createdAt: toDateFromUnknown(data.createdAt),
  };
};

const getReadableError = (err: unknown, fallback: string): string => {
  const c = err as { code?: unknown; message?: unknown };
  if (c?.code === "permission-denied") return "Permission denied.";
  if (typeof c?.message === "string") return `${fallback} (${c.message})`;
  return fallback;
};

const PostPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [likedByCurrentUser, setLikedByCurrentUser] = useState(false);
  const [liking, setLiking] = useState(false);

  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const currentUser = auth.currentUser;

  // Load post
  useEffect(() => {
    if (!postId) return;

    const unsubscribe = onSnapshot(
      doc(db, "posts", postId),
      (snap) => {
        if (!snap.exists()) {
          setPageError("Post not found.");
          setLoading(false);
          return;
        }
        const data = snap.data();
        setPost({
          id: snap.id,
          userId: typeof data.userId === "string" ? data.userId : "",
          nickname:
            typeof data.nickname === "string" && data.nickname.trim()
              ? data.nickname.trim()
              : "Anonymous",
          isAnonymous: data.isAnonymous === true,
          theme: typeof data.theme === "string" ? data.theme : "",
          topic: typeof data.topic === "string" ? data.topic : "",
          content: typeof data.content === "string" ? data.content : "",
          likesCount: typeof data.likesCount === "number" ? data.likesCount : 0,
          commentsCount:
            typeof data.commentsCount === "number" ? data.commentsCount : 0,
          createdAt: toDateFromUnknown(data.createdAt),
        });
        setLoading(false);
      },
      () => {
        setPageError("Failed to load post.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [postId]);

  // Track like state
  useEffect(() => {
    if (!currentUser || !postId) {
      setLikedByCurrentUser(false);
      return;
    }
    const unsubscribe = onSnapshot(
      doc(db, "posts", postId, "likes", currentUser.uid),
      (snap) => setLikedByCurrentUser(snap.exists())
    );
    return () => unsubscribe();
  }, [currentUser, postId]);

  // Load comments
  useEffect(() => {
    if (!postId) return;
    const unsubscribe = onSnapshot(
      query(
        collection(db, "posts", postId, "comments"),
        orderBy("createdAt", "asc")
      ),
      (snapshot) => {
        setComments(
          snapshot.docs
            .map((d) => toComment(d.id, d.data()))
            .filter((c): c is PostComment => c !== null)
        );
      }
    );
    return () => unsubscribe();
  }, [postId]);

  const handleToggleLike = async () => {
    setActionError(null);
    const user = auth.currentUser;
    if (!user) { setActionError("Sign in to like posts."); return; }
    if (!postId) return;

    setLiking(true);
    try {
      const postRef = doc(db, "posts", postId);
      const likeRef = doc(db, "posts", postId, "likes", user.uid);
      const likeSnap = await getDoc(likeRef);

      if (likeSnap.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
      } else {
        await setDoc(likeRef, { userId: user.uid, createdAt: serverTimestamp() });
        await updateDoc(postRef, { likesCount: increment(1) });
      }
    } catch (err) {
      console.error("[PostPage] Failed to update like", err);
      setActionError(getReadableError(err, "Failed to update like."));
    } finally {
      setLiking(false);
    }
  };

  const handleAddComment = async () => {
    setActionError(null);
    const user = auth.currentUser;
    if (!user) { setActionError("Sign in to comment."); return; }
    if (!postId) return;

    const trimmed = newComment.trim();
    if (!trimmed) return;

    setCommenting(true);
    try {
      const userDocSnap = await getDoc(doc(db, "users", user.uid));
      const nicknameFromDoc =
        userDocSnap.exists() && typeof userDocSnap.data().nickname === "string"
          ? userDocSnap.data().nickname.trim()
          : "";
      const nickname = nicknameFromDoc || user.displayName || "Anonymous";

      await addDoc(collection(db, "posts", postId, "comments"), {
        userId: user.uid,
        nickname,
        content: trimmed,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "posts", postId), {
        commentsCount: increment(1),
      });

      setNewComment("");
    } catch (err) {
      console.error("[PostPage] Failed to add comment", err);
      setActionError(getReadableError(err, "Failed to add comment."));
    } finally {
      setCommenting(false);
    }
  };

  if (loading) return <div className="main-content"><p>Loading...</p></div>;
  if (pageError || !post) return <div className="main-content"><p>{pageError ?? "Post not found."}</p></div>;

  const authorLabel = post.isAnonymous ? "Anonymous" : post.nickname;

  return (
    <div className="main-content social-page">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate("/social")}
      >
        ← Tilbake
      </button>

      <article className="post-card post-card--full">
        <header className="post-header">
          <strong className="post-author">{authorLabel}</strong>
          <span className="post-date">{formatDate(post.createdAt)}</span>
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
            {likedByCurrentUser ? "❤️" : "🤍"} ({post.likesCount})
          </button>
          <span className="post-comment-count">💬 {post.commentsCount}</span>
        </footer>

        {actionError && <p className="post-form-error">{actionError}</p>}
      </article>

      <section className="post-comments-section post-comments-section--page">
        <h3>Kommentarer</h3>

        <div className="post-comment-form">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Skriv en kommentar..."
            maxLength={500}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) handleAddComment();
            }}
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
            <p className="post-no-comments">Ingen kommentarer enda, bli den første!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="post-comment-item">
                <div className="post-comment-meta">
                  <strong>{comment.nickname}</strong>
                  <span>{formatDate(comment.createdAt)}</span>
                </div>
                <p>{comment.content}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default PostPage;
