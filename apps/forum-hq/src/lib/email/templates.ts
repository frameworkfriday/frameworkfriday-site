const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F4;padding:32px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;">
  <!-- Header -->
  <tr><td style="background:#0F0F0F;padding:20px 28px;">
    <span style="font-size:13px;font-weight:700;color:#FFFFFF;letter-spacing:0.06em;">FORUM HQ</span>
    <span style="font-size:10px;color:rgba(255,255,255,0.4);margin-left:8px;">Framework Friday</span>
  </td></tr>
  <!-- Content -->
  <tr><td style="padding:28px;">
    ${content}
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:16px 28px;border-top:1px solid #F0F0EE;">
    <p style="font-size:11px;color:#A3A3A3;margin:0;">
      <a href="${APP_URL}/profile" style="color:#A3A3A3;text-decoration:underline;">Notification settings</a>
      &nbsp;·&nbsp;
      <a href="${APP_URL}" style="color:#A3A3A3;text-decoration:underline;">Open Forum HQ</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:20px 0 8px;">
<tr><td style="background:#FF4F1A;border-radius:8px;padding:10px 24px;">
  <a href="${href}" style="color:#FFFFFF;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">${label}</a>
</td></tr>
</table>`;
}

export function newAnnouncementEmail(params: {
  groupName: string;
  title: string;
  bodyPreview: string;
  authorName: string;
  postId: string;
}): { subject: string; html: string } {
  return {
    subject: `New announcement in ${params.groupName}: ${params.title}`,
    html: baseLayout(`
      <p style="font-size:11px;font-weight:600;color:#FF4F1A;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">New Announcement</p>
      <h2 style="font-size:18px;font-weight:700;color:#0F0F0F;margin:0 0 10px;">${params.title}</h2>
      <p style="font-size:14px;color:#3D3D3D;line-height:1.7;margin:0 0 16px;">${params.bodyPreview}</p>
      <p style="font-size:12px;color:#6E6E6E;margin:0 0 4px;">Posted by ${params.authorName} in ${params.groupName}</p>
      ${ctaButton(`${APP_URL}/announcements/${params.postId}`, "View Announcement")}
    `),
  };
}

export function newCommentEmail(params: {
  postTitle: string;
  commentBody: string;
  authorName: string;
  postId: string;
}): { subject: string; html: string } {
  return {
    subject: `${params.authorName} commented on: ${params.postTitle}`,
    html: baseLayout(`
      <p style="font-size:11px;font-weight:600;color:#FF4F1A;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">New Comment</p>
      <h2 style="font-size:18px;font-weight:700;color:#0F0F0F;margin:0 0 10px;">Re: ${params.postTitle}</h2>
      <div style="border-left:3px solid #E5E5E5;padding:8px 14px;margin:0 0 16px;">
        <p style="font-size:13px;color:#3D3D3D;line-height:1.6;margin:0;">${params.commentBody}</p>
        <p style="font-size:11px;color:#A3A3A3;margin:6px 0 0;">— ${params.authorName}</p>
      </div>
      ${ctaButton(`${APP_URL}/announcements/${params.postId}`, "View Thread")}
    `),
  };
}

export function mentionEmail(params: {
  authorName: string;
  groupName: string;
  bodyPreview: string;
  postId: string;
}): { subject: string; html: string } {
  return {
    subject: `${params.authorName} mentioned you in ${params.groupName}`,
    html: baseLayout(`
      <p style="font-size:11px;font-weight:600;color:#FF4F1A;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">You Were Mentioned</p>
      <p style="font-size:14px;color:#3D3D3D;line-height:1.7;margin:0 0 16px;">${params.bodyPreview}</p>
      <p style="font-size:12px;color:#6E6E6E;margin:0 0 4px;">By ${params.authorName} in ${params.groupName}</p>
      ${ctaButton(`${APP_URL}/announcements/${params.postId}`, "View Post")}
    `),
  };
}

export function newEventEmail(params: {
  title: string;
  dateFormatted: string;
  groupName: string;
}): { subject: string; html: string } {
  return {
    subject: `New session scheduled: ${params.title}`,
    html: baseLayout(`
      <p style="font-size:11px;font-weight:600;color:#FF4F1A;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">New Session</p>
      <h2 style="font-size:18px;font-weight:700;color:#0F0F0F;margin:0 0 10px;">${params.title}</h2>
      <p style="font-size:14px;color:#3D3D3D;margin:0 0 4px;">${params.dateFormatted}</p>
      <p style="font-size:12px;color:#6E6E6E;margin:0 0 4px;">${params.groupName}</p>
      ${ctaButton(`${APP_URL}/sessions`, "View Sessions")}
    `),
  };
}

export function emailBlastTemplate(params: {
  subject: string;
  body: string;
  authorName: string;
}): { subject: string; html: string } {
  return {
    subject: params.subject,
    html: baseLayout(`
      <div style="font-size:14px;color:#3D3D3D;line-height:1.7;white-space:pre-wrap;margin:0 0 16px;">${params.body}</div>
      <p style="font-size:12px;color:#6E6E6E;margin:0;">— ${params.authorName}, Forum HQ</p>
    `),
  };
}
