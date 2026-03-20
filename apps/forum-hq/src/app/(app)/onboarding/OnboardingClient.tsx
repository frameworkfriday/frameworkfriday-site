"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { saveProfile } from "./actions";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  email: string;
  initialProfile: {
    firstName: string;
    lastName: string;
    businessName: string;
    roleTitle: string;
    linkedinUrl: string;
    websiteUrl: string;
    phone: string;
    bio: string;
    industry: string;
    revenueRange: string;
    employeeRange: string;
    city: string;
    state: string;
    timezone: string;
    goals: string;
    referralSource: string;
    birthday: string;
    spousePartnerName: string;
  };
  groupName: string | null;
  memberCount: number | null;
  nextSession: { title: string; starts_at: string; session_type: string } | null;
}

function getCroppedBlob(image: HTMLImageElement, crop: Crop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, 400, 400);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9));
}

function formatSessionDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) +
    " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  forum_session: "Forum Session",
  office_hours: "Office Hours",
  ad_hoc: "Ad Hoc",
};

const REVENUE_RANGES = [
  "Pre-revenue",
  "Under $100K",
  "$100K - $250K",
  "$250K - $500K",
  "$500K - $1M",
  "$1M - $5M",
  "$5M - $10M",
  "$10M - $25M",
  "$25M+",
];

const EMPLOYEE_RANGES = [
  "Solo / 1",
  "2 - 5",
  "6 - 10",
  "11 - 25",
  "26 - 50",
  "51 - 100",
  "100+",
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Phoenix",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

// Steps: 0=Welcome, 1=About You, 2=Photo, 3=Business, 4=Your World, 5=Preferences, 6=Agreement, 7=You're In
const STEP_LABELS = ["Welcome", "About You", "Photo", "Your Business", "Your World", "Preferences", "Agreement", "You're In"];
const FORM_STEPS = [1, 2, 3, 4, 5, 6]; // Steps with user input (progress indicator)
const TOTAL_FORM_STEPS = FORM_STEPS.length;

export default function OnboardingClient({ userId, email, initialProfile, groupName, memberCount, nextSession }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1: About You
  const [firstName, setFirstName] = useState(initialProfile.firstName);
  const [lastName, setLastName] = useState(initialProfile.lastName);
  const [phone, setPhone] = useState(initialProfile.phone);
  const [birthday, setBirthday] = useState(initialProfile.birthday);
  const [bio, setBio] = useState(initialProfile.bio);

  // Step 2: Photo
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // Step 3: Business
  const [businessName, setBusinessName] = useState(initialProfile.businessName);
  const [roleTitle, setRoleTitle] = useState(initialProfile.roleTitle);
  const [industry, setIndustry] = useState(initialProfile.industry);
  const [revenueRange, setRevenueRange] = useState(initialProfile.revenueRange);
  const [employeeRange, setEmployeeRange] = useState(initialProfile.employeeRange);
  const [linkedinUrl, setLinkedinUrl] = useState(initialProfile.linkedinUrl);
  const [websiteUrl, setWebsiteUrl] = useState(initialProfile.websiteUrl);

  // Step 4: Your World
  const [city, setCity] = useState(initialProfile.city);
  const [state, setState] = useState(initialProfile.state);
  const [timezone, setTimezone] = useState(initialProfile.timezone);
  const [goals, setGoals] = useState(initialProfile.goals);
  const [referralSource, setReferralSource] = useState(initialProfile.referralSource);

  // Step 5: Preferences
  const [communityVisible, setCommunityVisible] = useState(true);
  const [emailAnnouncements, setEmailAnnouncements] = useState(true);
  const [emailDirectMentions, setEmailDirectMentions] = useState(true);
  const [emailCommentReplies, setEmailCommentReplies] = useState(true);
  const [emailNewEvents, setEmailNewEvents] = useState(true);
  const [emailGroupPosts, setEmailGroupPosts] = useState(false);
  const [inAppGroupPosts, setInAppGroupPosts] = useState(true);

  // Step 6: Agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToConfidentiality, setAgreedToConfidentiality] = useState(false);

  const [saving, setSaving] = useState(false);

  const initials = [firstName, lastName]
    .map((n) => n?.[0] ?? "")
    .join("")
    .toUpperCase() || email[0]?.toUpperCase() || "?";

  // Photo handlers
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const c = centerCrop(makeAspectCrop({ unit: "%", width: 80 }, 1, width, height), width, height);
    setCrop(c);
  }, []);

  const uploadPhoto = async (andAdvance = false) => {
    if (!completedCrop || !imgRef.current) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      const supabase = createClient();
      const path = `${userId}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        setAvatarUrl(data.publicUrl);
        if (andAdvance) setStep(3);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.set("first_name", firstName);
    fd.set("last_name", lastName);
    fd.set("phone", phone);
    fd.set("birthday", birthday);
    fd.set("bio", bio);
    fd.set("avatar_url", avatarUrl);
    fd.set("business_name", businessName);
    fd.set("role_title", roleTitle);
    fd.set("industry", industry);
    fd.set("company_revenue_range", revenueRange);
    fd.set("employee_count_range", employeeRange);
    fd.set("linkedin_url", linkedinUrl);
    fd.set("website_url", websiteUrl);
    fd.set("city", city);
    fd.set("state", state);
    fd.set("timezone", timezone);
    fd.set("goals", goals);
    fd.set("referral_source", referralSource);
    fd.set("community_visible", String(communityVisible));
    fd.set("email_announcements", String(emailAnnouncements));
    fd.set("email_direct_mentions", String(emailDirectMentions));
    fd.set("email_comment_replies", String(emailCommentReplies));
    fd.set("email_new_events", String(emailNewEvents));
    fd.set("email_group_posts", String(emailGroupPosts));
    fd.set("in_app_group_posts", String(inAppGroupPosts));
    fd.set("agreed_to_terms", String(agreedToTerms));
    fd.set("agreed_to_confidentiality", String(agreedToConfidentiality));
    await saveProfile(fd);
    setSaving(false);
    setStep(7);
  };

  // Shared styles
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", fontSize: "15px",
    border: "1px solid #E5E5E5", borderRadius: "12px",
    fontFamily: "inherit", color: "#0F0F0F", background: "#FFFFFF",
    boxSizing: "border-box", outline: "none",
    transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px", fontWeight: 600, color: "#6E6E6E",
    textTransform: "uppercase", letterSpacing: "0.06em",
    marginBottom: "6px", display: "block",
  };

  const grid2: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px",
  };

  const showProgress = step >= 1 && step <= 6;
  const progressStep = step - 1; // 0-indexed within form steps
  const progressPercent = step >= 7 ? 100 : Math.round((progressStep / TOTAL_FORM_STEPS) * 100);

  const primaryBtn = (enabled: boolean, onClick: () => void, label: string): React.ReactElement => (
    <button
      onClick={onClick}
      disabled={!enabled}
      style={{
        flex: 1, padding: "13px", border: "none", borderRadius: "12px",
        fontSize: "15px", fontWeight: 700, letterSpacing: "-0.01em",
        background: enabled ? "#FF4F1A" : "#E5E5E5",
        color: enabled ? "white" : "#A3A3A3",
        cursor: enabled ? "pointer" : "default",
        transition: "background 0.15s",
      }}
    >
      {label}
    </button>
  );

  const backBtn = (toStep: number): React.ReactElement => (
    <button
      onClick={() => setStep(toStep)}
      style={{
        padding: "13px 22px", background: "transparent", color: "#6E6E6E",
        border: "1px solid #E5E5E5", borderRadius: "12px",
        fontSize: "14px", fontWeight: 600, cursor: "pointer",
      }}
    >
      Back
    </button>
  );

  const checkboxRow = (checked: boolean, onChange: () => void, label: string, sub?: string): React.ReactElement => (
    <div onClick={onChange} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "8px 0", cursor: "pointer" }}>
      <div style={{
        width: "22px", height: "22px", minWidth: "22px", borderRadius: "6px",
        border: `2px solid ${checked ? "#FF4F1A" : "#D4D4D4"}`,
        background: checked ? "#FF4F1A" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s", marginTop: "1px",
      }}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <div>
        <span style={{ fontSize: "14px", color: "#0F0F0F", fontWeight: sub ? 600 : 400 }}>{label}</span>
        {sub && <div style={{ fontSize: "12px", color: "#6E6E6E", marginTop: "2px", lineHeight: 1.4 }}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F6", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "560px" }}>

        {/* Logo mark */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px", background: "#FF4F1A",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H8l-4 4V6c0-1.1.9-2 2-2z" fill="white" />
            </svg>
          </div>
        </div>

        {/* Progress bar — clean, horizontal fill bar */}
        {showProgress && (
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#A3A3A3" }}>
                Step {progressStep + 1} of {TOTAL_FORM_STEPS}
              </span>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#FF4F1A" }}>
                {progressPercent}%
              </span>
            </div>
            <div style={{ width: "100%", height: "4px", borderRadius: "2px", background: "#E5E5E5" }}>
              <div style={{
                width: `${progressPercent}%`, height: "100%", borderRadius: "2px",
                background: "#FF4F1A", transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        )}

        {/* Card */}
        <div className="card" style={{ padding: "36px" }}>

          {/* ═══════ Step 0: Welcome ═══════ */}
          {step === 0 && (
            <div>
              {groupName && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "5px 12px", background: "rgba(255,79,26,0.10)",
                  borderRadius: "10px", fontSize: "12px", fontWeight: 600,
                  color: "#FF4F1A", marginBottom: "16px", letterSpacing: "0.02em",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {groupName}
                </div>
              )}

              <h2 style={{ fontWeight: 800, fontSize: "28px", color: "#0F0F0F", margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                Welcome to Framework Friday
              </h2>
              <p style={{ fontSize: "15px", color: "#6E6E6E", margin: "0 0 24px", lineHeight: 1.65 }}>
                You&rsquo;ve been selected to join a private peer group of business operators who think differently about how they run their companies. Forum HQ is your home base — your group, your sessions, and the tools to get the most out of your membership.
              </p>

              {/* Social proof */}
              {memberCount && memberCount > 1 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "14px 16px", background: "#F7F7F6", borderRadius: "12px",
                  marginBottom: "24px",
                }}>
                  <div style={{ display: "flex" }}>
                    {Array.from({ length: Math.min(memberCount - 1, 4) }).map((_, i) => (
                      <div key={i} style={{
                        width: "28px", height: "28px", borderRadius: "50%",
                        background: `hsl(${i * 40 + 200}, 20%, ${75 + i * 3}%)`,
                        border: "2px solid #FFFFFF", marginLeft: i === 0 ? 0 : "-8px",
                        zIndex: 4 - i, position: "relative",
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "13px", color: "#6E6E6E", lineHeight: 1.4 }}>
                    <strong style={{ color: "#0F0F0F" }}>{memberCount - 1} {memberCount - 1 === 1 ? "member" : "members"}</strong> are already in {groupName ?? "your group"}, waiting to meet you
                  </span>
                </div>
              )}

              {/* What's ahead */}
              <div style={{ marginBottom: "28px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A3A3A3", marginBottom: "12px" }}>
                  Let&rsquo;s get you set up — takes about 3 minutes
                </div>
                {[
                  { emoji: "👤", text: "Tell us a bit about you" },
                  { emoji: "📸", text: "Add a photo so your group knows your face" },
                  { emoji: "💼", text: "Share what you do and where you operate" },
                  { emoji: "🎯", text: "Set your goals for Forum" },
                  { emoji: "🤝", text: "Agree to the community commitment" },
                ].map((item) => (
                  <div key={item.text} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "16px", width: "24px", textAlign: "center", flexShrink: 0 }}>{item.emoji}</span>
                    <span style={{ fontSize: "14px", color: "#6E6E6E" }}>{item.text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                style={{
                  width: "100%", padding: "14px", background: "#FF4F1A", color: "white",
                  border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700,
                  cursor: "pointer", letterSpacing: "-0.01em",
                }}
              >
                Let&rsquo;s go
              </button>
            </div>
          )}

          {/* ═══════ Step 1: About You ═══════ */}
          {step === 1 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "22px", color: "#0F0F0F", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                First, tell us about you
              </h2>
              <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "0 0 24px", lineHeight: 1.5 }}>
                The basics. Your group will see your name and bio — the rest is just for us to know you better.
              </p>

              <div style={grid2}>
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Last Name *</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last" style={inputStyle} />
                </div>
              </div>

              <div style={grid2}>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Birthday</label>
                  <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Short Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A sentence or two about who you are and what drives you..."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
                <div style={{ fontSize: "11px", color: "#A3A3A3", marginTop: "4px" }}>
                  This appears in the community directory. Keep it personal — your group wants to know the human, not the resume.
                </div>
              </div>

              <div style={{ fontSize: "12px", color: "#A3A3A3", marginBottom: "20px" }}>
                Signing in as <strong>{email}</strong>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                {backBtn(0)}
                {primaryBtn(!!firstName && !!lastName, () => setStep(2), "Continue")}
              </div>
            </div>
          )}

          {/* ═══════ Step 2: Profile Photo ═══════ */}
          {step === 2 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "22px", color: "#0F0F0F", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                Put a face to your name
              </h2>
              <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "0 0 24px", lineHeight: 1.5 }}>
                Your group will see this before your first session. It makes the room feel familiar before you even walk in.
              </p>

              {avatarUrl ? (
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrl} alt="Profile" style={{ width: "140px", height: "140px", borderRadius: "50%", objectFit: "cover", border: "3px solid #FF4F1A" }} />
                  <div style={{ fontSize: "14px", color: "#22C55E", marginTop: "10px", fontWeight: 600 }}>Looking good, {firstName}!</div>
                  <button
                    onClick={() => { setAvatarUrl(""); setImgSrc(""); }}
                    style={{ fontSize: "12px", color: "#6E6E6E", background: "none", border: "none", cursor: "pointer", marginTop: "4px", textDecoration: "underline" }}
                  >
                    Choose a different photo
                  </button>
                </div>
              ) : imgSrc ? (
                <div style={{ marginBottom: "16px" }}>
                  <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)} aspect={1} circularCrop style={{ maxHeight: "300px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="Crop preview" style={{ maxHeight: "300px" }} />
                  </ReactCrop>
                  <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                    <button
                      onClick={async () => { await uploadPhoto(true); }}
                      disabled={uploading || !completedCrop}
                      style={{
                        flex: 1, padding: "12px", background: "#FF4F1A", color: "white",
                        border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 600,
                        cursor: uploading ? "wait" : "pointer",
                      }}
                    >
                      {uploading ? "Uploading..." : "Use this photo"}
                    </button>
                    <button
                      onClick={() => { setImgSrc(""); setCrop(undefined); }}
                      style={{ padding: "12px 18px", background: "#F0F0F0", color: "#0F0F0F", border: "none", borderRadius: "12px", fontSize: "14px", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    border: "2px dashed #E5E5E5", borderRadius: "16px", padding: "40px",
                    textAlign: "center", marginBottom: "16px", cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onClick={() => document.getElementById("photo-input")?.click()}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FF4F1A"; e.currentTarget.style.background = "rgba(255,79,26,0.02)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E5E5"; e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{
                    width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,79,26,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 14px", fontSize: "28px",
                  }}>
                    {initials}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "4px" }}>Upload a photo</div>
                  <div style={{ fontSize: "13px", color: "#A3A3A3" }}>Click to browse — JPG or PNG, any size</div>
                  <input id="photo-input" type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                {backBtn(1)}
                <button
                  onClick={() => setStep(3)}
                  style={{
                    flex: 1, padding: "13px",
                    background: avatarUrl ? "#FF4F1A" : "#0F0F0F",
                    color: "white", border: "none", borderRadius: "12px",
                    fontSize: "15px", fontWeight: 700, cursor: "pointer", letterSpacing: "-0.01em",
                  }}
                >
                  {avatarUrl ? "Continue" : "Skip for now"}
                </button>
              </div>
            </div>
          )}

          {/* ═══════ Step 3: Your Business ═══════ */}
          {step === 3 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "22px", color: "#0F0F0F", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                Tell us about your business
              </h2>
              <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "0 0 24px", lineHeight: 1.5 }}>
                This helps us understand your world so we can match you with the right conversations and connections.
              </p>

              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>Business Name</label>
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your company or practice" style={inputStyle} />
              </div>

              <div style={grid2}>
                <div>
                  <label style={labelStyle}>Your Role / Title</label>
                  <input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="e.g. Founder & CEO" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Industry</label>
                  <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. SaaS, Real Estate" style={inputStyle} />
                </div>
              </div>

              <div style={grid2}>
                <div>
                  <label style={labelStyle}>Annual Revenue</label>
                  <select value={revenueRange} onChange={(e) => setRevenueRange(e.target.value)} style={inputStyle}>
                    <option value="">Select range...</option>
                    {REVENUE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Team Size</label>
                  <select value={employeeRange} onChange={(e) => setEmployeeRange(e.target.value)} style={inputStyle}>
                    <option value="">Select range...</option>
                    {EMPLOYEE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Social links */}
              <div style={{ borderTop: "1px solid #EEEEED", paddingTop: "16px", marginBottom: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A3A3A3", marginBottom: "10px" }}>
                  Online presence (optional)
                </div>
                <div style={grid2}>
                  <div>
                    <label style={labelStyle}>LinkedIn</label>
                    <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="linkedin.com/in/you" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Website</label>
                    <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="yoursite.com" style={inputStyle} />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                {backBtn(2)}
                {primaryBtn(true, () => setStep(4), "Continue")}
              </div>
            </div>
          )}

          {/* ═══════ Step 4: Your World ═══════ */}
          {step === 4 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "22px", color: "#0F0F0F", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                Where you are and why you&rsquo;re here
              </h2>
              <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "0 0 24px", lineHeight: 1.5 }}>
                Knowing where you operate helps with scheduling, and your goals help us make Forum work for you.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Tampa" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>State</label>
                  <input value={state} onChange={(e) => setState(e.target.value)} placeholder="FL" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Timezone</label>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={inputStyle}>
                    <option value="">Select...</option>
                    {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace("America/", "").replace("Pacific/", "").replace(/_/g, " ")}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #EEEEED", paddingTop: "18px", marginBottom: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A3A3A3", marginBottom: "10px" }}>
                  Your Forum goals
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={labelStyle}>What do you want to get out of Forum?</label>
                  <textarea
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="Better decisions? Accountability? A network of peers who get it? Whatever it is, write it down."
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                  <div style={{ fontSize: "11px", color: "#A3A3A3", marginTop: "4px" }}>
                    There are no wrong answers. This helps your facilitator personalize your experience.
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>How did you hear about us?</label>
                  <input value={referralSource} onChange={(e) => setReferralSource(e.target.value)} placeholder="A friend, LinkedIn, an event..." style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                {backBtn(3)}
                {primaryBtn(true, () => setStep(5), "Continue")}
              </div>
            </div>
          )}

          {/* ═══════ Step 5: Preferences ═══════ */}
          {step === 5 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "22px", color: "#0F0F0F", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                Your preferences
              </h2>
              <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "0 0 20px", lineHeight: 1.5 }}>
                Control your visibility and how we keep you in the loop. You can change all of this later.
              </p>

              {/* Directory visibility */}
              <div
                onClick={() => setCommunityVisible(!communityVisible)}
                style={{
                  display: "flex", gap: "14px", padding: "16px",
                  border: `2px solid ${communityVisible ? "#FF4F1A" : "#E5E5E5"}`,
                  borderRadius: "12px", cursor: "pointer",
                  background: communityVisible ? "rgba(255,79,26,0.04)" : "transparent",
                  transition: "all 0.15s", marginBottom: "12px",
                }}
              >
                <div style={{
                  width: "22px", height: "22px", minWidth: "22px", borderRadius: "6px",
                  border: `2px solid ${communityVisible ? "#FF4F1A" : "#D4D4D4"}`,
                  background: communityVisible ? "#FF4F1A" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: "1px", transition: "all 0.15s",
                }}>
                  {communityVisible && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#0F0F0F", marginBottom: "3px" }}>Make me visible in the community directory</div>
                  <div style={{ fontSize: "13px", color: "#6E6E6E", lineHeight: 1.5 }}>
                    Other Forum members across all groups can find and connect with you. Your own group always sees your profile.
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div style={{ borderTop: "1px solid #EEEEED", paddingTop: "16px", marginTop: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A3A3A3", marginBottom: "10px" }}>
                  Email me when...
                </div>
                {[
                  { label: "New announcements in my groups", state: emailAnnouncements, setter: setEmailAnnouncements },
                  { label: "Someone replies to my post", state: emailCommentReplies, setter: setEmailCommentReplies },
                  { label: "Someone mentions me", state: emailDirectMentions, setter: setEmailDirectMentions },
                  { label: "New events in my groups", state: emailNewEvents, setter: setEmailNewEvents },
                  { label: "Any group post (high volume)", state: emailGroupPosts, setter: setEmailGroupPosts },
                ].map((item) => (
                  <div key={item.label}>
                    {checkboxRow(item.state, () => item.setter(!item.state), item.label)}
                  </div>
                ))}

                <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A3A3A3", marginBottom: "6px", marginTop: "14px" }}>
                  In-app
                </div>
                {checkboxRow(inAppGroupPosts, () => setInAppGroupPosts(!inAppGroupPosts), "Show group posts in my notification bell")}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                {backBtn(4)}
                {primaryBtn(true, () => setStep(6), "Continue")}
              </div>
            </div>
          )}

          {/* ═══════ Step 6: Community Agreement ═══════ */}
          {step === 6 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "22px", color: "#0F0F0F", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                The commitment
              </h2>
              <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "0 0 24px", lineHeight: 1.6 }}>
                Forum works because every member commits to the same principles. This is what makes the room safe and the conversations real.
              </p>

              {/* Confidentiality */}
              <div style={{
                padding: "20px", background: "#FAFAF9", borderRadius: "14px",
                border: "1px solid #EEEEED", marginBottom: "16px",
              }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F0F0F", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4F1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Confidentiality Commitment
                </div>
                <div style={{ fontSize: "13px", color: "#6E6E6E", lineHeight: 1.65, marginBottom: "14px" }}>
                  Everything shared in Forum stays in Forum. You agree not to share, repeat, or reference other members&rsquo; personal or business information outside the group without their explicit permission. This includes session discussions, shared documents, financial details, and strategic plans.
                </div>
                {checkboxRow(
                  agreedToConfidentiality,
                  () => setAgreedToConfidentiality(!agreedToConfidentiality),
                  "I commit to maintaining full confidentiality",
                  "What's said in the room stays in the room."
                )}
              </div>

              {/* Data use */}
              <div style={{
                padding: "20px", background: "#FAFAF9", borderRadius: "14px",
                border: "1px solid #EEEEED", marginBottom: "24px",
              }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F0F0F", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4F1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  How We Use Your Information
                </div>
                <div style={{ fontSize: "13px", color: "#6E6E6E", lineHeight: 1.65, marginBottom: "14px" }}>
                  The information you provide is used to personalize your Forum experience — matching you with the right group, scheduling sessions in your timezone, and helping your facilitator understand your goals. Your profile appears in the community directory (if you opted in). We will never sell, share, or distribute your personal information to third parties. Only Framework Friday administrators and your group facilitator can access your full profile.
                </div>
                {checkboxRow(
                  agreedToTerms,
                  () => setAgreedToTerms(!agreedToTerms),
                  "I understand how my information is used",
                  "Your data stays within Framework Friday."
                )}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                {backBtn(5)}
                <button
                  onClick={handleFinish}
                  disabled={!agreedToTerms || !agreedToConfidentiality || saving}
                  style={{
                    flex: 1, padding: "13px", border: "none", borderRadius: "12px",
                    fontSize: "15px", fontWeight: 700, letterSpacing: "-0.01em",
                    background: agreedToTerms && agreedToConfidentiality ? "#FF4F1A" : "#E5E5E5",
                    color: agreedToTerms && agreedToConfidentiality ? "white" : "#A3A3A3",
                    cursor: agreedToTerms && agreedToConfidentiality && !saving ? "pointer" : "default",
                    transition: "background 0.15s",
                  }}
                >
                  {saving ? "Setting everything up..." : "Complete setup"}
                </button>
              </div>
            </div>
          )}

          {/* ═══════ Step 7: You're In ═══════ */}
          {step === 7 && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <div style={{
                  width: "64px", height: "64px", borderRadius: "50%",
                  background: "rgba(255,79,26,0.1)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px", fontSize: "28px",
                }}>
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "24px", fontWeight: 700, color: "#FF4F1A" }}>{initials}</span>
                  )}
                </div>
                <h2 style={{ fontWeight: 800, fontSize: "26px", color: "#0F0F0F", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                  You&rsquo;re in, {firstName}.
                </h2>
                <p style={{ fontSize: "15px", color: "#6E6E6E", margin: 0, lineHeight: 1.5 }}>
                  Your profile is live and your group is waiting. Welcome to the room.
                </p>
              </div>

              {/* Profile preview card */}
              <div style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "18px", background: "#F7F7F6", borderRadius: "14px",
                marginBottom: "16px", border: "1px solid #EEEEED",
              }}>
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Profile" style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "50%",
                    background: "rgba(255,79,26,0.12)", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "18px", fontWeight: 700,
                    color: "#FF4F1A", flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: "#0F0F0F" }}>{firstName} {lastName}</div>
                  {businessName && <div style={{ fontSize: "13px", color: "#6E6E6E" }}>{businessName}{roleTitle && ` · ${roleTitle}`}</div>}
                  {city && state && <div style={{ fontSize: "12px", color: "#A3A3A3" }}>{city}, {state}</div>}
                  {groupName && (
                    <div style={{
                      marginTop: "5px", display: "inline-flex", alignItems: "center", gap: "4px",
                      fontSize: "11px", fontWeight: 600, color: "#FF4F1A",
                      background: "rgba(255,79,26,0.10)", padding: "2px 8px", borderRadius: "10px",
                    }}>
                      {groupName}
                    </div>
                  )}
                </div>
              </div>

              {/* Next session */}
              {nextSession ? (
                <div style={{
                  padding: "16px 18px", borderRadius: "12px",
                  border: "1px solid #E5E5E5", background: "#FFFFFF",
                  marginBottom: "16px",
                }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A3A3A3", marginBottom: "6px" }}>
                    Your first session
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#0F0F0F", marginBottom: "4px" }}>{nextSession.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13px", color: "#6E6E6E" }}>{formatSessionDate(nextSession.starts_at)}</span>
                    <span style={{
                      fontSize: "11px", fontWeight: 600, padding: "1px 7px", borderRadius: "10px",
                      background: nextSession.session_type === "office_hours" ? "#F0F0F0" : "rgba(255,79,26,0.10)",
                      color: nextSession.session_type === "office_hours" ? "#6E6E6E" : "#FF4F1A",
                    }}>
                      {SESSION_TYPE_LABELS[nextSession.session_type] ?? nextSession.session_type}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: "14px 18px", borderRadius: "12px",
                  border: "1px dashed #E5E5E5", marginBottom: "16px",
                  fontSize: "13px", color: "#6E6E6E",
                }}>
                  Your facilitator will schedule your first session soon — check back here.
                </div>
              )}

              {/* Quick links */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "24px" }}>
                {[
                  { href: "/forum", label: groupName ?? "Your Forum", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" },
                  { href: "/sessions", label: "Sessions", icon: "M4 4h16v16H4z" },
                  { href: "/resources", label: "Resources", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                      padding: "14px 10px", background: "#F7F7F6", borderRadius: "12px",
                      border: "1px solid #EEEEED", textDecoration: "none",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6E6E6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={link.icon} />
                    </svg>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#0F0F0F", textAlign: "center" }}>{link.label}</span>
                  </a>
                ))}
              </div>

              <button
                onClick={() => router.push("/")}
                style={{
                  width: "100%", padding: "14px", background: "#FF4F1A", color: "white",
                  border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700,
                  cursor: "pointer", letterSpacing: "-0.01em",
                }}
              >
                Enter Forum HQ
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
