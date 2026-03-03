import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { logUserClick } from "../utils/clickLogger";
import "../styles/topicEditor.css";

const TopicEditor = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const snap = await getDoc(doc(db, "topics", topicId));
        if (!snap.exists()) {
          setError("Topic not found");
          return;
        }
        const data = snap.data();
        setName(data.name || "");
        setDescription(data.description || "");
        setLink(data.link || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load topic");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [topicId]);

  const handleSave = async () => {
    if (!topicId) return;
    const user = auth.currentUser;
    if (!user) {
      setError("You must be signed in to edit topics.");
      return;
    }
    try {
      await setDoc(
        doc(db, "topics", topicId),
        {
          name,
          description,
          link,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      logUserClick(user.uid, { type: "topic_edit", target: topicId });
      navigate(`/topic/${topicId}/tasks`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="main-content topic-editor">
      <h1>Edit Topic</h1>
      <div className="form-group">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>
      <div className="form-group">
        <label>Link</label>
        <input value={link} onChange={(e) => setLink(e.target.value)} />
      </div>
      <div className="form-actions">
        <button onClick={handleSave}>Save</button>
        <button onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </div>
  );
};

export default TopicEditor;
