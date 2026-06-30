'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AuthClient() {
  const router = useRouter();
  const [mode, setMode] = useState("signin"); // "signin" or "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Create profile row for new user
      if (data.user) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          username: username || email.split("@")[0],
          bio: "",
          favourite_runs: [],
        });
      }

      setSuccess("Account created! Check your email to confirm, then sign in.");
      setLoading(false);
      return;
    }

    // Sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div>
      <div className="auth-header">
        <div className="nm-eyebrow">Near Mint</div>
        <h1 className="auth-title">
          {mode === "signin" ? "Welcome back." : "Create an account."}
        </h1>
        <p className="auth-sub">
          {mode === "signin"
            ? "Sign in to track your runs."
            : "Start tracking comic book runs."}
        </p>
      </div>

      <div className="auth-form">

        {mode === "signup" && (
          <div className="log-field">
            <div className="log-label">Username</div>
            <input
              type="text"
              className="auth-input"
              placeholder="yourname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        )}

        <div className="log-field">
          <div className="log-label">Email</div>
          <input
            type="email"
            className="auth-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="log-field">
  <div className="log-label">Password</div>
  <div className="auth-password-wrap">
    <input
      type={showPassword ? "text" : "password"}
      className="auth-input"
      placeholder="••••••••"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      style={{ paddingRight: 40 }}
    />
    <button
      type="button"
      className="auth-eye"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? "🙈" : "👁"}
    </button>
  </div>
</div>

        {error && <p className="log-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        <button
          className="log-btn-save"
          onClick={handleSubmit}
          disabled={loading}
          type="button"
          style={{ width: "100%", padding: "10px" }}
        >
          {loading
            ? "Loading…"
            : mode === "signin"
            ? "Sign in"
            : "Create account"}
        </button>

        <p className="auth-switch">
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            className="auth-switch-btn"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setSuccess(null);
            }}
            type="button"
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>

      </div>
    </div>
  );
}