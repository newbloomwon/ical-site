import { NotFoundException } from "@nestjs/common";
import { CredentialsService } from "./credentials.service";
import type { CredentialsRepository } from "./credentials.repository";
import { revokeCredential } from "@calcom/revocation/providers";

jest.mock("@calcom/revocation/providers", () => ({
  revokeCredential: jest.fn(),
}));

describe("CredentialsService", () => {
  const repo = {
    getAllUserCredentialsById: jest.fn(),
    findCredentialByIdAndUserId: jest.fn(),
    deleteUserCredentialById: jest.fn(),
  } as unknown as jest.Mocked<CredentialsRepository>;

  let service: CredentialsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CredentialsService(repo);
  });

  it("returns mapped credentials and marks missing usage as stale", async () => {
    repo.getAllUserCredentialsById.mockResolvedValue([
      { id: 1, type: "google_calendar", appId: "google-calendar" },
      {
        id: 2,
        type: "zoom_video",
        appId: "zoom",
        lastUsedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    ] as unknown as Awaited<ReturnType<CredentialsRepository["getAllUserCredentialsById"]>>);

    const result = await service.getCredentialsForUser(42);

    expect(result).toEqual([
      {
        id: 1,
        type: "google_calendar",
        appId: "google-calendar",
        lastUsedAt: null,
        isStale: true,
      },
      expect.objectContaining({
        id: 2,
        type: "zoom_video",
        appId: "zoom",
        isStale: false,
      }),
    ]);
  });

  it("revokes a credential and deletes it", async () => {
    repo.findCredentialByIdAndUserId.mockResolvedValue({
      id: 7,
      type: "google_calendar",
      key: { access_token: "tok" },
    } as unknown as Awaited<ReturnType<CredentialsRepository["findCredentialByIdAndUserId"]>>);
    repo.deleteUserCredentialById.mockResolvedValue(undefined as never);

    await service.revokeCredential(7, 99);

    expect(revokeCredential).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, type: "google_calendar" })
    );
    expect(repo.deleteUserCredentialById).toHaveBeenCalledWith(99, 7);
  });

  it("throws when credential is not found", async () => {
    repo.findCredentialByIdAndUserId.mockResolvedValue(null);

    await expect(service.revokeCredential(999, 1)).rejects.toBeInstanceOf(NotFoundException);
  });
});
