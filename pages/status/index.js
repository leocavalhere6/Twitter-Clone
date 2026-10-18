import useSWR from "swr";
import Link from "next/link";

async function fetchAPI(key) {
  const response = await fetch(key);
  return await response.json();
}

export default function StatusPage() {
  return (
    <div className="twitter-layout">
      <aside className="sidebar">
        <h2 style={{ color: "#1d9bf0", fontSize: "1.8rem" }}>𝕏 / Twitter</h2>
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            fontWeight: "bold",
          }}
        >
          <Link href="/">← Back to Feed</Link>
        </nav>
      </aside>

      <main className="main-feed">
        <div className="feed-header">
          <span>System Status & Health Check</span>
        </div>

        <div style={{ padding: "16px" }}>
          <UpdatedAt />
          <DatabaseStatus />
        </div>
      </main>
    </div>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAtText = "Loading...";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "medium",
    });
  }

  return (
    <div className="status-card">
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span className="status-badge" />
        <span>
          Last system check: <strong>{updatedAtText}</strong>
        </span>
      </div>
    </div>
  );
}

function DatabaseStatus() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  if (isLoading || !data) {
    return (
      <div className="status-card">
        <h3>PostgreSQL Service</h3>
        <p style={{ color: "#71767b", marginTop: "8px" }}>
          Connecting to Docker instance...
        </p>
      </div>
    );
  }

  const database = data.dependencies.database;

  return (
    <div className="status-card">
      <h3
        style={{
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>PostgreSQL Instance</span>
        <span style={{ color: "#00ba7c", fontSize: "0.9rem" }}>
          ● Operational
        </span>
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          color: "#e7e9ea",
        }}
      >
        <div
          style={{
            background: "#202327",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <div style={{ color: "#71767b", fontSize: "0.8rem" }}>VERSION</div>
          <strong>{database.version}</strong>
        </div>
        <div
          style={{
            background: "#202327",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <div style={{ color: "#71767b", fontSize: "0.8rem" }}>
            OPEN CONNECTIONS
          </div>
          <strong>
            {database.opened_connections} / {database.max_connections}
          </strong>
        </div>
      </div>
    </div>
  );
}
