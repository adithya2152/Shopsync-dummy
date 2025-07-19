'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hashParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token');

    if (!access_token) {
      console.error("❌ No access_token found in URL fragment");
      return;
    }

    console.log("🔐 Access token found:", access_token);

    fetch('/api/auth/complete_login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token, refresh_token }),
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          console.error("❌ Login failed:", data.error);
          return;
        }

        console.log("✅ Login successful");
        window.history.replaceState(null, "", window.location.pathname); // Clean up fragment
        router.replace('/'); // redirect to your logged-in area
      })
      .catch((err) => {
        console.error("❌ Request failed:", err);
      });
  }, [router]);

  return <div className="p-4">Logging you in...</div>;
}
