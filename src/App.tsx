import { useEffect, useState } from 'react';

type Health = { status: string; env: string };

export function App() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json() as Promise<Health>)
      .then(setHealth)
      .catch(() => setHealth({ status: 'offline', env: '?' }));
  }, []);

  return (
    <main>
      <h1>TeamUp</h1>
      <p>API: {health ? `${health.status} (${health.env})` : 'verificando...'}</p>
    </main>
  );
}
