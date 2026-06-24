const { Resend } = require('resend');

const INTERNAL_EMAIL = process.env.NOZOMY_INTERNAL_EMAIL || 'info@nozomy.ai';
const FROM_EMAIL = 'Nozomy <info@nozomy.ai>';

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function buildInternalEmail(d) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F7F7F5;font-family:Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#0B1320;padding:24px 32px;border-bottom:3px solid #D4AF37;">
      <div style="font-size:18px;font-weight:800;color:#fff;">Nozomy</div>
      <div style="font-size:10px;color:#C8A15A;letter-spacing:0.14em;text-transform:uppercase;margin-top:3px;">New Contact Request</div>
    </div>
    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        ${[
          ['Name', d.name],
          ['Email', d.email],
          ['Organization', d.organization],
          ['Phone', d.phone || 'Not provided'],
          ['Role', d.role || 'Not provided'],
          ['Need', d.need],
          ['Message', d.message],
        ].map(([label, value]) => `
        <tr>
          <td style="border:1px solid #E2E4E7;padding:9px 12px;background:#F7F7F5;font-weight:700;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;width:30%;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="border:1px solid #E2E4E7;padding:9px 12px;font-size:13px;color:#1A1A1A;">${escapeHtml(value || '')}</td>
        </tr>`).join('')}
      </table>
    </div>
    <div style="background:#06101C;padding:16px 32px;text-align:center;">
      <div style="font-size:11px;color:rgba(255,255,255,0.35);">Nozomy Internal Notification · nozomy.ai</div>
    </div>
  </div>
  </body></html>`;
}

function buildCustomerEmail(d) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#F0F0EE;font-family:Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:28px 16px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

      <div style="background:#0B1320;padding:30px 36px 26px;border-bottom:3px solid #D4AF37;">
        <div style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.3px;">Nozomy</div>
        <div style="font-size:10px;font-weight:600;color:#C8A15A;letter-spacing:0.16em;text-transform:uppercase;margin-top:4px;">Assessment-First Transformation Firm</div>
      </div>

      <div style="padding:32px 36px;">
        <p style="font-size:16px;font-weight:600;color:#0B1320;margin:0 0 6px;">Hi ${escapeHtml(d.name)},</p>
        <p style="font-size:15px;line-height:1.75;color:#374151;margin:0 0 24px;">Thank you for reaching out to Nozomy. We have received your message and will respond within <strong style="color:#0B1320;">24 hours or less.</strong></p>

        <div style="background:#F7F7F5;border-radius:8px;padding:18px 20px;margin-bottom:24px;border:1px solid #E2E4E7;">
          <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">Your Request Summary</div>
          ${[
            ['Organization', d.organization],
            ['Primary Need', d.need],
          ].map(([label, value]) => `
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #E2E4E7;">
            <span style="font-size:12px;color:#6B7280;font-weight:600;">${escapeHtml(label)}</span>
            <span style="font-size:13px;color:#0B1320;font-weight:700;">${escapeHtml(value || '')}</span>
          </div>`).join('')}
        </div>

        <div style="background:linear-gradient(135deg,#0f1e35 0%,#1a2f4a 100%);border-radius:8px;padding:20px 22px;margin-bottom:24px;">
          <div style="font-size:12px;font-weight:700;color:#C8A15A;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">What Happens Next</div>
          <p style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.7;margin:0;">A Nozomy team member will review your request and reach out within 24 hours. If your need is urgent, you can reply directly to this email.</p>
        </div>

        <div style="text-align:center;margin-bottom:24px;">
          <a href="https://nozomy.ai/#assessment" style="display:inline-block;background:#D4AF37;color:#0B1320;font-size:13px;font-weight:800;text-decoration:none;padding:12px 28px;border-radius:6px;letter-spacing:0.04em;">Take the Free 360 Assessment →</a>
        </div>

        <p style="font-size:12px;color:#9CA3AF;line-height:1.7;border-top:1px solid #E2E4E7;padding-top:16px;margin:0;">Nozomy does not provide legal, accounting, HR compliance, software development, or regulated professional advice unless separately contracted through qualified specialists.</p>
      </div>

      <div style="background:#06101C;padding:20px 36px;text-align:center;">
        <div style="font-size:12px;color:rgba(255,255,255,0.35);margin-bottom:4px;">Nozomy.ai</div>
        <a href="mailto:info@nozomy.ai" style="color:#C8A15A;font-size:13px;text-decoration:none;">info@nozomy.ai</a>
      </div>
    </div>
  </div>
  </body></html>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  if (!process.env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY');
    return res.status(500).json({ success: false, message: 'Email service not configured.' });
  }

  const d = req.body || {};
  if (!d.name || !d.email || !d.organization || !d.need || !d.message || !isValidEmail(d.email)) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: INTERNAL_EMAIL,
      reply_to: d.email,
      subject: `New Nozomy Contact — ${d.organization} — ${d.need}`,
      html: buildInternalEmail(d),
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: d.email,
      reply_to: INTERNAL_EMAIL,
      subject: `We received your message — Nozomy`,
      html: buildCustomerEmail(d),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend contact email error:', error);
    return res.status(500).json({ success: false, message: 'Unable to send email right now.' });
  }
};
