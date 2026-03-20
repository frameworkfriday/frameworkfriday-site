"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Image from "next/image";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [error, setError] = useState<string | null>(
    callbackError === "no_code" ? "Login link expired. Please request a new one." : callbackError
  );

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
          shouldCreateUser: false,
        },
      });
      if (error) {
        setError(
          error.message.toLowerCase().includes("not found") ||
          error.message.toLowerCase().includes("signup")
            ? "No account found. Contact your Forum facilitator."
            : error.message
        );
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        setError("Invalid email or password. Try again or use a magic link.");
      } else {
        window.location.href = redirectTo;
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: "magic" | "password") => {
    setMode(newMode);
    setError(null);
    setPassword("");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#0F0F0F" }}>

      {/* Left panel — brand */}
      <div
        style={{
          width: "420px",
          minWidth: "420px",
          background: "#0F0F0F",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Geometric accent — top-right glow */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,79,26,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        {/* Grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Image
              src="/forum-icon.png"
              alt="Forum HQ"
              width={34}
              height={34}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: "15px",
                color: "white",
                letterSpacing: "0.02em",
              }}
            >
              FORUM HQ
            </span>
          </div>
        </div>

        {/* Bottom copy */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "white",
              lineHeight: 1.2,
              marginBottom: "16px",
            }}
          >
            The operator&apos;s
            <br />
            <span style={{ color: "#FF4F1A" }}>command center.</span>
          </p>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: "32px" }}>
            Your hub for onboarding, sessions, and community.
          </p>
          <Image
            src="/ff-logo.png"
            alt="Framework Friday"
            width={180}
            height={0}
            style={{ height: "auto", opacity: 0.35 }}
          />
        </div>
      </div>

      {/* Right panel — login form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#F7F7F6",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>

          {/* Mobile logo — hidden on desktop via media query fallback */}
          <div style={{ display: "none" }}>
            <Image src="/forum-icon.png" alt="Forum HQ" width={28} height={28} />
            <span style={{ fontWeight: 700, fontSize: "14px" }}>
              FORUM HQ
            </span>
          </div>

          {!sent ? (
            <div>
              <p
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#FF4F1A",
                  marginBottom: "10px",
                }}
              >
                Member Access
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "#0F0F0F",
                  lineHeight: 1.1,
                  marginBottom: "8px",
                }}
              >
                Sign in
              </h1>
              <p style={{ fontSize: "15px", color: "#6E6E6E", marginBottom: "24px", lineHeight: 1.5 }}>
                {mode === "magic"
                  ? "Enter your email and we\u2019ll send a login link."
                  : "Sign in with your email and password."}
              </p>

              {/* Mode toggle */}
              <div
                style={{
                  display: "flex",
                  gap: "0",
                  marginBottom: "28px",
                  borderBottom: "1.5px solid #E5E5E5",
                }}
              >
                <button
                  type="button"
                  onClick={() => switchMode("magic")}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    background: "none",
                    border: "none",
                    borderBottom: mode === "magic" ? "2px solid #FF4F1A" : "2px solid transparent",
                    fontFamily: "var(--font-syne)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: mode === "magic" ? "#0F0F0F" : "#A3A3A3",
                    cursor: "pointer",
                    transition: "color 0.15s ease, border-color 0.15s ease",
                    marginBottom: "-1.5px",
                  }}
                >
                  Magic Link
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("password")}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    background: "none",
                    border: "none",
                    borderBottom: mode === "password" ? "2px solid #FF4F1A" : "2px solid transparent",
                    fontFamily: "var(--font-syne)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: mode === "password" ? "#0F0F0F" : "#A3A3A3",
                    cursor: "pointer",
                    transition: "color 0.15s ease, border-color 0.15s ease",
                    marginBottom: "-1.5px",
                  }}
                >
                  Password
                </button>
              </div>

              {mode === "magic" ? (
                <form onSubmit={handleMagicLink}>
                  <div style={{ marginBottom: "14px" }}>
                    <label
                      htmlFor="email"
                      style={{
                        display: "block",
                        fontFamily: "var(--font-syne)",
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "#6E6E6E",
                        marginBottom: "8px",
                      }}
                    >
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      autoFocus
                      style={{
                        width: "100%",
                        padding: "13px 16px",
                        borderRadius: "10px",
                        border: "1.5px solid #E5E5E5",
                        background: "#FFFFFF",
                        fontSize: "15px",
                        color: "#0F0F0F",
                        outline: "none",
                        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                        fontFamily: "var(--font-dm-sans)",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#FF4F1A";
                        e.target.style.boxShadow = "0 0 0 3px rgba(255,79,26,0.10)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#E5E5E5";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "10px",
                      border: "none",
                      background: loading || !email.trim() ? "#D4D4D4" : "#0F0F0F",
                      color: loading || !email.trim() ? "#A3A3A3" : "#FFFFFF",
                      fontFamily: "var(--font-syne)",
                      fontSize: "14px",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      cursor: loading || !email.trim() ? "not-allowed" : "pointer",
                      transition: "background 0.15s ease, transform 0.1s ease",
                      marginTop: "4px",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && email.trim()) {
                        (e.target as HTMLButtonElement).style.background = "#1A1A1A";
                        (e.target as HTMLButtonElement).style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && email.trim()) {
                        (e.target as HTMLButtonElement).style.background = "#0F0F0F";
                        (e.target as HTMLButtonElement).style.transform = "translateY(0)";
                      }
                    }}
                  >
                    {loading ? "Sending..." : "Send login link \u2192"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePassword}>
                  <div style={{ marginBottom: "14px" }}>
                    <label
                      htmlFor="email-pw"
                      style={{
                        display: "block",
                        fontFamily: "var(--font-syne)",
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "#6E6E6E",
                        marginBottom: "8px",
                      }}
                    >
                      Email address
                    </label>
                    <input
                      id="email-pw"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      autoFocus
                      style={{
                        width: "100%",
                        padding: "13px 16px",
                        borderRadius: "10px",
                        border: "1.5px solid #E5E5E5",
                        background: "#FFFFFF",
                        fontSize: "15px",
                        color: "#0F0F0F",
                        outline: "none",
                        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                        fontFamily: "var(--font-dm-sans)",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#FF4F1A";
                        e.target.style.boxShadow = "0 0 0 3px rgba(255,79,26,0.10)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#E5E5E5";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label
                      htmlFor="password"
                      style={{
                        display: "block",
                        fontFamily: "var(--font-syne)",
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "#6E6E6E",
                        marginBottom: "8px",
                      }}
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      minLength={8}
                      style={{
                        width: "100%",
                        padding: "13px 16px",
                        borderRadius: "10px",
                        border: "1.5px solid #E5E5E5",
                        background: "#FFFFFF",
                        fontSize: "15px",
                        color: "#0F0F0F",
                        outline: "none",
                        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                        fontFamily: "var(--font-dm-sans)",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#FF4F1A";
                        e.target.style.boxShadow = "0 0 0 3px rgba(255,79,26,0.10)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#E5E5E5";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim() || !password}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "10px",
                      border: "none",
                      background: loading || !email.trim() || !password ? "#D4D4D4" : "#0F0F0F",
                      color: loading || !email.trim() || !password ? "#A3A3A3" : "#FFFFFF",
                      fontFamily: "var(--font-syne)",
                      fontSize: "14px",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      cursor: loading || !email.trim() || !password ? "not-allowed" : "pointer",
                      transition: "background 0.15s ease, transform 0.1s ease",
                      marginTop: "4px",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && email.trim() && password) {
                        (e.target as HTMLButtonElement).style.background = "#1A1A1A";
                        (e.target as HTMLButtonElement).style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && email.trim() && password) {
                        (e.target as HTMLButtonElement).style.background = "#0F0F0F";
                        (e.target as HTMLButtonElement).style.transform = "translateY(0)";
                      }
                    }}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>

                  <p style={{ marginTop: "16px", fontSize: "13px", color: "#6E6E6E", textAlign: "center" }}>
                    Don&apos;t have a password yet?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("magic")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#FF4F1A",
                        fontSize: "13px",
                        cursor: "pointer",
                        textDecoration: "underline",
                        fontFamily: "inherit",
                        padding: 0,
                      }}
                    >
                      Use magic link instead
                    </button>
                  </p>
                </form>
              )}

              {error && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    fontSize: "13px",
                    color: "#EF4444",
                  }}
                >
                  {error}
                </div>
              )}

              <p style={{ marginTop: "28px", fontSize: "12px", color: "#A3A3A3", textAlign: "center" }}>
                Members only — contact your Forum facilitator for access.
              </p>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#0F0F0F",
                  marginBottom: "10px",
                }}
              >
                Check your email
              </h2>
              <p style={{ fontSize: "15px", color: "#6E6E6E", lineHeight: 1.6 }}>
                Login link sent to<br />
                <strong style={{ color: "#0F0F0F" }}>{email}</strong>
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                style={{
                  marginTop: "24px",
                  fontSize: "13px",
                  color: "#6E6E6E",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                Use a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0F0F0F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF4F1A" }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
