import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

interface TestItem {
  id: string;
  name: string;
}

const TestCollectionDisplay = () => {
  const [items, setItems] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "test"));
        const data: TestItem[] = [];
        querySnapshot.forEach((doc) => {
          data.push({
            id: doc.id,
            name: doc.data().name || "Unnamed"
          });
        });
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="test-collection">
      <h2>Test Collection</h2>
      {items.length === 0 ? (
        <p>No items found</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <strong>ID:</strong> {item.id} | <strong>Name:</strong> {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TestCollectionDisplay;

