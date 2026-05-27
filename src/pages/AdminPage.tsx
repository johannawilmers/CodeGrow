import { useState, useEffect } from "react";
import { 
  collection, addDoc, serverTimestamp, 
  getDocs, doc, getDoc, updateDoc, arrayUnion 
} from "firebase/firestore";
import { db } from "../firebase";
import ADMIN_PASSWORD from "../adminPassword"; 

interface Theme {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  name: string;
}

const AdminPage = () => {
  // State for password check
  const [enteredPassword, setEnteredPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string>("");

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [starterCode, setStarterCode] = useState(`public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, Codegrow!");
  }
}`);
  const [expectedOutput, setExpectedOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password submit handler
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPassword === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError(null);
    } else {
      setPasswordError("Incorrect password");
    }
  };

  // Fetch themes on mount (only after auth)
  useEffect(() => {
    if (!authenticated) return;
    const fetchThemes = async () => {
      try {
        const themesSnapshot = await getDocs(collection(db, "themes"));
        const themesList: Theme[] = [];
        themesSnapshot.forEach((doc) => {
          const data = doc.data();
          themesList.push({ id: doc.id, name: data.name || "Unnamed Theme" });
        });
        setThemes(themesList);
        if (themesList.length > 0) {
          setSelectedThemeId(themesList[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch themes:", err);
      }
    };

    fetchThemes();
  }, [authenticated]);

  // Fetch topics when selectedThemeId changes (using references)
  useEffect(() => {
    if (!authenticated || !selectedThemeId) {
      setTopics([]);
      setSelectedTopicId("");
      return;
    }

    const fetchTopics = async () => {
      try {
        const themeDocRef = doc(db, "themes", selectedThemeId);
        const themeSnap = await getDoc(themeDocRef);

        if (!themeSnap.exists()) {
          setTopics([]);
          setSelectedTopicId("");
          return;
        }

        const topicRefsOrIds = themeSnap.data()?.topics || [];

        let topicsList: Topic[] = [];

        if (Array.isArray(topicRefsOrIds) && topicRefsOrIds.length > 0) {
          // Topics stored as array of DocumentReferences or string IDs
          const first = topicRefsOrIds[0];

          if (typeof first === "string") {
            // array of topic IDs
            const docs = await Promise.all(
              topicRefsOrIds.map((id: string) => getDoc(doc(db, "topics", id)))
            );
            topicsList = docs
              .filter((s: any) => s && s.exists && s.exists())
              .map((s: any) => ({ id: s.id, name: s.data()?.name || "Unnamed Topic" }));
          } else if (first && typeof first.id === "string") {
            // array of document refs
            const docs = await Promise.all(
              topicRefsOrIds.map((ref: any) => getDoc(ref))
            );
            topicsList = docs
              .filter((s) => s.exists())
              .map((s: any) => ({ id: s.id, name: s.data()?.name || "Unnamed Topic" }));
          }
        }

        // If topicsList still empty, fall back to querying topics where theme == selectedThemeId
        if (topicsList.length === 0) {
          try {
            const qColl = collection(db, "topics");
            const docsByThemeId = await getDocs(qColl);
            const filtered = docsByThemeId.docs.filter((d) => {
              const t = d.data().theme;
              if (!t) return false;
              if (typeof t === "string") return t === selectedThemeId;
              if (t?.id) return t.id === selectedThemeId;
              return false;
            });

            topicsList = filtered.map((d) => ({ id: d.id, name: d.data().name || "Unnamed Topic" }));
          } catch (e) {
            // ignore
          }
        }

        setTopics(topicsList);
        setSelectedTopicId(topicsList[0]?.id || "");
      } catch (err) {
        console.error("Failed to fetch topics:", err);
        setTopics([]);
        setSelectedTopicId("");
      }
    };

    fetchTopics();
  }, [selectedThemeId, authenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (!title.trim()) {
        setErrorMessage("Task title is required");
        setLoading(false);
        return;
      }
      if (!selectedThemeId) {
        setErrorMessage("Please select a theme");
        setLoading(false);
        return;
      }
      if (!selectedTopicId) {
        setErrorMessage("Please select a topic");
        setLoading(false);
        return;
      }

      // 1. Create the task doc
      const taskRef = await addDoc(collection(db, "tasks"), {
        title: title.trim(),
        description: description.trim(),
        starterCode: starterCode,
        expectedOutput: expectedOutput.trim(),
        themeId: selectedThemeId,
        topicId: selectedTopicId,
        createdAt: serverTimestamp(),
      });

      // 2. Update the topic document's tasks array with this new task ID
      const topicDocRef = doc(db, "topics", selectedTopicId);
      await updateDoc(topicDocRef, {
        tasks: arrayUnion(taskRef.id),
      });

      setSuccessMessage("Task created successfully!");
      setTitle("");
      setDescription("");
      setStarterCode(`public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, Codegrow!");
  }
}`);
      setExpectedOutput("");
    } catch (err) {
      console.error("Error creating task:", err);
      setErrorMessage("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="main-content admin-container">
        <h2>Admin Login</h2>
        <form onSubmit={handlePasswordSubmit} className="admin-form">
          <input
            type="password"
            placeholder="Enter admin password"
            value={enteredPassword}
            onChange={(e) => setEnteredPassword(e.target.value)}
            className="admin-input"
          />
          <button type="submit" className="admin-button">
            Login
          </button>
          {passwordError && <p className="admin-error">{passwordError}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="main-content admin-container">
      <h1>Create New Task</h1>

      <form onSubmit={handleSubmit} className="admin-form">
        <label>
          Theme
          <select
            value={selectedThemeId}
            onChange={(e) => setSelectedThemeId(e.target.value)}
            disabled={loading}
            className="admin-select"
          >
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Topic
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            disabled={loading || !topics.length}
            className="admin-select"
          >
            {topics.length === 0 ? (
              <option>No topics available</option>
            ) : (
              topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))
            )}
          </select>
        </label>

        <label>
          Task Title (required)
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            required
            className="admin-input"
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            disabled={loading}
            className="admin-textarea"
          />
        </label>

        <label>
          Starter Code
          <textarea
            value={starterCode}
            onChange={(e) => setStarterCode(e.target.value)}
            rows={10}
            disabled={loading}
            className="admin-textarea"
          />
        </label>

        <label>
          Expected Output (for validation)
          <input
            type="text"
            value={expectedOutput}
            onChange={(e) => setExpectedOutput(e.target.value)}
            disabled={loading}
            className="admin-input"
          />
        </label>

        <button type="submit" disabled={loading} className="admin-button">
          {loading ? "Creating..." : "Create Task"}
        </button>
      </form>

      {successMessage && <p className="admin-success">{successMessage}</p>}
      {errorMessage && <p className="admin-error">{errorMessage}</p>}
    </div>
  );
};

export default AdminPage;
