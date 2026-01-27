import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const RUN_JAVA_URL =
  "https://us-central1-codegrow-5894a.cloudfunctions.net/runJava";

const TaskPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [taskName, setTaskName] = useState<string>("");
  const [taskDescription, setTaskDescription] = useState<string>("");
  const [expectedOutput, setExpectedOutput] = useState<string>("");
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Java compiler state
  const [code, setCode] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;

      try {
        setPageLoading(true);
        setPageError(null);

        // Fetch the task from the tasks collection
        const taskDocRef = doc(db, "tasks", taskId);
        const taskSnap = await getDoc(taskDocRef);

        if (!taskSnap.exists()) {
          setPageError("Task not found");
          return;
        }

        const taskInfo = taskSnap.data();
        setTaskName(taskInfo.title || taskInfo.name || "Unnamed Task");
        setTaskDescription(taskInfo.description || "");
        setExpectedOutput(taskInfo.expectedOutput || "");
        
        // Unescape the starter code to convert \n and \" to actual characters
        const unescapedCode = (taskInfo.starterCode || `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, Codegrow!");
  }
}`).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\'/g, "'");
        
        setCode(unescapedCode);

      } catch (err) {
        console.error("Error fetching task:", err);
        setPageError(err instanceof Error ? err.message : "Failed to fetch task");
      } finally {
        setPageLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const runCode = async () => {
    setLoading(true);
    setError(null);
    setOutput("");

    try {
      const res = await fetch(RUN_JAVA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        throw new Error("Failed to run code");
      }

      const data = await res.json();
      setOutput(data.output ?? "");

      // Check if output matches expected output
      if (expectedOutput && data.output?.includes(expectedOutput) && taskId) {
        // TODO: Add user authentication to save completion status
        console.log("Task completed successfully!");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong while running the code.");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <div className="main-content"><p>Loading...</p></div>;
  if (pageError) return <div className="main-content"><p>Error: {pageError}</p></div>;

  return (
    <div className="main-content">
      <h1>{taskName}</h1>
      
      {taskDescription && (
        <p style={{ marginBottom: "20px", fontSize: "16px" }}>{taskDescription}</p>
      )}

      <h2>Java Code</h2>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={12}
        style={{ width: "100%", fontFamily: "monospace" }}
      />

      <button onClick={runCode} disabled={loading}>
        {loading ? "Running..." : "Run Code"}
      </button>

      <h3>Output</h3>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <pre>{output}</pre>
    </div>
  );
};

export default TaskPage;
