import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
} from "firebase/firestore";
import Post, { type SocialPost } from "../components/Post.tsx";
import CreatePostOverlay from "../components/CreatePostOverlay.tsx";
import { db } from "../firebase";
import "../styles/socialFeed.css";

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

const toPost = (id: string, data: DocumentData): SocialPost | null => {
  const content =
    typeof data.content === "string"
      ? data.content
      : typeof data.text === "string"
      ? data.text
      : "";

  if (!content.trim()) return null;

  const nickname =
    typeof data.nickname === "string" && data.nickname.trim()
      ? data.nickname.trim()
      : "Anonymous";

  const userId = typeof data.userId === "string" ? data.userId : "";
  const isAnonymous = data.isAnonymous === true;
  const title =
    typeof data.title === "string" && data.title.trim()
      ? data.title.trim()
      : "";
  const theme = typeof data.theme === "string" ? data.theme : "";
  const topic = typeof data.topic === "string" ? data.topic : "";
  const likesCount = typeof data.likesCount === "number" ? data.likesCount : 0;
  const commentsCount =
    typeof data.commentsCount === "number" ? data.commentsCount : 0;

  return {
    id,
    userId,
    nickname,
    isAnonymous,
    title,
    theme,
    topic,
    content,
    likesCount,
    commentsCount,
    createdAt: toDateFromUnknown(data.createdAt),
  };
};

const Social = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateOverlay, setShowCreateOverlay] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((post) => {
      const authorLabel = post.isAnonymous ? "anonymous" : post.nickname.toLowerCase();
      return (
        authorLabel.includes(q) ||
        post.title.toLowerCase().includes(q) ||
        post.theme.toLowerCase().includes(q) ||
        post.topic.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q)
      );
    });
  }, [posts, searchQuery]);

  useEffect(() => {
    const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const nextPosts = snapshot.docs
          .map((docSnap) => toPost(docSnap.id, docSnap.data()))
          .filter((post): post is SocialPost => post !== null);

        setPosts(nextPosts);
        setLoading(false);
        setError(null);
      },
      () => {
        setError("Failed to load posts.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="main-content social-page">
      <h1>Social</h1>

      <div className="social-actions">
        <input
          className="social-search"
          type="search"
          placeholder="Search posts by author, theme, topic or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="button" onClick={() => setShowCreateOverlay(true)}>
          Create post
        </button>
      </div>

      {loading && <p>Loading posts...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && posts.length === 0 && <p>No posts yet.</p>}

      {!loading && !error && posts.length > 0 && filteredPosts.length === 0 && (
        <p>No posts match your search.</p>
      )}

      {!loading && !error && filteredPosts.length > 0 && (
        <div className="social-feed">
          {filteredPosts.map((post) => (
            <Post key={post.id} post={post} />
          ))}
        </div>
      )}

      <CreatePostOverlay
        isOpen={showCreateOverlay}
        onClose={() => setShowCreateOverlay(false)}
      />
    </div>
  );
};

export default Social;
