import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

type Theme = {
  id: string;
  name: string;
  order: number;
};

const ThemeTopicManager = () => {
  const [themes, setThemes] = useState<Theme[]>([]);

  const [themeName, setThemeName] = useState("");
  const [themeOrder, setThemeOrder] = useState<number>(1);

  const [topicName, setTopicName] = useState("");
  const [topicOrder, setTopicOrder] = useState<number>(1);
  const [selectedThemeId, setSelectedThemeId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      const q = query(collection(db, "themes"), orderBy("order", "asc"));
      const snap = await getDocs(q);

      setThemes(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          order: d.data().order ?? 0,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch themes", err);
      setError("Failed to fetch themes");
    }
  };

  const createTheme = async () => {
    if (!themeName.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await addDoc(collection(db, "themes"), {
        name: themeName.trim(),
        order: themeOrder,
        topics: [], // initialize as empty array of references
      });

      setThemeName("");
      setThemeOrder(1);
      setSuccess("Theme created");

      // Refresh themes to update list
      fetchThemes();
    } catch (err) {
      console.error("Failed to create theme", err);
      setError("Failed to create theme");
    } finally {
      setLoading(false);
    }
  };

  const createTopic = async () => {
    if (!topicName.trim() || !selectedThemeId) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const themeRef = doc(db, "themes", selectedThemeId);

      // Create new topic with a reference to the theme
      const topicRef = await addDoc(collection(db, "topics"), {
        name: topicName.trim(),
        order: topicOrder,
        theme: themeRef,
      });

      // Update the theme document's topics array to include this new topic reference
      await updateDoc(themeRef, {
        topics: arrayUnion(topicRef),
      });

      setTopicName("");
      setTopicOrder(1);
      setSelectedThemeId("");
      setSuccess("Topic created");
    } catch (err) {
      console.error("Failed to create topic", err);
      setError("Failed to create topic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <h1>Theme & Topic Manager</h1>

      {/* -------- Create Theme -------- */}
      <section className="admin-card">
        <h2>Create Theme</h2>

        <input
          type="text"
          placeholder="Theme name"
          value={themeName}
          onChange={(e) => {
            setThemeName(e.target.value);
            setError(null);
            setSuccess(null);
          }}
        />

        <input
          type="number"
          min={1}
          placeholder="Order"
          value={themeOrder}
          onChange={(e) => {
            setThemeOrder(Number(e.target.value));
            setError(null);
            setSuccess(null);
          }}
        />

        <button onClick={createTheme} disabled={loading}>
          Create Theme
        </button>
      </section>

      {/* -------- Create Topic -------- */}
      <section className="admin-card">
        <h2>Create Topic</h2>

        <input
          type="text"
          placeholder="Topic name"
          value={topicName}
          onChange={(e) => {
            setTopicName(e.target.value);
            setError(null);
            setSuccess(null);
          }}
        />

        <input
          type="number"
          min={1}
          placeholder="Order"
          value={topicOrder}
          onChange={(e) => {
            setTopicOrder(Number(e.target.value));
            setError(null);
            setSuccess(null);
          }}
        />

        <select
          value={selectedThemeId}
          onChange={(e) => {
            setSelectedThemeId(e.target.value);
            setError(null);
            setSuccess(null);
          }}
        >
          <option value="">Select theme</option>
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.order}. {t.name}
            </option>
          ))}
        </select>

        <button onClick={createTopic} disabled={loading}>
          Create Topic
        </button>
      </section>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
};

export default ThemeTopicManager;
