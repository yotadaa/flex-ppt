import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRightIcon, EnvelopeIcon, KeyIcon } from "@heroicons/react/24/outline";
import { loginLocalUser, type LocalAuthSession, registerLocalUser } from "../../lib/localAuth";
import { AppButton, TextField, TrafficLights } from "../ui/controls";

type AuthScreenProps = {
  onAuthenticated: (session: LocalAuthSession) => void;
};

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const session = mode === "login"
        ? await loginLocalUser(email, password)
        : await registerLocalUser(email, password);
      onAuthenticated(session);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Auth lokal gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-window" aria-label="Masuk Flex-PPT">
        <header className="auth-titlebar">
          <TrafficLights />
          <span>Flex-PPT</span>
        </header>
        <div className="auth-body">
          <div className="auth-copy">
            <p className="auth-kicker">Personal workspace</p>
            <h1>{mode === "login" ? "Masuk ke Flex-PPT" : "Buat akun Flex-PPT"}</h1>
            <p>Dashboard proyek, slide dinamis, dan editor presentasi tersimpan di browser lokal untuk akun email kamu.</p>
          </div>

          <form className="auth-form" onSubmit={(event) => void submit(event)}>
            <div className="auth-switch" role="tablist" aria-label="Auth mode">
              <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
              <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Register</button>
            </div>
            <TextField
              label="Email"
              icon={<EnvelopeIcon aria-hidden="true" />}
              type="email"
              value={email}
              inputMode="email"
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
            />
            <TextField
              label="Password"
              icon={<KeyIcon aria-hidden="true" />}
              type="password"
              value={password}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimal 8 karakter"
            />
            <p className="auth-message">Mode lokal aktif. Tidak perlu Supabase public URL/key untuk login dan register saat ini.</p>
            {message ? <p className="auth-message">{message}</p> : null}
            <AppButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={busy || !email.trim() || password.length < 6}
              icon={<ArrowRightIcon aria-hidden="true" />}
            >
              {busy ? "Memproses" : mode === "login" ? "Login" : "Register"}
            </AppButton>
          </form>
        </div>
      </section>
    </main>
  );
}
