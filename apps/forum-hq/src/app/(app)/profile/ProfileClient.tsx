"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { createClient } from "@/lib/supabase/client";
import { updateProfile, updateNotificationPreferences } from "./actions";

interface NotificationPrefs {
  emailAnnouncements: boolean;
  emailDirectMentions: boolean;
  emailCommentReplies: boolean;
  emailNewEvents: boolean;
  emailGroupPosts: boolean;
  inAppGroupPosts: boolean;
}

interface Props {
  userId: string;
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    businessName: string;
    roleTitle: string;
    avatarUrl: string;
    linkedinUrl: string;
    websiteUrl: string;
    communityVisible: boolean;
  };
  notificationPreferences: NotificationPrefs;
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

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: "40px",
        height: "22px",
        borderRadius: "11px",
        border: "none",
        background: on ? "#FF4F1A" : "#D4D4D4",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s ease",
        flexShrink: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "#FFFFFF",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          position: "absolute",
          top: "2px",
          left: on ? "20px" : "2px",
          transition: "left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      />
    </button>
  );
}

export default function ProfileClient({ userId, profile, notificationPreferences }: Props) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [businessName, setBusinessName] = useState(profile.businessName);
  const [roleTitle, setRoleTitle] = useState(profile.roleTitle);
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedinUrl);
  const [websiteUrl, setWebsiteUrl] = useState(profile.websiteUrl);
  const [communityVisible, setCommunityVisible] = useState(profile.communityVisible);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);

  // Photo crop state
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [uploading, setUploading] = useState(false);

  // Notification preferences
  const [emailAnnouncements, setEmailAnnouncements] = useState(notificationPreferences.emailAnnouncements);
  const [emailDirectMentions, setEmailDirectMentions] = useState(notificationPreferences.emailDirectMentions);
  const [emailCommentReplies, setEmailCommentReplies] = useState(notificationPreferences.emailCommentReplies);
  const [emailNewEvents, setEmailNewEvents] = useState(notificationPreferences.emailNewEvents);
  const [emailGroupPosts, setEmailGroupPosts] = useState(notificationPreferences.emailGroupPosts);
  const [inAppGroupPosts, setInAppGroupPosts] = useState(notificationPreferences.inAppGroupPosts);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Dirty state detection
  const isDirty = useMemo(() => {
    return (
      firstName !== profile.firstName ||
      lastName !== profile.lastName ||
      businessName !== profile.businessName ||
      roleTitle !== profile.roleTitle ||
      linkedinUrl !== profile.linkedinUrl ||
      websiteUrl !== profile.websiteUrl ||
      communityVisible !== profile.communityVisible ||
      avatarUrl !== profile.avatarUrl
    );
  }, [firstName, lastName, businessName, roleTitle, linkedinUrl, websiteUrl, communityVisible, avatarUrl, profile]);

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

  const uploadPhoto = async () => {
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
        setImgSrc("");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const fd = new FormData();
    fd.set("first_name", firstName);
    fd.set("last_name", lastName);
    fd.set("business_name", businessName);
    fd.set("role_title", roleTitle);
    fd.set("linkedin_url", linkedinUrl);
    fd.set("website_url", websiteUrl);
    fd.set("community_visible", String(communityVisible));
    fd.set("avatar_url", avatarUrl);
    await updateProfile(fd);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveNotifications = async () => {
    setNotifSaving(true);
    setNotifSaved(false);
    const fd = new FormData();
    fd.set("email_announcements", String(emailAnnouncements));
    fd.set("email_direct_mentions", String(emailDirectMentions));
    fd.set("email_comment_replies", String(emailCommentReplies));
    fd.set("email_new_events", String(emailNewEvents));
    fd.set("email_group_posts", String(emailGroupPosts));
    fd.set("in_app_group_posts", String(inAppGroupPosts));
    await updateNotificationPreferences(fd);
    setNotifSaving(false);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  };

  const initials = [firstName, lastName]
    .map((n) => n?.[0] ?? "")
    .join("")
    .toUpperCase() || profile.email[0]?.toUpperCase() || "?";

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

  const sectionHeader = (title: string) => (
    <div style={{
      fontSize: "14px", fontWeight: 700, color: "#0F0F0F",
      marginBottom: "16px", paddingBottom: "12px",
      borderBottom: "1px solid #F0F0EE",
    }}>
      {title}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px" }}>
          Account
        </div>
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "28px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
          Your Profile
        </h1>
        <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
          Manage your information, photo, and visibility settings.
        </p>
      </div>

      <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px", alignItems: "start" }}>
        {/* ── LEFT: Section Cards ── */}
        <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Photo Section */}
          <div className="card animate-fade-up" style={{ padding: "24px 28px" }}>
            {sectionHeader("Profile Photo")}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Profile"
                  style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <div
                  onClick={() => document.getElementById("profile-photo-input")?.click()}
                  style={{
                    width: "100px", height: "100px", borderRadius: "50%",
                    border: "2px dashed #D4D4D4",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "border-color 0.15s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#FF4F1A")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#D4D4D4")}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span style={{ fontSize: "10px", color: "#A3A3A3", marginTop: "4px" }}>Upload</span>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  onClick={() => document.getElementById("profile-photo-input")?.click()}
                  style={{
                    padding: "8px 16px", background: "#F0F0F0", color: "#0F0F0F",
                    border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                >
                  {avatarUrl ? "Change photo" : "Upload photo"}
                </button>
                {avatarUrl && (
                  <button
                    onClick={() => setAvatarUrl("")}
                    style={{
                      padding: "8px 16px", background: "none", color: "#A3A3A3",
                      border: "1px solid #E5E5E5", borderRadius: "8px", fontSize: "13px",
                      cursor: "pointer", transition: "border-color 0.15s",
                    }}
                  >
                    Remove photo
                  </button>
                )}
                <div style={{ fontSize: "11px", color: "#A3A3A3" }}>
                  JPG, PNG or GIF. Max 5MB.
                </div>
              </div>
              <input id="profile-photo-input" type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
            </div>

            {/* Cropper */}
            {imgSrc && (
              <div style={{ marginTop: "20px", padding: "16px", background: "#F7F7F6", borderRadius: "12px" }}>
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                  style={{ maxHeight: "280px" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="Crop preview" style={{ maxHeight: "280px" }} />
                </ReactCrop>
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button
                    onClick={uploadPhoto}
                    disabled={uploading || !completedCrop}
                    style={{
                      padding: "8px 20px", background: "#FF4F1A", color: "white",
                      border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                      cursor: uploading ? "wait" : "pointer",
                    }}
                  >
                    {uploading ? "Uploading..." : "Use this photo"}
                  </button>
                  <button
                    onClick={() => { setImgSrc(""); setCrop(undefined); }}
                    style={{
                      padding: "8px 20px", background: "#F0F0F0", color: "#0F0F0F",
                      border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Personal Details Section */}
          <div className="card animate-fade-up delay-1" style={{ padding: "24px 28px" }}>
            {sectionHeader("Personal Details")}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Email</label>
              <input value={profile.email} disabled style={{ ...inputStyle, background: "#F7F7F6", color: "#A3A3A3" }} />
              <div style={{ fontSize: "11px", color: "#A3A3A3", marginTop: "4px" }}>
                Contact your facilitator to update your email address.
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Business Name</label>
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your company or practice" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Role / Title</label>
              <input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="e.g. Founder & CEO" style={inputStyle} />
            </div>
          </div>

          {/* Social Links Section */}
          <div className="card animate-fade-up delay-2" style={{ padding: "24px 28px" }}>
            {sectionHeader("Social Links")}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>LinkedIn URL</label>
              <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourname" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Website URL</label>
              <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yoursite.com" style={inputStyle} />
            </div>
          </div>

          {/* Visibility Section */}
          <div className="card animate-fade-up delay-3" style={{ padding: "24px 28px" }}>
            {sectionHeader("Visibility")}
            <div
              onClick={() => setCommunityVisible(!communityVisible)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", border: "1px solid #EEEEED", borderRadius: "10px",
                cursor: "pointer", transition: "background 0.15s",
                background: communityVisible ? "rgba(255,79,26,0.03)" : "transparent",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "13px", color: "#0F0F0F", marginBottom: "2px" }}>
                  Show me in the community directory
                </div>
                <div style={{ fontSize: "12px", color: "#6E6E6E", lineHeight: 1.4 }}>
                  Your group can always see you. This controls visibility in the broader community directory.
                </div>
              </div>
              <ToggleSwitch on={communityVisible} onToggle={() => setCommunityVisible(!communityVisible)} />
            </div>
          </div>

          {/* Notification Settings Section */}
          <div className="card animate-fade-up delay-4" style={{ padding: "24px 28px" }}>
            {sectionHeader("Notification Settings")}
            <p style={{ fontSize: "12px", color: "#6E6E6E", margin: "0 0 18px", lineHeight: 1.4 }}>
              Control how you receive notifications about activity in your Forum community.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              {/* Email notifications */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A3A3A3", marginBottom: "12px" }}>
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
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 0", borderBottom: "1px solid #F8F8F7",
                    }}
                  >
                    <span style={{ fontSize: "13px", color: "#0F0F0F" }}>{item.label}</span>
                    <ToggleSwitch on={item.state} onToggle={() => item.setter(!item.state)} />
                  </div>
                ))}
              </div>

              {/* In-app notifications */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A3A3A3", marginBottom: "12px" }}>
                  In-app notifications
                </div>
                <div
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 0", borderBottom: "1px solid #F8F8F7",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#0F0F0F" }}>Group posts in notification bell</span>
                  <ToggleSwitch on={inAppGroupPosts} onToggle={() => setInAppGroupPosts(!inAppGroupPosts)} />
                </div>
                <div style={{ fontSize: "11px", color: "#A3A3A3", marginTop: "12px", lineHeight: 1.4 }}>
                  Announcements, mentions, comments on your posts, and new events always appear in your notification bell.
                </div>
              </div>
            </div>

            <div style={{ marginTop: "18px" }}>
              <button
                onClick={handleSaveNotifications}
                disabled={notifSaving}
                style={{
                  padding: "10px 24px",
                  background: notifSaved ? "#22C55E" : "#0F0F0F",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: notifSaving ? "wait" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {notifSaving ? "Saving..." : notifSaved ? "Saved!" : "Save notification settings"}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Sticky Preview ── */}
        <div style={{ position: "sticky", top: "32px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#6E6E6E", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
            Preview
          </div>
          <div className="card" style={{ padding: "24px" }}>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Preview" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", margin: "0 auto" }} />
              ) : (
                <div style={{
                  width: "80px", height: "80px", borderRadius: "50%",
                  background: "rgba(255,79,26,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "24px", color: "#FF4F1A", margin: "0 auto",
                }}>
                  {initials}
                </div>
              )}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "16px", color: "#0F0F0F", marginBottom: "2px" }}>
                {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Your Name"}
              </div>
              {roleTitle && <div style={{ fontSize: "13px", color: "#6E6E6E", marginBottom: "2px" }}>{roleTitle}</div>}
              {businessName && <div style={{ fontSize: "12px", color: "#A3A3A3" }}>{businessName}</div>}
            </div>

            <div style={{ margin: "14px 0", borderTop: "1px solid #F0F0EE", paddingTop: "12px" }}>
              <div style={{ fontSize: "12px", color: "#A3A3A3", marginBottom: "4px" }}>{profile.email}</div>
            </div>

            {(linkedinUrl || websiteUrl) && (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                {linkedinUrl && (
                  <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#0077B5", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                )}
                {websiteUrl && (
                  <a href={websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#FF4F1A", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Website
                  </a>
                )}
              </div>
            )}

            <div style={{ paddingTop: "10px", borderTop: "1px solid #F0F0EE", fontSize: "11px", color: communityVisible ? "#22C55E" : "#A3A3A3", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {communityVisible ? (
                  <><circle cx="12" cy="12" r="10" /><polyline points="16 8 10 16 8 13" /></>
                ) : (
                  <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>
                )}
              </svg>
              {communityVisible ? "Visible in directory" : "Hidden from directory"}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky save bar — appears when profile has unsaved changes */}
      {isDirty && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#FFFFFF",
          borderTop: "1px solid #E5E5E5",
          padding: "12px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "12px",
          zIndex: 50,
          boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
        }}>
          <span style={{ fontSize: "13px", color: "#6E6E6E", marginRight: "auto" }}>
            You have unsaved changes
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 28px",
              background: saved ? "#22C55E" : "#FF4F1A",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: saving ? "wait" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}
