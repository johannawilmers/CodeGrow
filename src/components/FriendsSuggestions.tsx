import React, { useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

interface User {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  currentStreak: number;
}

const FriendsSuggestions: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = firebase.firestore().collection("users");
        const snapshot = await usersRef.get();
        const userList: User[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          userList.push({
            uid: doc.id,
            displayName: data.displayName || "Unnamed User",
            photoURL: data.photoURL || null,
            currentStreak: data.currentStreak || 0,
          });
        });
        setUsers(userList);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Loading friends suggestions...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="friends-suggestions">
      <h2>Friends Suggestions</h2>
      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.uid}>
              {user.photoURL && (
                <img
                  
                />
              )}
              <span>{user.displayName}</span>
              <span >
                🔥 {user.currentStreak}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendsSuggestions;
