// Member 4: External Services — Zoom revocation

export async function revokeZoom(credential: { key: any }) {
  const token = credential?.key?.access_token;
  if (!token) {
    console.warn("[revocation][zoom] missing access_token; skipping remote revoke");
    return;
  }

  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("[revocation][zoom] missing client credentials; skipping remote revoke");
    return;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const res = await fetch(`https://zoom.us/oauth/revoke?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { Authorization: `Basic ${basic}` },
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn(`[revocation][zoom] revoke failed ${res.status}: ${body}`);
    }
  } catch (err) {
    console.warn("[revocation][zoom] error calling revoke endpoint", err);
  }
}
