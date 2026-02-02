import { doc, runTransaction} from "firebase/firestore";
import { db } from "../firebase";

export const validateStreak = async (uid: string) => {
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);
    if (!snap.exists()) return;

    const data = snap.data();
    if (!data.lastCompletedDate || !data.currentStreak) return;

    const last = data.lastCompletedDate.toDate();
    const today = new Date();
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const lastDate = new Date(
      last.getFullYear(),
      last.getMonth(),
      last.getDate()
    );

    const diffDays = Math.floor(
      (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If user missed at least one full day
    if (diffDays >= 2) {
      transaction.update(userRef, {
        currentStreak: 0,
      });
    }
  });
};
