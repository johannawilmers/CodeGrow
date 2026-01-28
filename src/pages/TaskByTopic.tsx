import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

interface Task {
  id: string;
  title: string;
}

const TasksByTopicPage = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const [topicName, setTopicName] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasksByTopic = async () => {
      if (!topicId) {
        setError("Topic ID not specified");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch topic document to get topic name
        const topicDocRef = doc(db, "topics", topicId);
        const topicSnap = await getDoc(topicDocRef);

        if (!topicSnap.exists()) {
          setError("Topic not found");
          setLoading(false);
          return;
        }

        const topicData = topicSnap.data();
        setTopicName(topicData.name || "Unnamed Topic");

        // Query tasks where topicId matches
        const tasksQuery = query(
          collection(db, "tasks"),
          where("topicId", "==", topicId)
        );
        const tasksSnapshot = await getDocs(tasksQuery);

        const tasksList: Task[] = [];
        tasksSnapshot.forEach((doc) => {
          const data = doc.data();
          tasksList.push({
            id: doc.id,
            title: data.title || "Untitled Task",
          });
        });

        setTasks(tasksList);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasksByTopic();
  }, [topicId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="main-content">
      <h1>Tasks for Topic: {topicName}</h1>

      {tasks.length === 0 ? (
        <p>No tasks found for this topic.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <Link to={`/task/${task.id}`}>{task.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TasksByTopicPage;
