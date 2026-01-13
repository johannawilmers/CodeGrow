import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";


interface ThemesItem {
  id: string;
  name: string;
  order: number;
}

const ThemesDisplay = () => {
  const [items, setItems] = useState<ThemesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "themes"));
        const data: ThemesItem[] = [];
        querySnapshot.forEach((doc) => {
          data.push({
            id: doc.id,
            name: doc.data().name || "Unnamed",
            order: doc.data().order || 0
          });
        });
        data.sort((a, b) => a.order - b.order);
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
    <div className="themes-collection">
      <h2>Themes</h2>
      {items.length === 0 ? (
        <p>No items found</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <Link to={`/theme/${item.id}`}>{item.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ThemesDisplay;

