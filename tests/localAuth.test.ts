import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearLocalAuthSession, getLocalAuthSession, loginLocalUser, normalizeLocalEmail, registerLocalUser } from "../src/lib/localAuth";

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
});

describe("local auth", () => {
  it("normalizes local emails", () => {
    expect(normalizeLocalEmail("  User@Example.COM ")).toBe("user@example.com");
  });

  it("registers, persists, and logs in a local user", async () => {
    const registered = await registerLocalUser("user@example.com", "password123");

    expect(registered.provider).toBe("local");
    expect(registered.user.email).toBe("user@example.com");
    expect(getLocalAuthSession()?.user.email).toBe("user@example.com");

    clearLocalAuthSession();
    expect(getLocalAuthSession()).toBeNull();

    const loggedIn = await loginLocalUser("USER@example.com", "password123");
    expect(loggedIn.user.email).toBe("user@example.com");
  });

  it("rejects duplicate local registrations and wrong passwords", async () => {
    await registerLocalUser("user@example.com", "password123");

    await expect(registerLocalUser("USER@example.com", "password123")).rejects.toThrow("Email sudah terdaftar");
    await expect(loginLocalUser("user@example.com", "wrongpass")).rejects.toThrow("Password lokal tidak cocok");
  });
});
