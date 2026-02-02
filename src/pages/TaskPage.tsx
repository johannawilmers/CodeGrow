import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
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

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let conpletedTasksCount = 0;
    let currentStreak = 0;
    let lastCompletedDate: Date | null = null;

    if (userSnap.exists()) {
      const data = userSnap.data();
      conpletedTasksCount = data.conpletedTasksCount || 0;
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
            (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null;

    let newStreak = currentStreak;

    if (diffDays === null) {
      newStreak = 1; // first ever task
    } else if (diffDays === 0) {
      newStreak = currentStreak; // same day
    } else if (diffDays === 1) {
      newStreak = currentStreak + 1; // consecutive day
    } else {
      newStreak = 1; // missed days
    }

    transaction.set(
      userRef,
      {
        lastCompletedDate: Timestamp.fromDate(today),
        conpletedTasksCount: conpletedTasksCount + 1,
        currentStreak: newStreak,
      },
      { merge: true }
    );
  });
};

/* =========================
   Component
   ========================= */
const TaskPage = () => {
  const { taskId } = useParams<{ taskId: string }>();

  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [completed, setCompleted] = useState(false);

  /* =========================
     Fetch task + completion
     ========================= */
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;

      try {
        setPageLoading(true);
        setPageError(null);

        const taskRef = doc(db, "tasks", taskId);
        const taskSnap = await getDoc(taskRef);

        if (!taskSnap.exists()) {
          setPageError("Task not found");
          return;
        }

        const task = taskSnap.data();

        setTaskName(task.title || task.name || "Unnamed Task");
        setTaskDescription(task.description || "");
        setExpectedOutput(task.expectedOutput || "");

        const starterCode = (task.starterCode || `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, Codegrow!");
  }
}`)
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'");

        setCode(starterCode);

        const user = auth.currentUser;
        if (user) {
          const userTaskRef = doc(db, "users", user.uid, "tasks", taskId);
          const userTaskSnap = await getDoc(userTaskRef);

          const isCompleted =
            userTaskSnap.exists() &&
            userTaskSnap.data()?.completed === true;

          setCompleted(isCompleted);
          if (isCompleted) setSuccess(true);
        }
      } catch (err) {
        console.error(err);
        setPageError("Failed to load task");
      } finally {
        setPageLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  /* =========================
     Run & validate code
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

      if (!res.ok) throw new Error("Failed to run code");

      const data = await res.json();
      const trimmedOutput = (data.output ?? "").trim();
      setOutput(trimmedOutput);

      if (trimmedOutput !== expectedOutput.trim() || !taskId) {
        setError("Output does not match expected output. Try again.");
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setError("You must be logged in to complete the task.");
        return;
      }

      const userTaskRef = doc(db, "users", user.uid, "tasks", taskId);
      const userTaskSnap = await getDoc(userTaskRef);

      if (!userTaskSnap.exists() || userTaskSnap.data()?.completed !== true) {
        await setDoc(
          userTaskRef,
          {
            completed: true,
            completedAt: serverTimestamp(),
          },
          { merge: true }
        );

        await updateUserProgress(user.uid);
      }

      setCompleted(true);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while running the code.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Render
     ========================= */
  if (pageLoading) {
    return (
      <div className="main-content">
        <p>Loading...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="main-content">
        <p>Error: {pageError}</p>
      </div>
    );
  }

  return (
    <div className="main-content">
      <h1>{taskName}</h1>

      {taskDescription && (
        <p style={{ marginBottom: 20, fontSize: 16 }}>{taskDescription}</p>
      )}

      <h2>Java Code</h2>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={12}
        style={{ width: "100%", fontFamily: "monospace" }}
        disabled={completed}
      />

      <button onClick={runCode} disabled={loading || completed}>
        {loading ? "Running..." : completed ? "Task Completed" : "Run Code"}
      </button>

      <h3>Output</h3>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && (
        <p style={{ color: "green" }}>🎉 Task completed successfully!</p>
      )}

      <pre>{output}</pre>
    </div>
  );
};

export default TaskPage;
