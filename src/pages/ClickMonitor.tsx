import React, { useEffect, useMemo, useState } from "react";
import {
  collectionGroup,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

type ClickRecord = {
  id: string;
  userId: string;
  type?: string;
  target?: string;
  metadata?: any;
  timestamp?: Date | null;
};

const ClickMonitor: React.FC = () => {
  const [clicks, setClicks] = useState<ClickRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const fetchClicks = async (max = 500) => {
    setLoading(true);
    try {
      const q = query(
        collectionGroup(db, "clicks"),
        orderBy("timestamp", "desc"),
        limit(max)
      );

      const snaps = await getDocs(q);
      const items: ClickRecord[] = [];

      snaps.forEach((d) => {
        const data: any = d.data();
        const userId = d.ref.parent?.parent?.id || "unknown";
        const ts = data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : null;

        items.push({
          id: d.id,
          userId,
          type: data.type,
          target: data.target,
          metadata: data.metadata || null,
          timestamp: ts,
        });
      });

      setClicks(items);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("fetchClicks failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClicks(500);
  }, []);

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const byTarget: Record<string, number> = {};
    const users = new Set<string>();

    clicks.forEach((c) => {
      if (c.type) byType[c.type] = (byType[c.type] || 0) + 1;
      if (c.target) byTarget[c.target] = (byTarget[c.target] || 0) + 1;
      if (c.userId) users.add(c.userId);
    });

    return { total: clicks.length, byType, byTarget, uniqueUsers: users.size };
  }, [clicks]);

  const filtered = useMemo(() => {
    return clicks.filter((c) => {
      if (filterType && c.type !== filterType) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      if (String(c.userId).toLowerCase().includes(q)) return true;
      if (String(c.target || "").toLowerCase().includes(q)) return true;
      try {
        if (c.metadata && JSON.stringify(c.metadata).toLowerCase().includes(q)) return true;
      } catch (e) {}
      return false;
    });
  }, [clicks, filterType, search]);

  const types = useMemo(() => Object.keys(stats.byType).sort(), [stats.byType]);

  return (
    <div className="main-content">
      <h1>Click Monitor</h1>

      <div style={{ marginBottom: 12 }}>
        <button className="admin-button" onClick={() => fetchClicks(500)} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
        <div>
          <strong>Total:</strong> {stats.total}
          <br />
          <strong>Unique users:</strong> {stats.uniqueUsers}
        </div>

        <div>
          <label>
            Filter type:
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">(all)</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label>
            Search:
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="user id, target, metadata" />
          </label>
        </div>
      </div>

      <div style={{ maxHeight: 480, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Time</th>
              <th style={{ textAlign: "left" }}>User</th>
              <th style={{ textAlign: "left" }}>Type</th>
              <th style={{ textAlign: "left" }}>Target</th>
              <th style={{ textAlign: "left" }}>Metadata</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>{c.timestamp ? c.timestamp.toLocaleString() : "-"}</td>
                <td>{c.userId}</td>
                <td>{c.type}</td>
                <td>{String(c.target)}</td>
                <td>{c.metadata ? JSON.stringify(c.metadata) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClickMonitor;
