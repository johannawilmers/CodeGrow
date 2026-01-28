import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, DocumentReference } from "firebase/firestore";
import { db } from "../firebase";

interface Topic {
  id: string;
  name: string;
  taskId: string;
  order: number; 
}

const Topics = () => {
  const { id } = useParams<{ id: string }>();
  const [themeName, setThemeName] = useState<string>("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const docRef = doc(db, "themes", id!);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setThemeName(docSnap.data().name || "Unnamed");
          const topicRefs = docSnap.data().topics || [];

          const resolvedTopics: Topic[] = [];
          for (const topicRef of topicRefs) {
            const topicSnap = await getDoc(topicRef as DocumentReference);
            if (topicSnap.exists()) {
              const topicData = topicSnap.data();
              let taskId = topicSnap.id; 
              if (topicData.task) {
                if (typeof topicData.task === 'string' && topicData.task.startsWith('/tasks/')) {
                  taskId = topicData.task.split('/')[2];
                } else if (typeof topicData.task === 'object' && 'id' in topicData.task) {
                  taskId = topicData.task.id;
                }
              } else if (topicData.taskId) {
                taskId = topicData.taskId;
              }

              resolvedTopics.push({
                id: topicSnap.id,
                name: topicData.name || "Unnamed",
                taskId: taskId,
                order: typeof topicData.order === 'number' ? topicData.order : 999,
              });
            }
          }
          resolvedTopics.sort((a, b) => a.order - b.order);
          setTopics(resolvedTopics);
        } else {
          setError("Theme not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch theme");
      } finally {
        setLoading(false);
      }
    };

    fetchTheme();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <>
    <div className="main-content">
    <h1>{themeName}</h1>
      <div className="topics-collection">
        <h2>Topics</h2>
        {topics.length === 0 ? (
          <p>No topics found</p>
        ) : (
          <ul>
            {topics.map((topic) => (
              <li key={topic.id}>
                <Link to={`/task/${topic.taskId}`}>{topic.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
    
      
    </>
  );
};

export default Topics;
