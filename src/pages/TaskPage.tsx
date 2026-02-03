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

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);

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
        completedTasksCount: completedTasksCount + 1,
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
     Reset states & Fetch task + completion + saved code on taskId change
     ========================= */
  useEffect(() => {
    setSuccess(false);
    setCompleted(false);
    setOutput("");
    setError(null);
    setPageError(null);

    const fetchTask = async () => {
      if (!taskId) return;

      try {
        setPageLoading(true);

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

        setTopicId(task.topicId || null);

        // Get starter code from task
        const starterCode = (task.starterCode || `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, Codegrow!");
  }
}`)
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'");

        const user = auth.currentUser;
        if (!user) {
          // No user: just show starter code
          setCode(starterCode);
          return;
        }

        // Fetch user task doc to check completion and saved code
        const userTaskRef = doc(db, "users", user.uid, "tasks", taskId);
        const userTaskSnap = await getDoc(userTaskRef);

        let savedCode = starterCode;
        let isCompleted = false;

        if (userTaskSnap.exists()) {
          const userTaskData = userTaskSnap.data();
          isCompleted = userTaskData.completed === true;

          // If user saved code exists, load it, else starter code
          if (typeof userTaskData.code === "string" && userTaskData.code.trim() !== "") {
            savedCode = userTaskData.code;
          }
        }

        setCode(savedCode);
        setCompleted(isCompleted);
        if (isCompleted) setSuccess(true);
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
     Fetch all tasks in topic for navigation
     ========================= */
  useEffect(() => {
    const fetchTasksInTopic = async () => {
      if (!topicId) return;

      try {
        const q = query(
          collection(db, "tasks"),
          where("topicId", "==", topicId),
          orderBy("createdAt", "asc")
        );

        const snap = await getDocs(q);
        const ids = snap.docs.map((doc) => doc.id);
        setTaskIdsInTopic(ids);
      } catch (err) {
        console.error("Failed to fetch tasks for navigation", err);
      }
    };

    fetchTasksInTopic();
  }, [topicId]);

  /* =========================
     Navigation helpers
     ========================= */
  const currentIndex = taskIdsInTopic.indexOf(taskId || "");

  const goToPrevious = () => {
    if (currentIndex <= 0) {
      if (topicId) {
        navigate(`/topic/${topicId}/tasks`);
      } else {
        navigate(`/`);
      }
    } else {
      navigate(`/task/${taskIdsInTopic[currentIndex - 1]}`);
    }
  };

  const goToNext = () => {
    if (currentIndex === -1 || currentIndex >= taskIdsInTopic.length - 1) {
      if (topicId) {
        navigate(`/topic/${topicId}/tasks`);
      } else {
        navigate(`/`);
      }
    } else {
      navigate(`/task/${taskIdsInTopic[currentIndex + 1]}`);
    }
  };

  /* =========================
     Run & validate code and save user input
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

    if (!taskId) return;

    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to run the task.");
      return;
    }

    const isCorrect = trimmedOutput === expectedOutput.trim();

    const userTaskRef = doc(db, "users", user.uid, "tasks", taskId);
    const userTaskSnap = await getDoc(userTaskRef);

    const wasCompletedBefore =
      userTaskSnap.exists() && userTaskSnap.data()?.completed === true;

    // ✅ ALWAYS save code + completion state
    await setDoc(
      userTaskRef,
      {
        code: code,
        completed: isCorrect,
        lastRunAt: serverTimestamp(),
        ...(isCorrect ? { completedAt: serverTimestamp() } : {}),
      },
      { merge: true }
    );

    if (isCorrect) {
      if (!wasCompletedBefore) {
        await updateUserProgress(user.uid);
      }

      setCompleted(true);
      setSuccess(true);
    } else {
      setCompleted(false);
      setError("Output does not match expected output. Try again.");
    }
  } catch (err) {
    console.error(err);
    setError("Something went wrong while running the code.");
  } finally {
    setLoading(false);
  }
};

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
      {topicId && (
        <button onClick={() => navigate(`/topic/${topicId}/tasks`)} >
          ← Back to Tasks
        </button>
      )}

      <h1>{taskName}</h1>

      {taskDescription && (
        <p >{taskDescription}</p>
      )}

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

      {error && <p >{error}</p>}
      {success && <p >🎉 Task completed successfully!</p>}

      <pre>{output}</pre>

      {/* Navigation buttons and task position */}
      <div
      
      >
        <button
          onClick={goToPrevious}
          disabled={loading || pageLoading}
        
          aria-label="Go to previous task"
        >
          ← Previous
        </button>

        <span >
          Task {currentIndex + 1} of {taskIdsInTopic.length}
        </span>

        <button
          onClick={goToNext}
          disabled={loading || pageLoading}
         
          aria-label="Go to next task"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default TaskPage;
