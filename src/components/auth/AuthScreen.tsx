import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ArrowRightIcon, EnvelopeIcon, KeyIcon } from "@heroicons/react/24/outline";
import { getSupabaseBrowserClient } from "../../lib/supabaseClient";
import { AppButton, TextField, TrafficLights } from "../ui/controls";

type AuthScreenProps = {
  supabaseConfigured: boolean;
  onAuthenticated: (session: Session) => void;
  onDemo: () => void;
};

export default function AuthScreen({ supabaseConfigured, onAuthenticated, onDemo }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      const client = getSupabaseBrowserClient();
      if (!client) {
        setMessage("Supabase public env belum lengkap. Mode lokal tersedia untuk validasi UI.");
        return;
      }

      const result = mode === "login"
        ? await client.auth.signInWithPassword({ email, password })
        : await client.auth.signUp({ email, password });

      if (result.error) {
        setMessage(result.error.message);
        return;
      }

      if (result.data.session) {
        onAuthenticated(result.data.session);
        return;
      }

      setMessage("Akun dibuat, tetapi session belum aktif. Matikan Confirm email di Supabase Auth settings untuk alur tanpa konfirmasi.");
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
            <p>Dashboard proyek, slide dinamis, dan editor presentasi tersimpan untuk akun email kamu.</p>
          </div>

          <div className="auth-form">
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
            {message ? <p className="auth-message">{message}</p> : null}
            <AppButton
              variant="primary"
              size="lg"
              disabled={busy || !email.trim() || password.length < 6}
              icon={<ArrowRightIcon aria-hidden="true" />}
              onClick={() => void submit()}
            >
              {busy ? "Memproses" : mode === "login" ? "Login" : "Register"}
            </AppButton>
            {!supabaseConfigured ? (
              <AppButton size="lg" onClick={onDemo}>Masuk Mode Lokal</AppButton>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
