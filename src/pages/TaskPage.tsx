import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import "../styles/taskPage.css";

const RUN_JAVA_URL =
  "https://us-central1-codegrow-5894a.cloudfunctions.net/runJava";

/* =========================
   Helper: update user stats
========================= */
const updateUserProgress = async (uid: string) => {
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let completedTasksCount = 0;
    let currentStreak = 0;
    let lastCompletedDate: Date | null = null;

    if (userSnap.exists()) {
      const data = userSnap.data();
      completedTasksCount = data.completedTasksCount || 0;
      currentStreak = data.currentStreak || 0;

      if (data.lastCompletedDate) {
        lastCompletedDate = data.lastCompletedDate.toDate();
      }
    }

    const lastDate = lastCompletedDate
      ? new Date(
          lastCompletedDate.getFullYear(),
          lastCompletedDate.getMonth(),
          lastCompletedDate.getDate()
        )
      : null;

    const diffDays =
      lastDate !== null
        ? Math.floor(
            (today.getTime() - lastDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

    let newStreak = currentStreak;

    if (diffDays === null) newStreak = 1;
    else if (diffDays === 0) newStreak = currentStreak;
    else if (diffDays === 1) newStreak = currentStreak + 1;
    else newStreak = 1;

    tx.set(
      userRef,
      {
        lastCompletedDate: Timestamp.fromDate(today),
        completedTasksCount: completedTasksCount + 1,
        currentStreak: newStreak,
      },
      { merge: true }
    );
  });
};

/* =========================
   Helper: mark topic completed
   ONLY if all tasks are done
========================= */
const markTopicCompletedIfAllTasksDone = async (
  userId: string,
  topicId: string
) => {
  // All tasks in topic
  const tasksQuery = query(
    collection(db, "tasks"),
    where("topicId", "==", topicId)
  );

  const tasksSnap = await getDocs(tasksQuery);
  const taskIds = tasksSnap.docs.map((d) => d.id);

  if (taskIds.length === 0) return;

  // User completed tasks
  const userTasksSnap = await getDocs(
    collection(db, "users", userId, "tasks")
  );

  const completedTaskIds = new Set<string>();
  userTasksSnap.forEach((doc) => {
    if (doc.data().completed === true) {
      completedTaskIds.add(doc.id);
    }
  });

  // Check if ALL tasks are completed
  const allCompleted = taskIds.every((id) =>
    completedTaskIds.has(id)
  );

  if (!allCompleted) return;

  // Mark topic completed
  const userTopicRef = doc(db, "users", userId, "topics", topicId);
  await setDoc(
    userTopicRef,
    {
      completed: true,
      completedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/* =========================
   Component
========================= */
const TaskPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");

  const [topicId, setTopicId] = useState<string | null>(null);
  const [taskIdsInTopic, setTaskIdsInTopic] = useState<string[]>([]);

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [completed, setCompleted] = useState(false);

  /* =========================
     Fetch task
  ========================= */
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;

      try {
        setPageLoading(true);

        const taskSnap = await getDoc(doc(db, "tasks", taskId));
        if (!taskSnap.exists()) {
          setPageError("Task not found");
          return;
        }

        const task = taskSnap.data();
        setTaskName(task.title || "Unnamed Task");
        setTaskDescription(task.description || "");
        setExpectedOutput(task.expectedOutput || "");
        setTopicId(task.topicId || null);

        const starterCode = (task.starterCode || "").replace(/\\n/g, "\n");

        const user = auth.currentUser;
        if (!user) {
          setCode(starterCode);
          return;
        }

        const userTaskSnap = await getDoc(
          doc(db, "users", user.uid, "tasks", taskId)
        );

        if (userTaskSnap.exists()) {
          const data = userTaskSnap.data();
          setCode(data.code || starterCode);
          setCompleted(data.completed === true);
          setSuccess(data.completed === true);
        } else {
          setCode(starterCode);
        }
      } catch {
        setPageError("Failed to load task");
      } finally {
        setPageLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  /* =========================
     Fetch task order in topic
  ========================= */
  useEffect(() => {
    if (!topicId) return;

    const fetchTasks = async () => {
      const q = query(
        collection(db, "tasks"),
        where("topicId", "==", topicId),
        orderBy("createdAt", "asc")
      );

      const snap = await getDocs(q);
      setTaskIdsInTopic(snap.docs.map((d) => d.id));
    };

    fetchTasks();
  }, [topicId]);

  /* =========================
     Run code
  ========================= */
  const runCode = async () => {
    setLoading(true);
    setError(null);
    setOutput("");
    setSuccess(false);

    try {
      const res = await fetch(RUN_JAVA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      const trimmedOutput = (data.output || "").trim();
      setOutput(trimmedOutput);

      if (!taskId) return;

      const user = auth.currentUser;
      if (!user) return;

      const isCorrect = trimmedOutput === expectedOutput.trim();
      const userTaskRef = doc(db, "users", user.uid, "tasks", taskId);
      const snap = await getDoc(userTaskRef);
      const wasCompleted = snap.exists() && snap.data()?.completed === true;

      await setDoc(
        userTaskRef,
        {
          code,
          completed: isCorrect,
          lastRunAt: serverTimestamp(),
          ...(isCorrect ? { completedAt: serverTimestamp() } : {}),
        },
        { merge: true }
      );

      if (isCorrect && !wasCompleted) {
        await updateUserProgress(user.uid);

        if (topicId) {
          await markTopicCompletedIfAllTasksDone(user.uid, topicId);
        }
      }

      setCompleted(isCorrect);
      setSuccess(isCorrect);
      if (!isCorrect) setError("Output does not match expected output.");
    } catch {
      setError("Something went wrong while running the code.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Navigation helpers
  ========================= */
  const currentIndex = taskIdsInTopic.indexOf(taskId || "");

  const goToPrevious = () => {
    if (currentIndex <= 0) {
      topicId ? navigate(`/topic/${topicId}/tasks`) : navigate("/");
    } else {
      navigate(`/task/${taskIdsInTopic[currentIndex - 1]}`);
    }
  };

  const goToNext = () => {
    if (currentIndex === -1 || currentIndex >= taskIdsInTopic.length - 1) {
      topicId ? navigate(`/topic/${topicId}/tasks`) : navigate("/");
    } else {
      navigate(`/task/${taskIdsInTopic[currentIndex + 1]}`);
    }
  };

  if (pageLoading) return <p>Loading...</p>;
  if (pageError) return <p>Error: {pageError}</p>;

  return (
    <div  id="taskContent">
      {topicId && (
        <button onClick={() => navigate(`/topic/${topicId}/tasks`)}>
          ← Back to Tasks
        </button>
      )}

      <h1>{taskName}</h1>
      {taskDescription && <p>{taskDescription}</p>}

      <h2>Java Code</h2>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={12}
        disabled={completed}
      />

      <button onClick={runCode} disabled={loading || completed}>
        {loading ? "Running..." : completed ? "Task Completed" : "Run Code"}
      </button>

      <h3>Output</h3>
      <pre>{output}</pre>
      {error && <p>{error}</p>}
      {success && <p>🎉 Task completed successfully!</p>}

      <div style={{ marginTop: "1rem" }}>
        <button onClick={goToPrevious}>← Previous</button>
        <span style={{ margin: "0 1rem" }}>
          Task {currentIndex + 1} of {taskIdsInTopic.length}
        </span>
        <button onClick={goToNext}>Next →</button>
      </div>
    </div>
  );
};

export default TaskPage;
