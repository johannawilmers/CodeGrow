import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import Post, { type SocialPost } from "../components/Post.tsx";
import CreatePostOverlay from "../components/CreatePostOverlay.tsx";
import NicknamePopup from "../components/NicknamePopup.tsx";
import { auth, db } from "../firebase.ts";
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
  const title = typeof data.title === "string" ? data.title : "";
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

const Forum = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateOverlay, setShowCreateOverlay] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [nickname, setNickname] = useState("");
  const [showNicknamePopup, setShowNicknamePopup] = useState(false);

  const currentUser = auth.currentUser;

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((post) => {
      const authorLabel = post.isAnonymous ? "anonymous" : post.nickname.toLowerCase();
      return (
        authorLabel.includes(q) ||
        post.theme.toLowerCase().includes(q) ||
        post.topic.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q)
      );
    });
  }, [posts, searchQuery]);

  useEffect(() => {
    const loadNickname = async () => {
      if (!currentUser) {
        setNickname("");
        setShowNicknamePopup(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const storedNickname =
          userDoc.exists() && typeof userDoc.data().nickname === "string"
            ? userDoc.data().nickname.trim()
            : "";

        setNickname(storedNickname);
        setShowNicknamePopup(!storedNickname);
      } catch {
        setNickname("");
        setShowNicknamePopup(true);
      }
    };

    loadNickname();
  }, [currentUser]);

  const handleSaveNickname = async (nextNickname: string) => {
    const user = auth.currentUser;
    if (!user) return;

    await setDoc(
      doc(db, "users", user.uid),
      {
        nickname: nextNickname,
        nicknameUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await user.updateProfile({ displayName: nextNickname });

    setNickname(nextNickname);
    setShowNicknamePopup(false);
  };

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
      <h1>Forum</h1>

      {nickname && <p>Nickname: <strong>{nickname}</strong></p>}

      <div className="social-actions">
        <input
          className="social-search"
          type="search"
          placeholder="Søk etter tema, emne eller innhold..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="button" onClick={() => setShowCreateOverlay(true)}>
          Opprett innlegg
        </button>
      </div>

      {loading && <p>Laster innlegg...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && posts.length === 0 && <p>Ingen innlegg enda.</p>}

      {!loading && !error && posts.length > 0 && filteredPosts.length === 0 && (
        <p>Ingen innlegg matcher søket ditt.</p>
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

      <NicknamePopup
        isOpen={showNicknamePopup}
        title="Sett kallenavn"
        description="Sett et kallenavn før du bruker forumet. Du kan endre det senere på Min profil."
        submitLabel="Lagre kallenavn"
        allowClose={false}
        onSubmit={handleSaveNickname}
      />
    </div>
  );
};

export default Forum;
