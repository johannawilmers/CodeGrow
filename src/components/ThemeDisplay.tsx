import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

interface Topic {
  id: string;
  name: string;
  order: number;
  theme: string;
}

interface Theme {
  id: string;
  name: string;
  order: number;
  topics: Topic[];
}

const ThemesOverview = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 🚀 Fetch both collections in parallel
        const [themesSnap, topicsSnap] = await Promise.all([
          getDocs(collection(db, "themes")),
          getDocs(collection(db, "topics")),
        ]);

        // Parse themes
        const themesMap: Record<string, Theme> = {};
        themesSnap.forEach((doc) => {
          const data = doc.data();
          themesMap[doc.id] = {
            id: doc.id,
            name: data.name ?? "Unnamed theme",
            order: typeof data.order === "number" ? data.order : 999,
            topics: [],
          };
        });

        // Parse topics & attach to themes
        topicsSnap.forEach((doc) => {
  const data = doc.data();

  let theme: string | undefined;
  if (typeof data.theme === "string") {
    theme = data.theme;
  } else if (data.theme?.id) {
    theme = data.theme.id;
  } else {
    theme = undefined;
  }

  console.log("Topic:", doc.id, "theme:", theme);
  console.log("ThemesMap keys:", Object.keys(themesMap));

  if (!theme || !themesMap[theme]) return;

  themesMap[theme].topics.push({
    id: doc.id,
    name: data.name ?? "Unnamed topic",
    order: typeof data.order === "number" ? data.order : 999,
    theme,
  });
});


        // Sort topics inside each theme
        Object.values(themesMap).forEach((theme) => {
          theme.topics.sort((a, b) => a.order - b.order);
        });

        // Sort themes
        const sortedThemes = Object.values(themesMap).sort(
          (a, b) => a.order - b.order
        );

        setThemes(sortedThemes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading themes…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="themes-collection">
      <h1>Themes & Topics</h1>

      {themes.length === 0 && <p>No themes found</p>}

      {themes.map((theme) => (
        <div key={theme.id} className="theme-block">
          <h2>{theme.name}</h2>

          {theme.topics.length === 0 ? (
            <p className="empty-topics">No topics available</p>
          ) : (
            <ul className="topic-list">
              {theme.topics.map((topic) => (
                <li key={topic.id}>
                  <Link to={`/topic/${topic.id}/tasks`}>
                    {topic.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export default ThemesOverview;
