import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type UserClick = {
  type: string;
  target?: string;
  metadata?: Record<string, any> | null;
  timestamp?: any;
};

/**
 * Log a click for a specific user under `users/{uid}/clicks`.
 * If no `uid` is provided, the function will return without writing.
 */
export async function logUserClick(
  uid: string | null | undefined,
  event: Omit<UserClick, "timestamp">
) {
  if (!uid) {
    // Avoid writing to an unknown user path. Keep a console fallback for dev.
    // eslint-disable-next-line no-console
    console.warn("logUserClick: no uid, skipping write", event);
    return;
  }

  const payload: UserClick = {
    ...event,
    timestamp: serverTimestamp(),
  };

  try {
    await addDoc(collection(db, "users", uid, "clicks"), payload);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("logUserClick failed", err, payload);
  }
}

export default logUserClick;
