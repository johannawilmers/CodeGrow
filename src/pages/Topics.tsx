import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, DocumentReference } from "firebase/firestore";
import { db } from "../firebase";

interface Topic {
  id: string;
  name: string;
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
              resolvedTopics.push({
                id: topicSnap.id,
                name: topicSnap.data().name || "Unnamed",
              });
            }
          }
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
                <Link to={`/task`}>{topic.name}</Link>
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
