import Link from "next/link";

export default function HomePage() {
  return (
    <div className="twitter-layout">
      {/* Navigation Sidebar */}
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
          <Link href="/">🏠 Home</Link>
          <Link href="/status">📊 System Status</Link>
          <a
            href="https://github.com/leocavalhere6/Twitter-Clone"
            target="_blank"
            rel="noreferrer"
          >
            💻 GitHub Repository
          </a>
        </nav>
      </aside>

      {/* Main Feed */}
      <main className="main-feed">
        <div className="feed-header">Home</div>

        {/* Post Creation Box */}
        <div className="tweet-box">
          <div className="avatar">L</div>
          <div style={{ flex: 1 }}>
            <textarea
              className="tweet-input"
              placeholder="What is happening?!"
              rows={2}
              readOnly
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "8px",
              }}
            >
              <button className="tweet-btn">Post</button>
            </div>
          </div>
        </div>

        {/* Feed Posts (Technical Showcase) */}
        <div className="tweet-card">
          <div className="avatar">🤖</div>
          <div>
            <div style={{ display: "flex", gap: "8px", color: "#71767b" }}>
              <strong style={{ color: "#e7e9ea" }}>System Admin</strong>
              <span>@system</span> · <span>just now</span>
            </div>
            <p style={{ marginTop: "6px" }}>
              🚀 Welcome to <strong>Twitter Clone</strong>! This application was
              built with a focus on resilient architecture, Clean Code, and
              high-performance software engineering standards.
            </p>
          </div>
        </div>

        <div className="tweet-card">
          <div className="avatar">⚙️</div>
          <div>
            <div style={{ display: "flex", gap: "8px", color: "#71767b" }}>
              <strong style={{ color: "#e7e9ea" }}>Engineering Bot</strong>
              <span>@tech</span> · <span>5m</span>
            </div>
            <p style={{ marginTop: "6px" }}>
              🛠️ <strong>Active Architecture:</strong>
              <br />
              • Versioned RESTful API (`/api/v1`)
              <br />
              • PostgreSQL with automated migrations running on Docker
              <br />
              • Redis-backed rate limiting protection
              <br />• CI/CD pipeline via GitHub Actions and Jest Coverage
            </p>
          </div>
        </div>
      </main>

      {/* Right Sidebar Widgets */}
      <aside className="widgets">
        <div className="status-card">
          {/* Corrigido aqui: What&apos;s happening */}
          <h3 style={{ marginBottom: "12px" }}>What&apos;s happening</h3>
          <div style={{ color: "#71767b", fontSize: "0.9rem" }}>
            Backend Architecture
          </div>
          <div style={{ fontWeight: "bold", margin: "4px 0 12px" }}>
            NestJS & Microservices Migration
          </div>
          <Link href="/status" style={{ fontSize: "0.9rem" }}>
            <span className="status-badge" />
            Check service health (API & DB) →
          </Link>
        </div>
      </aside>
    </div>
  );
}
