
import { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const JDoodleClientId = "bfdea6471d0d0366d1b9ee08ba2dc37b";
const JDoodleClientSecret = "d568ccafd37096954b0412e3d507dcbcf8d5ff4d0e72d1b211de13b1f6cbf0fa";

export const TaskPage = ({ userId, taskId }: {
  userId: string;
  taskId: string;
}) => {
  const [code, setCode] = useState<string>(`public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, Codegrow!");
  }
}`);
  const [output, setOutput] = useState<string>("");

  const runCode = async () => {
    const res = await fetch("https://api.jdoodle.com/v1/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: JDoodleClientId,
        clientSecret: JDoodleClientSecret,
        script: code,
        language: "java",
        versionIndex: "4",
      }),
    });

    const data = await res.json();
    setOutput(data.output);

    // VERY naive success check
    if (data.output?.includes("Hello")) {
      await setDoc(
        doc(db, "users", userId, "tasks", taskId),
        {
          completed: true,
          completedAt: serverTimestamp(),
        },
        { merge: true }
      );
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

      <button onClick={runCode}>Run Code</button>

      <h3>Output</h3>
      <pre>{output}</pre>
    </div>
  );
};

export default TaskPage;