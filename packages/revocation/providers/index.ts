// Member 4: External Services — Provider router
// Routes a credential to the correct revocation handler based on its type.

import { revokeGoogle } from "./google";
import { revokeZoom } from "./zoom";
import { revokeStripe } from "./stripe";

export async function revokeCredential(credential: { type: string; key: any }) {
  switch (true) {
    case credential.type.startsWith("google_"):
      return revokeGoogle(credential);
    case credential.type.startsWith("zoom_"):
      return revokeZoom(credential);
    case credential.type.startsWith("stripe_"):
      return revokeStripe(credential);
    default:
      // Unknown provider — no remote revocation, local delete is enough
      console.log(`[revocation] No remote revocation for type: ${credential.type}`);
  }
}
