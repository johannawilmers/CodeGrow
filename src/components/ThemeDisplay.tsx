import { useEffect, useState } from "react";
import { collection, getDocs} from "firebase/firestore";
import { db, auth } from "../firebase";
import { logUserClick } from "../utils/clickLogger";
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
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    
    const fetchData = async () => {
      try {
        setLoading(true);

        const [themesSnap, topicsSnap] = await Promise.all([
          getDocs(collection(db, "themes")),
          getDocs(collection(db, "topics")),
        ]);

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

        topicsSnap.forEach((doc) => {
          const data = doc.data();
          const themeId =
            typeof data.theme === "string"
              ? data.theme
              : data.theme?.id;

          if (!themeId || !themesMap[themeId]) return;

          themesMap[themeId].topics.push({
            id: doc.id,
            name: data.name ?? "Unnamed topic",
            order: typeof data.order === "number" ? data.order : 999,
            theme: themeId,
          });
        });

        Object.values(themesMap).forEach((theme) =>
          theme.topics.sort((a, b) => a.order - b.order)
        );

        const sortedThemes = Object.values(themesMap).sort(
          (a, b) => a.order - b.order
        );

        setThemes(sortedThemes);

        const user = auth.currentUser;
        if (!user) return;

        const userTopicsSnap = await getDocs(
          collection(db, "users", user.uid, "topics")
        );

        const completedSet = new Set<string>();
        userTopicsSnap.forEach((doc) => {
          if (doc.data().completed === true) {
            completedSet.add(doc.id);
          }
        });

        setCompletedTopics(completedSet);
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

  // themes that should show their topics as coming soon (1-based)
  const comingSoonThemeNumbers = new Set([14,15, 16]);

  return (
    <div >
      {themes.length === 0 && <p>No themes found</p>}

      {/* OOP THEMES */}
      {themes.length > 0 && (
        <div className="themes-collection">
          <h1>Objekt-orientert programmering</h1>

          {themes.slice(0, 4).map((theme, idx) => {
            const themeDisplayNumber = idx + 1; // reset within block
            const themeGlobalIndex = idx + 1; // global counting for badge
            const isThemeComing = comingSoonThemeNumbers.has(themeGlobalIndex);
            return (
              <div key={theme.id} className="theme-block">
                <h2>{themeDisplayNumber}. {theme.name}</h2>

                {theme.topics.length === 0 ? (
                  <p className="empty-topics">No topics available</p>
                ) : (
                  <ul className="topic-list">
                    {theme.topics.map((topic) => (
                      <li
                        key={topic.id}
                        className={
                          completedTopics.has(topic.id)
                            ? "topic-completed"
                            : "topic-pending"
                        }
                      >
                        <Link
                          to={`/topic/${topic.id}/tasks`}
                          className="topic-link"
                          onClick={() => {
                            logUserClick(auth.currentUser?.uid, {
                              type: "topic_click",
                              target: topic.id,
                              metadata: { name: topic.name },
                            });
                          }}
                          style={{ display: "block", width: "100%" }}
                        >
                          {topic.name}
                          {isThemeComing && (
                            <span className="coming-soon-badge">Coming soon</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {themes.length > 4 && (
        <div className="themes-collection">
          <h1>Java-teknikker</h1>

          {themes.slice(4).map((theme, idx) => {
            const themeDisplayNumber = idx + 1; // reset numbering for second block
            const themeGlobalIndex = 4 + idx + 1; // original global index for badge
            const isThemeComing = comingSoonThemeNumbers.has(themeGlobalIndex);
            return (
              <div key={theme.id} className="theme-block">
                <h2>{themeDisplayNumber}. {theme.name}</h2>

                {theme.topics.length === 0 ? (
                  <p className="empty-topics">No topics available</p>
                ) : (
                  <ul className="topic-list">
                    {theme.topics.map((topic) => (
                      <li
                        key={topic.id}
                        className={
                          completedTopics.has(topic.id)
                            ? "topic-completed"
                            : "topic-pending"
                        }
                      >
                        <Link
                          to={`/topic/${topic.id}/tasks`}
                          className="topic-link"
                          onClick={() =>
                            logUserClick(auth.currentUser?.uid, {
                              type: "topic_click",
                              target: topic.id,
                              metadata: { name: topic.name },
                            })
                          }
                          style={{ display: "block", width: "100%" }}
                        >
                          {topic.name}
                          {isThemeComing && (
                            <span className="coming-soon-badge">Coming soon</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemesOverview;