// Member 4: External Services — Google revocation

export async function revokeGoogle(credential: { key: any }) {
  const token = credential?.key?.access_token;

  if (!token) {
    console.warn("[revocation][google] missing access_token; skipping remote revoke");
    return;
  }

  try {
    const res = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn(`[revocation][google] revoke failed ${res.status}: ${body}`);
    }
  } catch (err) {
    console.warn("[revocation][google] error calling revoke endpoint", err);
  }
}
