import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { BADGES } from "../badges/BadgeConfig";
import "../styles/badges.css";

type UserBadge = {
  unlocked: boolean;
  unlockedAt?: any;
};

export const Badges: React.FC = () => {
  const [userBadges, setUserBadges] = useState<Record<string, UserBadge>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDocs(
        collection(db, "users", user.uid, "badges")
      );

      const map: Record<string, UserBadge> = {};
      snap.forEach((doc) => {
        map[doc.id] = doc.data() as UserBadge;
      });

      setUserBadges(map);
      setLoading(false);
    };

    fetchBadges();
  }, []);

  if (loading) return <p>Loading rewards...</p>;

  return (
    <div className="badges-page">
      <h1>🏆 Rewards</h1>

      <div className="badges-grid">
        {BADGES.map((badge) => {
          const userBadge = userBadges[badge.id];
          const unlocked = userBadge?.unlocked === true;

          return (
            <div
              key={badge.id}
              className={`badge-card ${unlocked ? "unlocked" : "locked"}`}
            >
              <div className="badge-icon">
                {badge.icon}
              </div>

              <h3>{badge.title}</h3>
              <p>{badge.description}</p>

              {unlocked ? (
                <span className="badge-status unlocked">
                  ✅ Unlocked
                </span>
              ) : (
                <span className="badge-status locked">
                  🔒 Locked
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Badges;
