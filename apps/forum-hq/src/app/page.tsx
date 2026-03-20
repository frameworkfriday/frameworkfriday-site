import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FF4F1A",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Geometric grid texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />

      {/* Top-left radial glow */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          left: "-200px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Bottom-right radial glow */}
      <div
        style={{
          position: "absolute",
          bottom: "-300px",
          right: "-200px",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,0,0,0.08) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "720px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* FF Logo watermark */}
        <div style={{ marginBottom: "12px", opacity: 0.9 }}>
          <Image
            src="/ff-logo.png"
            alt="Framework Friday"
            width={200}
            height={0}
            style={{ height: "auto", filter: "brightness(0) invert(1)" }}
            priority
          />
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 56px)",
            fontWeight: 900,
            color: "white",
            textAlign: "center",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            marginBottom: "8px",
          }}
        >
          HQ
        </h1>
        <p
          style={{
            fontSize: "15px",
            fontWeight: 500,
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
            marginBottom: "48px",
            letterSpacing: "0.02em",
          }}
        >
          Your home for everything Framework Friday.
        </p>

        {/* Two cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            width: "100%",
          }}
          className="landing-card-grid"
        >
          {/* Forum Members Card */}
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "10px",
              padding: "36px 28px 32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              transition: "transform 0.2s ease, background 0.2s ease",
            }}
            className="landing-card"
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <Image
                src="/forum-icon.png"
                alt="Forum"
                width={36}
                height={36}
              />
            </div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "white",
                marginBottom: "8px",
                letterSpacing: "-0.01em",
              }}
            >
              Operator Forum
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.5,
                marginBottom: "28px",
                flex: 1,
              }}
            >
              Dashboard, sessions, resources, and your operator community.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                padding: "13px 24px",
                borderRadius: "14px",
                background: "white",
                color: "#FF4F1A",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.02em",
                textDecoration: "none",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              className="landing-btn"
            >
              Sign In →
            </Link>
          </div>

          {/* Decision Sprint Card */}
          <div
            style={{
              background: "rgba(0,0,0,0.12)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              padding: "36px 28px 32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              transition: "transform 0.2s ease, background 0.2s ease",
            }}
            className="landing-card"
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <Image
                src="/logo.png"
                alt="Decision Sprint"
                width={36}
                height={36}
              />
            </div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "white",
                marginBottom: "8px",
                letterSpacing: "-0.01em",
              }}
            >
              Decision Sprint
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.5,
                marginBottom: "28px",
                flex: 1,
              }}
            >
              Use the unique link sent to you via email to access your Sprint
              HQ.
            </p>
            <a
              href="mailto:hello@frameworkfriday.ai"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                padding: "13px 24px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.02em",
                textDecoration: "none",
                transition: "transform 0.15s ease, background 0.15s ease",
              }}
              className="landing-btn-ghost"
            >
              Need help? Contact us
            </a>
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            marginTop: "48px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.35)",
            textAlign: "center",
            letterSpacing: "0.04em",
          }}
        >
          &copy; {new Date().getFullYear()} Framework Friday
        </p>
      </div>

      {/* Responsive + hover styles */}
      <style>{`
        .landing-card-grid {
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 640px) {
          .landing-card-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .landing-card:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.18) !important;
        }
        .landing-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .landing-btn-ghost:hover {
          background: rgba(255,255,255,0.18) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
