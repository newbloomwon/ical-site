import { z } from "zod";

import { getZoomAppKeys } from "@calcom/app-store/zoomvideo/lib/getZoomAppKeys";

const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const ZOOM_REVOKE_URL = "https://zoom.us/oauth/revoke";
const STRIPE_DEAUTHORIZE_URL = "https://connect.stripe.com/oauth/deauthorize";
const MICROSOFT_REVOKE_URL = "https://graph.microsoft.com/v1.0/me/revokeSignInSessions";

const revocationUrlsByCredentialType = {
  google_calendar: GOOGLE_REVOKE_URL,
  zoom_video: ZOOM_REVOKE_URL,
  stripe_payment: STRIPE_DEAUTHORIZE_URL,
  office365_calendar: MICROSOFT_REVOKE_URL,
  office365_video: MICROSOFT_REVOKE_URL,
} as const;

const credentialTokenSchema = z.object({
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
});

const stripeCredentialSchema = z.object({
  stripe_user_id: z.string().optional(),
});

export type RevocableCredentialType = keyof typeof revocationUrlsByCredentialType;

export type RevokeOAuthCredentialResult = {
  attempted: boolean;
  revoked: boolean;
  reason?: string;
  url?: string;
};

export const isRevocableCredentialType = (credentialType: string): credentialType is RevocableCredentialType =>
  credentialType in revocationUrlsByCredentialType;

const revokeWithFormBody = async ({
  url,
  params,
  headers,
}: {
  url: string;
  params: URLSearchParams;
  headers?: HeadersInit;
}): Promise<RevokeOAuthCredentialResult> => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...headers,
      },
      body: params,
    });

    if (!response.ok) {
      return {
        attempted: true,
        revoked: false,
        reason: `Provider revoke request failed with status ${response.status}`,
        url,
      };
    }

    return { attempted: true, revoked: true, url };
  } catch {
    return {
      attempted: true,
      revoked: false,
      reason: "Provider revoke request failed",
      url,
    };
  }
};

export const revokeOAuthCredential = async ({
  credentialType,
  credentialKey,
}: {
  credentialType: RevocableCredentialType;
  credentialKey: unknown;
}): Promise<RevokeOAuthCredentialResult> => {
  if (credentialType === "stripe_payment") {
    const stripeData = stripeCredentialSchema.safeParse(credentialKey);
    const stripeUserId = stripeData.success ? stripeData.data.stripe_user_id : undefined;
    const stripePrivateKey = process.env.STRIPE_PRIVATE_KEY;

    if (!stripeUserId) {
      return {
        attempted: false,
        revoked: false,
        reason: "No stripe_user_id available for provider revocation",
        url: STRIPE_DEAUTHORIZE_URL,
      };
    }

    if (!stripePrivateKey) {
      return {
        attempted: false,
        revoked: false,
        reason: "Missing STRIPE_PRIVATE_KEY for provider revocation",
        url: STRIPE_DEAUTHORIZE_URL,
      };
    }

    return revokeWithFormBody({
      url: STRIPE_DEAUTHORIZE_URL,
      params: new URLSearchParams({
        client_secret: stripePrivateKey,
        stripe_user_id: stripeUserId,
      }),
    });
  }

  const tokenData = credentialTokenSchema.safeParse(credentialKey);
  const token = tokenData.success ? tokenData.data.refresh_token ?? tokenData.data.access_token : undefined;

  if (!token) {
    return {
      attempted: false,
      revoked: false,
      reason: "No access token available for provider revocation",
      url: revocationUrlsByCredentialType[credentialType],
    };
  }

  if (credentialType === "google_calendar") {
    return revokeWithFormBody({
      url: GOOGLE_REVOKE_URL,
      params: new URLSearchParams({ token }),
    });
  }

  if (credentialType === "office365_calendar" || credentialType === "office365_video") {
    try {
      const response = await fetch(MICROSOFT_REVOKE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return {
          attempted: true,
          revoked: false,
          reason: `Provider revoke request failed with status ${response.status}`,
          url: MICROSOFT_REVOKE_URL,
        };
      }

      return {
        attempted: true,
        revoked: true,
        url: MICROSOFT_REVOKE_URL,
      };
    } catch {
      return {
        attempted: true,
        revoked: false,
        reason: "Provider revoke request failed",
        url: MICROSOFT_REVOKE_URL,
      };
    }
  }

  const { client_id, client_secret } = await getZoomAppKeys();
  const basicAuthHeader = `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString("base64")}`;

  return revokeWithFormBody({
    url: ZOOM_REVOKE_URL,
    params: new URLSearchParams({ token }),
    headers: { Authorization: basicAuthHeader },
  });
};
