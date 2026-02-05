import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "firebase/firestore";
import { db, auth } from "../firebase";
import "../styles/taskByTopic.css";

interface Task {
  id: string;
  title: string;
}

const TasksByTopicPage = () => {
  const navigate = useNavigate();
  const { topicId } = useParams<{ topicId: string }>();

  const [topicName, setTopicName] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!topicId) return;

      try {
        setLoading(true);

        /* -------- Topic -------- */
        const topicSnap = await getDoc(doc(db, "topics", topicId));
        if (!topicSnap.exists()) {
          setError("Topic not found");
          return;
        }
        setTopicName(topicSnap.data().name || "Unnamed Topic");

        /* -------- Tasks for topic -------- */
        const tasksQuery = query(
          collection(db, "tasks"),
          where("topicId", "==", topicId),
          orderBy("createdAt", "asc")
        );

        const tasksSnap = await getDocs(tasksQuery);
        const tasksList: Task[] = tasksSnap.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || "Untitled Task"
        }));

        setTasks(tasksList);

        /* -------- User completed tasks -------- */
        const user = auth.currentUser;
        if (!user) return;

        const userTasksSnap = await getDocs(
          collection(db, "users", user.uid, "tasks")
        );

        const completedSet = new Set<string>();

        userTasksSnap.forEach(doc => {
          const data = doc.data();
          if (data.completed === true) {
            completedSet.add(doc.id); // 👈 taskId
          }
        });

        setCompletedTaskIds(completedSet);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [topicId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="main-content" id="taskByTopic">
      <button onClick={() => navigate("/")}>← Back</button>

      <h1>{topicName}</h1>

      {tasks.length === 0 ? (
        <p>No tasks found.</p>
      ) : (
        <ul>
          {tasks.map(task => (
            <li
              key={task.id}
              className={completedTaskIds.has(task.id) ? "completed-task" : ""}
            >
              <Link to={`/task/${task.id}`}>{task.title}</Link>
            </li>

          ))}
        </ul>
      )}
    </div>
  );
};

export default TasksByTopicPage;
