import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import "../styles/socialFeed.css";

type ThemeOption = {
  id: string;
  name: string;
  order: number;
};

type TopicOption = {
  id: string;
  name: string;
  order: number;
  themeId: string;
};

type CreatePostOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
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
    return "Permission denied. Update Firestore rules for posts.";
  }

  if (message) return `${fallback} (${message})`;
  return fallback;
};

const resolveThemeId = (value: unknown): string | null => {
  if (typeof value === "string") return value;

  if (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id?: unknown }).id === "string"
  ) {
    return (value as { id: string }).id;
  }

  return null;
};

const OTHER_THEME_ID = "__other__";
const OTHER_THEME: ThemeOption = { id: OTHER_THEME_ID, name: "Andre spørsmål", order: Number.MAX_SAFE_INTEGER };

const CreatePostOverlay = ({ isOpen, onClose, onCreated }: CreatePostOverlayProps) => {
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoadingData(true);
      setError(null);

      try {
        const [themesSnap, topicsSnap] = await Promise.all([
          getDocs(collection(db, "themes")),
          getDocs(collection(db, "topics")),
        ]);

        const nextThemes: ThemeOption[] = themesSnap.docs
          .map((docSnap) => ({
            id: docSnap.id,
            name: typeof docSnap.data().name === "string" ? docSnap.data().name : "Unnamed theme",
            order:
              typeof docSnap.data().order === "number"
                ? docSnap.data().order
                : Number.MAX_SAFE_INTEGER,
          }))
          .sort((a, b) => a.order - b.order);

        const nextTopics: TopicOption[] = topicsSnap.docs
          .map((docSnap) => {
            const data = docSnap.data();
            const themeId = resolveThemeId(data.theme);
            if (!themeId) return null;

            return {
              id: docSnap.id,
              name: typeof data.name === "string" ? data.name : "Unnamed topic",
              order: typeof data.order === "number" ? data.order : Number.MAX_SAFE_INTEGER,
              themeId,
            };
          })
          .filter((topic): topic is TopicOption => topic !== null)
          .sort((a, b) => a.order - b.order);

        const allThemes = [...nextThemes, OTHER_THEME];
        setThemes(allThemes);
        setTopics(nextTopics);

        if (allThemes.length > 0 && !selectedThemeId) {
          setSelectedThemeId(allThemes[0].id);
        }
      } catch {
        setError("Failed to load themes/topics.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isOpen]);

  const filteredTopics = useMemo(
    () => topics.filter((topic) => topic.themeId === selectedThemeId),
    [topics, selectedThemeId]
  );

  useEffect(() => {
    if (!isOpen) return;

    if (filteredTopics.length === 0) {
      setSelectedTopicId("");
      return;
    }

    const exists = filteredTopics.some((topic) => topic.id === selectedTopicId);
    if (!exists) {
      setSelectedTopicId(filteredTopics[0].id);
    }
  }, [filteredTopics, isOpen, selectedTopicId]);

  const resetAndClose = () => {
    setError(null);
    setTitle("");
    setContent("");
    setIsAnonymous(false);
    setCustomTopic("");
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const user = auth.currentUser;
    if (!user) {
      setError("You need to be signed in to post.");
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError("Post content cannot be empty.");
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Post title cannot be empty.");
      return;
    }

    const isOtherTheme = selectedThemeId === OTHER_THEME_ID;

    if (!selectedThemeId) {
      setError("Please pick a theme.");
      return;
    }

    if (isOtherTheme) {
      if (!customTopic.trim()) {
        setError("Please describe your topic.");
        return;
      }
    } else if (!selectedTopicId) {
      setError("Please pick a topic.");
      return;
    }

    const selectedTheme = themes.find((theme) => theme.id === selectedThemeId);
    const selectedTopic = isOtherTheme
      ? null
      : topics.find((topic) => topic.id === selectedTopicId);

    if (!selectedTheme) {
      setError("Invalid theme selection.");
      return;
    }

    if (!isOtherTheme && !selectedTopic) {
      setError("Invalid topic selection.");
      return;
    }

    setPosting(true);

    try {
      const userDocSnap = await getDoc(doc(db, "users", user.uid));
      const nicknameFromDoc =
        userDocSnap.exists() && typeof userDocSnap.data().nickname === "string"
          ? userDocSnap.data().nickname.trim()
          : "";
      const nickname = isAnonymous
        ? "Anonymous"
        : nicknameFromDoc || user.displayName || "Anonymous";

      const postPayload = {
        userId: user.uid,
        nickname,
        isAnonymous,
        title: trimmedTitle,
        theme: selectedTheme.name,
        topic: isOtherTheme ? customTopic.trim() : selectedTopic!.name,
        content: trimmedContent,
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
      };

      console.info("[CreatePostOverlay] Creating post", {
        userId: user.uid,
        themeId: selectedThemeId,
        topicId: selectedTopicId,
        isAnonymous,
      });

      await addDoc(collection(db, "posts"), postPayload);

      console.info("[CreatePostOverlay] Post created successfully");

      if (onCreated) onCreated();
      resetAndClose();
    } catch (err) {
      console.error("[CreatePostOverlay] Failed to create post", err);
      setError(getReadableFirestoreError(err, "Failed to create post."));
    } finally {
      setPosting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="post-overlay-backdrop" onClick={resetAndClose}>
      <div className="post-overlay-panel" onClick={(e) => e.stopPropagation()}>
        <div className="post-overlay-header">
          <h3>Opprett innlegg</h3>
          <button type="button" className="post-overlay-close" onClick={resetAndClose}>
            ✕
          </button>
        </div>

        {loadingData ? (
          <p>Laster...</p>
        ) : (
          <form className="post-form" onSubmit={handleSubmit}>
            <div className="post-form-row">
              <label htmlFor="post-title">Tittel</label>
              <input
                id="post-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Legg til en kort tittel..."
                maxLength={120}
                required
              />
            </div>

            <div className="post-form-row">
              <label htmlFor="post-theme">Emne</label>
              <select
                id="post-theme"
                value={selectedThemeId}
                onChange={(e) => setSelectedThemeId(e.target.value)}
                required
              >
                {themes.length === 0 && <option value="">Ingen emner tilgjengelig</option>}
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="post-form-row">
              <label htmlFor="post-topic">Tema</label>
              {selectedThemeId === OTHER_THEME_ID ? (
                <input
                  id="post-topic"
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Describe your topic or question..."
                  required
                />
              ) : (
                <select
                  id="post-topic"
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  required
                  disabled={filteredTopics.length === 0}
                >
                  {filteredTopics.length === 0 && (
                    <option value="">No topics for selected theme</option>
                  )}
                  {filteredTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="post-form-row">
              <label htmlFor="post-content">Innhold</label>
              <textarea
                id="post-content"
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Del din mening eller spørsmål..."
                required
              />
            </div>

            <label className="post-anonymous-toggle">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              Post anonymt
            </label>

            {error && <p className="post-form-error">{error}</p>}

            <div className="post-form-actions">
              <button type="button" className="post-cancel-btn" onClick={resetAndClose}>
                Lukk
              </button>
              <button type="submit" disabled={posting || themes.length === 0 || (selectedThemeId !== OTHER_THEME_ID && filteredTopics.length === 0)}>
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreatePostOverlay;
