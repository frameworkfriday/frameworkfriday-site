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
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0, 0, 400, 400
  );
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9));
}

function formatSessionDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  forum_session: "Forum Session",
  office_hours: "Office Hours",
  ad_hoc: "Ad Hoc",
};

// Step 0 = Welcome, 1 = Details, 2 = Photo, 3 = Visibility, 4 = Notifications, 5 = All Set
const STEP_LABELS = ["Welcome", "Your Details", "Profile Photo", "Your Visibility", "Notifications", "All Set"];
// Steps 0 and 5 are non-form bookends — hide the indicator numbers differently
const FORM_STEPS = [1, 2, 3, 4]; // steps with user input

export default function OnboardingClient({ userId, email, initialProfile, groupName, memberCount, nextSession }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Details (step 1)
  const [firstName, setFirstName] = useState(initialProfile.firstName);
  const [lastName, setLastName] = useState(initialProfile.lastName);
  const [businessName, setBusinessName] = useState(initialProfile.businessName);
  const [roleTitle, setRoleTitle] = useState(initialProfile.roleTitle);
  const [linkedinUrl, setLinkedinUrl] = useState(initialProfile.linkedinUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initialProfile.websiteUrl ?? "");

  // Photo (step 2)
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // Visibility (step 3)
  const [communityVisible, setCommunityVisible] = useState(true);

  // Notifications (step 4)
  const [emailAnnouncements, setEmailAnnouncements] = useState(true);
  const [emailDirectMentions, setEmailDirectMentions] = useState(true);
  const [emailCommentReplies, setEmailCommentReplies] = useState(true);
  const [emailNewEvents, setEmailNewEvents] = useState(true);
  const [emailGroupPosts, setEmailGroupPosts] = useState(false);
  const [inAppGroupPosts, setInAppGroupPosts] = useState(true);

  const [saving, setSaving] = useState(false);

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
      const { error } = await supabase.storage.from("avatars").upload(path, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (!error) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        setAvatarUrl(data.publicUrl);
        if (andAdvance) setStep(3);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.set("first_name", firstName);
    fd.set("last_name", lastName);
    fd.set("business_name", businessName);
    fd.set("role_title", roleTitle);
    fd.set("community_visible", String(communityVisible));
    fd.set("avatar_url", avatarUrl);
    fd.set("linkedin_url", linkedinUrl);
    fd.set("website_url", websiteUrl);
    fd.set("email_announcements", String(emailAnnouncements));
    fd.set("email_direct_mentions", String(emailDirectMentions));
    fd.set("email_comment_replies", String(emailCommentReplies));
    fd.set("email_new_events", String(emailNewEvents));
    fd.set("email_group_posts", String(emailGroupPosts));
    fd.set("in_app_group_posts", String(inAppGroupPosts));
    await saveProfile(fd);
    setSaving(false);
    setStep(5);
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #E5E5E5",
    borderRadius: "8px",
    fontFamily: "inherit",
    color: "#0F0F0F",
    background: "#FFFFFF",
    boxSizing: "border-box" as const,
    outline: "none",
  };

  const labelStyle = {
    fontSize: "12px",
    fontWeight: 600,
    color: "#6E6E6E",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "6px",
    display: "block",
  };

  // Show progress only for form steps
  const showProgress = step >= 1 && step <= 4;
  const progressStep = step - 1; // 0-indexed within form steps

  const initials = [firstName, lastName]
    .map((n) => n?.[0] ?? "")
    .join("")
    .toUpperCase() || email[0]?.toUpperCase() || "?";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F7F7F6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "520px" }}>
        {/* Logo mark */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#FF4F1A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H8l-4 4V6c0-1.1.9-2 2-2z" fill="white" />
            </svg>
          </div>
        </div>

        {/* Step progress — only shown during form steps 1-3 */}
        {showProgress && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginBottom: "28px" }}>
            {FORM_STEPS.map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: i === progressStep ? "#FF4F1A" : i < progressStep ? "#0F0F0F" : "#E5E5E5",
                    color: i <= progressStep ? "white" : "#A3A3A3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: 700,
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  {i < progressStep ? (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : i + 1}
                </div>
                <span style={{ fontSize: "12px", fontWeight: i === progressStep ? 600 : 400, color: i === progressStep ? "#0F0F0F" : "#A3A3A3" }}>
                  {STEP_LABELS[i + 1]}
                </span>
                {i < FORM_STEPS.length - 1 && (
                  <div style={{ width: "20px", height: "1px", background: "#E5E5E5", margin: "0 2px" }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div className="card" style={{ padding: "32px" }}>

          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <div>
              {/* Group badge */}
              {groupName && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    background: "rgba(255,79,26,0.10)",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#FF4F1A",
                    marginBottom: "16px",
                    letterSpacing: "0.02em",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {groupName}
                </div>
              )}

              <h2 style={{ fontWeight: 800, fontSize: "26px", color: "#0F0F0F", margin: "0 0 10px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                Welcome to Framework Friday{groupName ? `,\n${groupName}` : ""}
              </h2>
              <p style={{ fontSize: "15px", color: "#6E6E6E", margin: "0 0 24px", lineHeight: 1.6 }}>
                A private peer group for operators to make better decisions, together. Forum HQ is your home base — your group, your sessions, and the tools to get the most out of your membership.
              </p>

              {/* Social proof strip */}
              {memberCount && memberCount > 1 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "14px 16px",
                    background: "#F7F7F6",
                    borderRadius: "10px",
                    marginBottom: "24px",
                  }}
                >
                  {/* Stacked avatar placeholders */}
                  <div style={{ display: "flex" }}>
                    {Array.from({ length: Math.min(memberCount - 1, 4) }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: `hsl(${i * 40 + 200}, 20%, ${75 + i * 3}%)`,
                          border: "2px solid #FFFFFF",
                          marginLeft: i === 0 ? 0 : "-8px",
                          zIndex: 4 - i,
                          position: "relative",
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: "13px", color: "#6E6E6E", lineHeight: 1.4 }}>
                    You&rsquo;ve been placed with{" "}
                    <strong style={{ color: "#0F0F0F" }}>
                      {memberCount - 1} other {memberCount - 1 === 1 ? "member" : "members"}
                    </strong>{" "}
                    {groupName ? `in ${groupName}` : "in your group"}
                  </span>
                </div>
              )}

              {/* What you'll set up */}
              <div style={{ marginBottom: "28px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A3A3A3", marginBottom: "10px" }}>
                  Profile setup takes about 2 minutes
                </div>
                {[
                  { icon: "👤", text: "Confirm your name and business" },
                  { icon: "📸", text: "Add a profile photo so your group knows you" },
                  { icon: "🔒", text: "Set your community visibility" },
                  { icon: "🔔", text: "Choose your notification preferences" },
                ].map((item) => (
                  <div key={item.text} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "16px", width: "22px", textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: "13px", color: "#6E6E6E" }}>{item.text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: "#FF4F1A",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                }}
              >
                Set up my profile →
              </button>
            </div>
          )}

          {/* ── Step 1: Details ── */}
          {step === 1 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "22px", color: "#0F0F0F", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                Confirm your details
              </h2>
              <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "0 0 24px" }}>
                These details will appear in your group and the community directory.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Last Name *</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>Business Name</label>
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your company or practice" style={inputStyle} />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>Role / Title</label>
                <input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="e.g. Founder & CEO" style={inputStyle} />
              </div>

              {/* Social links — optional */}
              <div style={{ borderTop: "1px solid #EEEEED", paddingTop: "16px", marginBottom: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A3A3A3", marginBottom: "10px" }}>
                  Social Links (optional)
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={labelStyle}>LinkedIn</label>
                  <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourname" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Website</label>
                  <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yoursite.com" style={inputStyle} />
                </div>
              </div>

              <div style={{ fontSize: "12px", color: "#A3A3A3", marginBottom: "20px" }}>
                Signing in as <strong>{email}</strong>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setStep(0)}
                  style={{ padding: "12px 20px", background: "#F0F0F0", color: "#0F0F0F", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!firstName || !lastName}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: firstName && lastName ? "#FF4F1A" : "#E5E5E5",
                    color: firstName && lastName ? "white" : "#A3A3A3",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: firstName && lastName ? "pointer" : "default",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Photo ── */}
          {step === 2 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "22px", color: "#0F0F0F", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                Add a profile photo
              </h2>
              <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "0 0 24px" }}>
                Your group members will see this. It helps everyone put a face to a name before Session 1.
              </p>

              {avatarUrl ? (
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "3px solid #FF4F1A" }}
                  />
                  <div style={{ fontSize: "13px", color: "#22C55E", marginTop: "8px", fontWeight: 600 }}>Photo saved ✓</div>
                  <button
                    onClick={() => { setAvatarUrl(""); setImgSrc(""); }}
                    style={{ fontSize: "12px", color: "#6E6E6E", background: "none", border: "none", cursor: "pointer", marginTop: "4px" }}
                  >
                    Change photo
                  </button>
                </div>
              ) : imgSrc ? (
                <div style={{ marginBottom: "16px" }}>
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    circularCrop
                    style={{ maxHeight: "300px" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="Crop preview" style={{ maxHeight: "300px" }} />
                  </ReactCrop>
                  <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                    <button
                      onClick={async () => { await uploadPhoto(true); }}
                      disabled={uploading || !completedCrop}
                      style={{
                        flex: 1, padding: "10px", background: "#FF4F1A", color: "white",
                        border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
                        cursor: uploading ? "wait" : "pointer",
                      }}
                    >
                      {uploading ? "Uploading…" : "Use this photo"}
                    </button>
                    <button
                      onClick={() => { setImgSrc(""); setCrop(undefined); }}
                      style={{ padding: "10px 16px", background: "#F0F0F0", color: "#0F0F0F", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    border: "2px dashed #E5E5E5", borderRadius: "12px", padding: "32px",
                    textAlign: "center", marginBottom: "16px", cursor: "pointer",
                  }}
                  onClick={() => document.getElementById("photo-input")?.click()}
                >
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>📷</div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#0F0F0F", marginBottom: "4px" }}>Upload a photo</div>
                  <div style={{ fontSize: "13px", color: "#A3A3A3" }}>Click to browse — JPG or PNG</div>
                  <input id="photo-input" type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setStep(1)}
                  style={{ padding: "12px 20px", background: "#F0F0F0", color: "#0F0F0F", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  style={{
                    flex: 1, padding: "12px",
                    background: avatarUrl ? "#FF4F1A" : "#0F0F0F",
                    color: "white", border: "none", borderRadius: "8px",
                    fontSize: "15px", fontWeight: 700, cursor: "pointer", letterSpacing: "-0.01em",
                  }}
                >
                  {avatarUrl ? "Continue" : "Skip for now →"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Visibility ── */}
          {step === 3 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "22px", color: "#0F0F0F", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                Your visibility
              </h2>
              <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "0 0 20px" }}>
                Control who can find you in the Framework Friday community directory.
              </p>

              <div
                onClick={() => setCommunityVisible(!communityVisible)}
                style={{
                  display: "flex", gap: "14px", padding: "16px",
                  border: `2px solid ${communityVisible ? "#FF4F1A" : "#E5E5E5"}`,
                  borderRadius: "10px", cursor: "pointer",
                  background: communityVisible ? "rgba(255,79,26,0.04)" : "transparent",
                  transition: "all 0.15s", marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    width: "22px", height: "22px", minWidth: "22px", borderRadius: "6px",
                    border: `2px solid ${communityVisible ? "#FF4F1A" : "#D4D4D4"}`,
                    background: communityVisible ? "#FF4F1A" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: "1px", transition: "all 0.15s",
                  }}
                >
                  {communityVisible && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#0F0F0F", marginBottom: "3px" }}>
                    Make me visible to the entire Framework Friday community
                  </div>
                  <div style={{ fontSize: "13px", color: "#6E6E6E", lineHeight: 1.5 }}>
                    Your profile will appear in the community directory so other Forum members can find and connect with you.
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "12px 16px", background: "#F7F7F6", borderRadius: "8px",
                  fontSize: "13px", color: "#6E6E6E", lineHeight: 1.5, marginBottom: "24px",
                }}
              >
                {groupName ? (
                  <><strong style={{ color: "#0F0F0F" }}>Note:</strong> Your group (<strong>{groupName}</strong>) can always see your profile — this setting only affects the broader community directory.</>
                ) : (
                  "Your group will always be able to see your profile."
                )}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setStep(2)}
                  style={{ padding: "12px 20px", background: "#F0F0F0", color: "#0F0F0F", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  style={{
                    flex: 1, padding: "12px", background: "#FF4F1A", color: "white",
                    border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700,
                    cursor: "pointer", letterSpacing: "-0.01em",
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Notifications ── */}
          {step === 4 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "22px", color: "#0F0F0F", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                Notification preferences
              </h2>
              <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "0 0 20px", lineHeight: 1.5 }}>
                Choose how you&rsquo;d like to be notified about activity in your Forum community. You can change these anytime in your profile settings.
              </p>

              <div style={{ marginBottom: "18px" }}>
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
                  <div
                    key={item.label}
                    onClick={() => item.setter(!item.state)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "8px 0", cursor: "pointer",
                    }}
                  >
                    <div style={{
                      width: "20px", height: "20px", minWidth: "20px", borderRadius: "5px",
                      border: `2px solid ${item.state ? "#FF4F1A" : "#D4D4D4"}`,
                      background: item.state ? "#FF4F1A" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}>
                      {item.state && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize: "14px", color: "#0F0F0F" }}>{item.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A3A3A3", marginBottom: "10px" }}>
                  In-app notifications
                </div>
                <div
                  onClick={() => setInAppGroupPosts(!inAppGroupPosts)}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "8px 0", cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: "20px", height: "20px", minWidth: "20px", borderRadius: "5px",
                    border: `2px solid ${inAppGroupPosts ? "#FF4F1A" : "#D4D4D4"}`,
                    background: inAppGroupPosts ? "#FF4F1A" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}>
                    {inAppGroupPosts && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: "14px", color: "#0F0F0F" }}>Show group posts in my notification bell</span>
                </div>
                <div style={{ fontSize: "12px", color: "#A3A3A3", marginTop: "4px", marginLeft: "30px", lineHeight: 1.4 }}>
                  Announcements, mentions, replies, and new events always show up — this controls general group activity.
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setStep(3)}
                  style={{ padding: "12px 20px", background: "#F0F0F0", color: "#0F0F0F", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                >
                  Back
                </button>
                <button
                  onClick={handleSaveAndContinue}
                  disabled={saving}
                  style={{
                    flex: 1, padding: "12px", background: "#FF4F1A", color: "white",
                    border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700,
                    cursor: saving ? "wait" : "pointer", letterSpacing: "-0.01em",
                  }}
                >
                  {saving ? "Saving…" : "Finish setup →"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: All Set ── */}
          {step === 5 && (
            <div>
              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>🎉</div>
                <h2 style={{ fontWeight: 800, fontSize: "24px", color: "#0F0F0F", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                  You&rsquo;re all set, {firstName}!
                </h2>
                <p style={{ fontSize: "14px", color: "#6E6E6E", margin: 0 }}>
                  Your profile is live. Here&rsquo;s what&rsquo;s waiting for you.
                </p>
              </div>

              {/* Profile card preview */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "16px",
                  background: "#F7F7F6",
                  borderRadius: "12px",
                  marginBottom: "16px",
                  border: "1px solid #EEEEED",
                }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: "52px", height: "52px", borderRadius: "50%",
                      background: "rgba(255,79,26,0.12)", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: "18px", fontWeight: 700,
                      color: "#FF4F1A", flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: "#0F0F0F" }}>
                    {firstName} {lastName}
                  </div>
                  {businessName && <div style={{ fontSize: "13px", color: "#6E6E6E" }}>{businessName}</div>}
                  {roleTitle && <div style={{ fontSize: "12px", color: "#A3A3A3" }}>{roleTitle}</div>}
                  {groupName && (
                    <div
                      style={{
                        marginTop: "5px",
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        fontSize: "11px", fontWeight: 600, color: "#FF4F1A",
                        background: "rgba(255,79,26,0.10)", padding: "2px 8px", borderRadius: "20px",
                      }}
                    >
                      {groupName}
                    </div>
                  )}
                </div>
              </div>

              {/* Next session */}
              {nextSession ? (
                <div
                  style={{
                    padding: "14px 16px", borderRadius: "10px",
                    border: "1px solid #E5E5E5", background: "#FFFFFF",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A3A3A3", marginBottom: "6px" }}>
                    Your next session
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#0F0F0F", marginBottom: "4px" }}>
                    {nextSession.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13px", color: "#6E6E6E" }}>
                      {formatSessionDate(nextSession.starts_at)}
                    </span>
                    <span
                      style={{
                        fontSize: "11px", fontWeight: 600, padding: "1px 7px", borderRadius: "20px",
                        background: nextSession.session_type === "office_hours" ? "#F0F0F0" : "rgba(255,79,26,0.10)",
                        color: nextSession.session_type === "office_hours" ? "#6E6E6E" : "#FF4F1A",
                      }}
                    >
                      {SESSION_TYPE_LABELS[nextSession.session_type] ?? nextSession.session_type}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "12px 16px", borderRadius: "10px",
                    border: "1px dashed #E5E5E5",
                    marginBottom: "16px", fontSize: "13px", color: "#A3A3A3",
                  }}
                >
                  📅 Your facilitator will schedule sessions soon — check back here.
                </div>
              )}

              {/* Quick start links */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "24px" }}>
                {[
                  { href: "/forum", label: groupName ?? "Your Forum", icon: "👥" },
                  { href: "/sessions", label: "Sessions", icon: "📅" },
                  { href: "/resources", label: "Resources", icon: "📄" },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      gap: "6px", padding: "14px 10px", background: "#F7F7F6",
                      borderRadius: "10px", border: "1px solid #EEEEED",
                      textDecoration: "none", transition: "background 0.15s",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>{link.icon}</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#0F0F0F", textAlign: "center" }}>
                      {link.label}
                    </span>
                  </a>
                ))}
              </div>

              <button
                onClick={() => router.push("/")}
                style={{
                  width: "100%", padding: "13px", background: "#FF4F1A", color: "white",
                  border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700,
                  cursor: "pointer", letterSpacing: "-0.01em",
                }}
              >
                Enter Forum HQ →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
