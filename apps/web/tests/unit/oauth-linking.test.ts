import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the User model before importing the SUT — syncOAuthUser hits
// User.findOne / User.create / row.update, and we want to assert against
// those calls without spinning up Sequelize.
const mockFindOne = vi.fn();
const mockCreate = vi.fn();

vi.mock("@/models", () => ({
  User: {
    findOne: (...args: unknown[]) => mockFindOne(...args),
    create: (...args: unknown[]) => mockCreate(...args),
  },
}));

// Stub randomUUID so we can assert deterministic ids.
vi.mock("node:crypto", async () => {
  const actual = await vi.importActual<typeof import("node:crypto")>(
    "node:crypto"
  );
  return {
    ...actual,
    randomUUID: () => "uuid-stub",
  };
});

import { syncOAuthUser } from "@/lib/oauth-linking";

beforeEach(() => {
  mockFindOne.mockReset();
  mockCreate.mockReset();
});
afterEach(() => {
  vi.restoreAllMocks();
});

function row(overrides: Partial<Record<string, unknown>> = {}) {
  const update = vi.fn().mockResolvedValue(undefined);
  return {
    id: "row-1",
    email: "user@example.com",
    provider: null as string | null,
    providerId: null as string | null,
    name: null as string | null,
    image: null as string | null,
    passwordHash: null as string | null,
    update,
    ...overrides,
  };
}

const profile = {
  provider: "github" as const,
  providerId: "gh-42",
  email: "user@example.com",
  name: "User",
  image: "https://example.com/avatar.png",
};

describe("syncOAuthUser — caso 1: identidad ya vinculada", () => {
  it("devuelve el usuario existente y NO toca otros caminos", async () => {
    const existing = row({ id: "user-1", provider: "github", providerId: "gh-42" });
    mockFindOne.mockResolvedValueOnce(existing);

    const result = await syncOAuthUser(profile);

    expect(result).toEqual({ id: "user-1", email: "user@example.com", isNew: false });
    expect(mockFindOne).toHaveBeenCalledTimes(1);
    expect(mockFindOne).toHaveBeenCalledWith({
      where: { provider: "github", providerId: "gh-42" },
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("refresca name/image si faltaban", async () => {
    const existing = row({
      id: "user-1",
      provider: "github",
      providerId: "gh-42",
      name: null,
      image: null,
    });
    mockFindOne.mockResolvedValueOnce(existing);
    await syncOAuthUser(profile);
    expect(existing.update).toHaveBeenCalledWith({
      name: "User",
      image: "https://example.com/avatar.png",
    });
  });

  it("NO sobrescribe name/image existentes", async () => {
    const existing = row({
      id: "user-1",
      provider: "github",
      providerId: "gh-42",
      name: "Original Name",
      image: "https://example.com/old.png",
    });
    mockFindOne.mockResolvedValueOnce(existing);
    await syncOAuthUser(profile);
    expect(existing.update).not.toHaveBeenCalled();
  });
});

describe("syncOAuthUser — caso 2: linkear OAuth sobre cuenta existente por email", () => {
  it("escribe provider+providerId en la cuenta local sin proveedor previo", async () => {
    const local = row({
      id: "local-1",
      email: "user@example.com",
      provider: null,
      passwordHash: "$2y$bcrypt",
    });
    // Primera llamada (búsqueda por provider) devuelve null;
    // segunda (búsqueda por email) devuelve el local.
    mockFindOne.mockResolvedValueOnce(null);
    mockFindOne.mockResolvedValueOnce(local);

    const result = await syncOAuthUser(profile);

    expect(result).toEqual({ id: "local-1", email: "user@example.com", isNew: true });
    expect(local.update).toHaveBeenCalledWith({
      provider: "github",
      providerId: "gh-42",
      name: "User",
      image: "https://example.com/avatar.png",
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rechaza el link si la cuenta ya estaba vinculada a otro proveedor", async () => {
    const local = row({
      id: "local-1",
      provider: "google",
      providerId: "ggl-99",
    });
    mockFindOne.mockResolvedValueOnce(null);
    mockFindOne.mockResolvedValueOnce(local);

    await expect(syncOAuthUser(profile)).rejects.toThrow(/vinculada a google/i);
    expect(local.update).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("syncOAuthUser — caso 3: cuenta nueva", () => {
  it("crea un usuario sin passwordHash y con la identidad OAuth", async () => {
    mockFindOne.mockResolvedValueOnce(null); // por provider
    mockFindOne.mockResolvedValueOnce(null); // por email
    mockCreate.mockResolvedValueOnce({ id: "uuid-stub", email: "user@example.com" });

    const result = await syncOAuthUser(profile);

    expect(result).toEqual({ id: "uuid-stub", email: "user@example.com", isNew: true });
    expect(mockCreate).toHaveBeenCalledWith({
      id: "uuid-stub",
      email: "user@example.com",
      passwordHash: null,
      provider: "github",
      providerId: "gh-42",
      name: "User",
      image: "https://example.com/avatar.png",
    });
  });
});
