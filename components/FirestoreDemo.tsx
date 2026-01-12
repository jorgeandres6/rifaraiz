import React, { useEffect, useState } from "react";
import { useCollection, Raffles } from "../services/firestore";

export default function FirestoreDemo() {
  const raffles = useCollection("raffles");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Example: one-time fetch
    Raffles.getAll().then(() => setLoading(false)).catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h3>Firestore demo — raffles</h3>
      {loading && <div>Loading…</div>}
      {!loading && (
        <ul>
          {raffles.length === 0 && <li>No raffles</li>}
          {raffles.map((r) => (
            <li key={r.id}>
              <strong>{(r as any).title}</strong> — {(r as any).description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
