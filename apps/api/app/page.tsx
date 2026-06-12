export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Art Thérapie — API</h1>
      <p>Backend serverless pour l&apos;application mobile.</p>
      <ul>
        <li>
          <code>GET /api/health</code> — état du service
        </li>
        <li>
          <code>POST /api/exercise/generate</code> — générer un exercice
        </li>
        <li>
          <code>POST /api/reflection/analyze</code> — réflexion sur l&apos;œuvre
        </li>
      </ul>
    </main>
  );
}
