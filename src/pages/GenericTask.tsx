import { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const RUN_JAVA_URL =
  "https://us-central1-codegrow-5894a.cloudfunctions.net/runJava";

const TaskPage = ({
  userId,
  taskId,
}: {
  userId?: string;
  taskId?: string;
}) => {
  const [code, setCode] = useState<string>(`public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, Codegrow!");
  }
}`);
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

      // VERY naive success check (still fine for now 👍)
      if (data.output?.includes("Hello") && userId && taskId) {
        await setDoc(
          doc(db, "users", userId, "tasks", taskId),
          {
            completed: true,
            completedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong while running the code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Java Task</h2>

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