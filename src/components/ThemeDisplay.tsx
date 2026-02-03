import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, DocumentReference } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

interface Topic {
  id: string;
  name: string;
  taskId: string;
  order: number;
}

interface Theme {
  id: string;
  name: string;
  order: number;
  topics: Topic[];
}

const CombinedThemesAndTopics = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThemesAndTopics = async () => {
      try {
        const themesSnapshot = await getDocs(collection(db, "themes"));
        const themesData: Theme[] = [];

        for (const themeDoc of themesSnapshot.docs) {
          const themeData = themeDoc.data();
          const themeId = themeDoc.id;
          const themeName = themeData.name || "Unnamed Theme";
          const themeOrder = themeData.order || 999;
          const topicRefs: DocumentReference[] = themeData.topics || [];

          const resolvedTopics: Topic[] = [];
          for (const topicRef of topicRefs) {
            let topicSnap;
            if (typeof topicRef === "string") {
              topicSnap = await getDoc(doc(db, "topics", topicRef));
            } else {
              topicSnap = await getDoc(topicRef);
            }

            if (topicSnap.exists()) {
              const topicData = topicSnap.data();

              let taskId = "";
              if (topicData.task) {
                if (typeof topicData.task === "string" && topicData.task.startsWith("/tasks/")) {
                  taskId = topicData.task.split("/")[2];
                } else if (typeof topicData.task === "object" && "id" in topicData.task) {
                  taskId = topicData.task.id;
                }
              } else if (topicData.taskId) {
                taskId = topicData.taskId;
              } else {
                taskId = topicSnap.id;
              }

              resolvedTopics.push({
                id: topicSnap.id,
                name: topicData.name || "Unnamed Topic",
                taskId,
                order: typeof topicData.order === "number" ? topicData.order : 999,
              });
            }
          }

          resolvedTopics.sort((a, b) => a.order - b.order);

          themesData.push({
            id: themeId,
            name: themeName,
            order: themeOrder,
            topics: resolvedTopics,
          });
        }

        themesData.sort((a, b) => a.order - b.order);
        setThemes(themesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchThemesAndTopics();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="themes-collection">
      <h1>Themes & Topics</h1>
      {themes.length === 0 ? (
        <p>No themes found</p>
      ) : (
        themes.map((theme) => (
          <div key={theme.id}>
            <h2>{theme.name}</h2>
            {theme.topics.length === 0 ? (
              <p >No topics available</p>
            ) : (
              <ul>
                {theme.topics.map((topic) => (
                  <li key={topic.id}>
                    <Link to={`/topic/${topic.id}/tasks`}>{topic.name}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default CombinedThemesAndTopics;
