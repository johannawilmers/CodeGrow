import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import "../styles/taskByTopic.css";


interface Task {
  id: string;
  title: string;
}

const TasksByTopicPage = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const [topicName, setTopicName] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
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

        // Fetch completed tasks for the user
        const user = auth.currentUser;
        if (user) {
          // Query user tasks that are completed and belong to these task IDs
          // Since we know tasksList, we can get all user tasks for those IDs

          // Firestore does not support 'in' queries with more than 10 elements
          // So chunk task IDs if needed
          const chunks: string[][] = [];
          const chunkSize = 10;
          for (let i = 0; i < tasksList.length; i += chunkSize) {
            chunks.push(tasksList.slice(i, i + chunkSize).map(t => t.id));
          }

          const completedIdsSet = new Set<string>();

          for (const chunk of chunks) {
            const userTasksQuery = query(
              collection(db, "users", user.uid, "tasks"),
              where("__name__", "in", chunk),
              where("completed", "==", true)
            );
            const userTasksSnapshot = await getDocs(userTasksQuery);
            userTasksSnapshot.forEach(doc => {
              completedIdsSet.add(doc.id);
            });
          }

          setCompletedTaskIds(completedIdsSet);
        }

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
      <h1>{topicName}</h1>

      {tasks.length === 0 ? (
        <p>No tasks found for this topic.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id} className={completedTaskIds.has(task.id) ? "completed-task" : ""}>
              <Link to={`/task/${task.id}`}>{task.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TasksByTopicPage;
