import { describe, expect, it, vi } from "vitest";

import type { TrpcSessionUser } from "../../../types";

vi.mock("@calcom/features/credentials/handleDeleteCredential", () => ({
  default: vi.fn(async () => undefined),
}));

describe("deleteCredentialHandler", () => {
  it("passes viewer credentials delete input to handleDeleteCredential", async () => {
    const handleDeleteCredential = (await import("@calcom/features/credentials/handleDeleteCredential")).default;
    const { deleteCredentialHandler } = await import("./deleteCredential.handler");

    await deleteCredentialHandler({
      ctx: {
        user: {
          id: 42,
          metadata: {
            defaultConferencingApp: {
              appSlug: "zoom",
            },
          },
        } as NonNullable<TrpcSessionUser>,
      },
      input: {
        id: 999,
        teamId: 7,
      },
    });

    expect(handleDeleteCredential).toHaveBeenCalledWith({
      userId: 42,
      userMetadata: {
        defaultConferencingApp: {
          appSlug: "zoom",
        },
      },
      credentialId: 999,
      teamId: 7,
    });
  });
});
