export type LocalAuthSession = {
  provider: "local";
  accessToken: string;
  user: {
    email: string;
  };
  createdAt: string;
};

type LocalAuthUser = {
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
};

const USERS_KEY = "flex-ppt-local-auth-users-v1";
const SESSION_KEY = "flex-ppt-local-auth-session-v1";

export function normalizeLocalEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getLocalAuthSession(): LocalAuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as LocalAuthSession;
    if (!session?.user?.email || session.provider !== "local") return null;
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export async function registerLocalUser(email: string, password: string) {
  const normalizedEmail = normalizeLocalEmail(email);
  validateLocalCredentials(normalizedEmail, password);

  const users = readUsers();
  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("Email sudah terdaftar di workspace lokal.");
  }

  const salt = createSalt();
  const user: LocalAuthUser = {
    email: normalizedEmail,
    salt,
    passwordHash: await hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  };
  writeUsers([...users, user]);
  return saveSession(normalizedEmail);
}

export async function loginLocalUser(email: string, password: string) {
  const normalizedEmail = normalizeLocalEmail(email);
  validateLocalCredentials(normalizedEmail, password);

  const user = readUsers().find((item) => item.email === normalizedEmail);
  if (!user) throw new Error("Email belum terdaftar di workspace lokal.");

  const passwordHash = await hashPassword(password, user.salt);
  if (passwordHash !== user.passwordHash) {
    throw new Error("Password lokal tidak cocok.");
  }

  return saveSession(normalizedEmail);
}

export function clearLocalAuthSession() {
  localStorage.removeItem(SESSION_KEY);
}

function validateLocalCredentials(email: string, password: string) {
  if (!email.includes("@") || !email.includes(".")) {
    throw new Error("Email tidak valid.");
  }
  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter.");
  }
}

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [] as LocalAuthUser[];
    const users = JSON.parse(raw) as LocalAuthUser[];
    return Array.isArray(users) ? users.filter((user) => user.email && user.passwordHash && user.salt) : [];
  } catch {
    localStorage.removeItem(USERS_KEY);
    return [];
  }
}

function writeUsers(users: LocalAuthUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveSession(email: string): LocalAuthSession {
  const session: LocalAuthSession = {
    provider: "local",
    accessToken: `local-${crypto.randomUUID()}`,
    user: { email },
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function createSalt() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string) {
  const payload = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
