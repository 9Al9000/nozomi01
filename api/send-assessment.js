const { Resend } = require('resend');

const INTERNAL_EMAIL = process.env.NOZOMY_INTERNAL_EMAIL || 'info@nozomy.ai';
const FROM_EMAIL = 'Nozomy <info@nozomy.ai>';
const CUSTOMER_REPLY_TO = 'info@nozomy.ai';

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function required(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function getScoreColor(score) {
  const n = Number(score);
  if (n >= 80) return '#22c55e';
  if (n >= 61) return '#f59e0b';
  return '#ef4444';
}

function getScoreLabel(score) {
  const n = Number(score);
  if (n >= 80) return 'Strong';
  if (n >= 61) return 'Developing';
  return 'Early Stage';
}

function getCustomerOpportunity(data) {
  if (Number(data.score) >= 80 && data.likelyPainPattern === 'Leadership Bottleneck') {
    return 'Decision rhythm and leadership cadence';
  }
  return data.primaryOpportunity || data.lowestDimension || 'Operating cadence and execution rhythm';
}

function getCustomerExplanation(data) {
  const strength = escapeHtml(data.topStrength || 'your strongest operating dimensions');
  const opportunity = escapeHtml(getCustomerOpportunity(data));
  const score = Number(data.score);
  if (score >= 80) return `Based on your responses, your organization appears to have strong foundations in ${strength}. The main opportunity appears to be improving ${opportunity} as the organization scales.`;
  if (score >= 61) return `Based on your responses, your organization appears to have a workable foundation in ${strength}. The main opportunity appears to be strengthening ${opportunity} before larger transformation investments.`;
  return `Based on your responses, your organization may benefit from validating ${strength} while addressing the primary opportunity around ${opportunity}.`;
}

function buildScoreDonut(score) {
  const n = Math.min(100, Math.max(0, Number(score)));
  const color = getScoreColor(n);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (n / 100) * circ;
  return `
    <svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <circle cx="70" cy="70" r="${r}" fill="none" stroke="#E2E4E7" stroke-width="12"/>
      <circle cx="70" cy="70" r="${r}" fill="none" stroke="${color}" stroke-width="12"
        stroke-dasharray="${dash.toFixed(2)} ${circ.toFixed(2)}"
        stroke-dashoffset="${(circ / 4).toFixed(2)}"
        stroke-linecap="round"
        transform="rotate(-90 70 70)"
        style="transform-origin:center;transform:rotate(-90deg);"/>
      <text x="70" y="64" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="800" fill="#0B1320">${n}</text>
      <text x="70" y="82" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#6B7280">/100</text>
    </svg>`;
}

function buildDimensionBars(dimensions) {
  if (!Array.isArray(dimensions) || dimensions.length === 0) return '';
  return dimensions.map(item => {
    const avg = parseFloat(item.average) || 0;
    const pct = Math.round((avg / 5) * 100);
    const color = avg >= 4 ? '#22c55e' : avg >= 3 ? '#f59e0b' : '#ef4444';
    return `
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#374151;width:46%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(item.label)}</td>
        <td style="padding:6px 0 6px 10px;width:44%;">
          <div style="background:#F3F4F6;border-radius:999px;height:7px;overflow:hidden;">
            <div style="background:${color};width:${pct}%;height:7px;border-radius:999px;"></div>
          </div>
        </td>
        <td style="padding:6px 0 6px 8px;font-size:12px;font-weight:700;color:#0B1320;width:10%;text-align:right;">${avg.toFixed(1)}</td>
      </tr>`;
  }).join('');
}

function buildInternalEmail(data) {
  const dimensions = Array.isArray(data.dimensionAverages) ? data.dimensionAverages : [];
  const answers = Array.isArray(data.answers) ? data.answers : [];
  const scoreColor = getScoreColor(data.score);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#F7F7F5;font-family:Arial,sans-serif;">
  <div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

    <div style="background:#0B1320;padding:28px 36px 24px;border-bottom:3px solid #D4AF37;">
      <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Nozomy</div>
      <div style="font-size:10px;font-weight:600;color:#C8A15A;letter-spacing:0.14em;text-transform:uppercase;margin-top:3px;">New 360 Assessment Submission</div>
    </div>

    <div style="padding:32px 36px;">
      <div style="display:flex;align-items:center;gap:24px;background:#F7F7F5;border-radius:10px;padding:20px 24px;margin-bottom:28px;border:1px solid #E2E4E7;">
        <div style="text-align:center;">
          <div style="font-size:42px;font-weight:800;color:${scoreColor};line-height:1;">${escapeHtml(String(data.score))}</div>
          <div style="font-size:11px;color:#6B7280;font-weight:600;">/100</div>
        </div>
        <div>
          <div style="font-size:16px;font-weight:700;color:#0B1320;">${escapeHtml(data.organization)}</div>
          <div style="font-size:13px;color:#374151;margin-top:2px;">${escapeHtml(data.fullName)} · ${escapeHtml(data.role)}</div>
          <div style="font-size:13px;color:#6B7280;margin-top:2px;">${escapeHtml(data.email)}</div>
          <div style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;background:${scoreColor}22;color:${scoreColor};">${escapeHtml(data.readinessLevel)}</div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        ${[
          ['Pain Pattern', data.likelyPainPattern],
          ['Top Strength', data.topStrength],
          ['Lowest Dimension', data.lowestDimension || data.primaryOpportunity],
          ['Recommended Next Step', data.recommendedNextStep],
          ['Review Call Requested', data.reviewCallRequested || 'No'],
          ['Source', data.submissionSource || 'nozomy.ai homepage'],
        ].map(([label, value]) => `
          <tr>
            <td style="border:1px solid #E2E4E7;padding:9px 12px;background:#F7F7F5;font-weight:700;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;width:36%;">${escapeHtml(label)}</td>
            <td style="border:1px solid #E2E4E7;padding:9px 12px;font-size:13px;color:#1A1A1A;">${escapeHtml(value || 'Not provided')}</td>
          </tr>`).join('')}
      </table>

      <h3 style="font-size:13px;font-weight:700;color:#0B1320;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Dimension Averages</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        ${buildDimensionBars(dimensions)}
      </table>

      <h3 style="font-size:13px;font-weight:700;color:#0B1320;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">All 24 Answers</h3>
      <ol style="margin:0;padding-left:18px;">
        ${answers.map(item => `<li style="font-size:12px;color:#374151;margin-bottom:5px;"><strong>${escapeHtml(item.dimension)}:</strong> ${escapeHtml(item.question)} — <strong style="color:#0B1320;">${escapeHtml(item.answer)}/5</strong></li>`).join('')}
      </ol>
    </div>

    <div style="background:#06101C;padding:18px 36px;text-align:center;">
      <div style="font-size:11px;color:rgba(255,255,255,0.35);">Nozomy Internal Notification · nozomy.ai</div>
    </div>
  </div>
  </body></html>`;
}

function buildCustomerEmail(data) {
  const opportunity = getCustomerOpportunity(data);
  const explanation = getCustomerExplanation(data);
  const dimensions = Array.isArray(data.dimensionAverages) ? data.dimensionAverages : [];
  const scoreColor = getScoreColor(data.score);
  const scoreLabel = getScoreLabel(data.score);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#F0F0EE;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

      <!-- Header -->
      <div style="background:#0B1320;padding:32px 40px 28px;border-bottom:3px solid #D4AF37;">
        <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Nozomy</div>
        <div style="font-size:10px;font-weight:600;color:#C8A15A;letter-spacing:0.16em;text-transform:uppercase;margin-top:4px;">Assessment-First Transformation Firm</div>
      </div>

      <!-- Score Hero -->
      <div style="background:linear-gradient(135deg,#0f1e35 0%,#1a2f4a 100%);padding:36px 40px;text-align:center;">
        <div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.14em;margin-bottom:16px;">Your Preliminary Operating Score</div>
        <div style="display:inline-block;background:rgba(255,255,255,0.06);border:2px solid ${scoreColor}44;border-radius:16px;padding:20px 36px;">
          <div style="font-size:64px;font-weight:900;color:${scoreColor};line-height:1;letter-spacing:-2px;">${escapeHtml(String(data.score))}</div>
          <div style="font-size:16px;color:rgba(255,255,255,0.4);font-weight:600;margin-top:2px;">/100</div>
          <div style="margin-top:10px;display:inline-block;padding:4px 14px;border-radius:999px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;background:${scoreColor}22;color:${scoreColor};border:1px solid ${scoreColor}44;">${scoreLabel}</div>
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:14px;">${escapeHtml(data.organization)} · ${escapeHtml(data.readinessLevel)} operating profile</div>
      </div>

      <!-- Body -->
      <div style="padding:36px 40px;">
        <p style="font-size:16px;line-height:1.7;margin:0 0 8px;color:#0B1320;font-weight:600;">Hi ${escapeHtml(data.fullName)},</p>
        <p style="font-size:15px;line-height:1.75;margin:0 0 24px;color:#374151;">Thank you for completing the Nozomy 360 Preliminary Operating Assessment. Here is your result summary.</p>

        <!-- 4-metric cards -->
        <table style="width:100%;border-collapse:separate;border-spacing:0;margin-bottom:28px;">
          ${[
            ['Top Strength', data.topStrength, '#22c55e'],
            ['Primary Opportunity', escapeHtml(opportunity), '#f59e0b'],
            ['Likely Pain Pattern', data.likelyPainPattern, '#ef4444'],
            ['Recommended Next Step', data.recommendedNextStep, '#6366f1'],
          ].map(([label, value, accent]) => `
          <tr>
            <td style="padding:0 0 8px 0;">
              <div style="border-left:3px solid ${accent};padding:11px 14px;background:#F7F7F5;border-radius:0 6px 6px 0;">
                <div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">${label}</div>
                <div style="font-size:14px;font-weight:600;color:#0B1320;">${escapeHtml(value || 'Not provided')}</div>
              </div>
            </td>
          </tr>`).join('')}
        </table>

        <!-- Dimension bars -->
        ${dimensions.length > 0 ? `
        <div style="margin-bottom:28px;">
          <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">12 Dimension Breakdown</div>
          <table style="width:100%;border-collapse:collapse;">
            ${buildDimensionBars(dimensions)}
          </table>
        </div>` : ''}

        <!-- Explanation -->
        <div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:8px;padding:16px 18px;margin-bottom:28px;">
          <div style="font-size:11px;font-weight:700;color:#0369A1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">What This Means</div>
          <p style="font-size:14px;line-height:1.75;color:#0C4A6E;margin:0;">${explanation}</p>
        </div>

        <!-- CTA -->
        <div style="text-align:center;margin-bottom:28px;">
          <a href="https://nozomy.ai/#assessment" style="display:inline-block;background:#D4AF37;color:#0B1320;font-size:14px;font-weight:800;text-decoration:none;padding:14px 32px;border-radius:6px;letter-spacing:0.04em;">Request an Assessment Review →</a>
        </div>

        <p style="font-size:12px;color:#9CA3AF;line-height:1.7;border-top:1px solid #E2E4E7;padding-top:18px;margin:0 0 12px;">This result is based on self-reported responses and should be treated as a preliminary operating signal. The Diagnostic Blueprint validates findings through interviews, workflow review, metrics review, document review, and operating evidence.</p>
        ${data.reviewCallRequested === 'Yes' ? `<p style="font-size:13px;color:#374151;margin:0;">You requested a review call — Nozomy will follow up within 24 hours or less.</p>` : ''}
      </div>

      <!-- Footer -->
      <div style="background:#06101C;padding:22px 40px;text-align:center;">
        <div style="font-size:13px;color:rgba(255,255,255,0.35);margin-bottom:6px;">Nozomy.ai</div>
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
    return res.status(500).json({ success: false, message: 'Email service is not configured.' });
  }

  const data = req.body || {};
  const requiredFields = ['fullName', 'organization', 'email', 'role', 'score', 'readinessLevel'];
  const missing = requiredFields.filter(f => !required(data[f]));
  if (missing.length || !isValidEmail(data.email)) {
    return res.status(400).json({ success: false, message: 'Please check the assessment contact details.' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: INTERNAL_EMAIL,
      reply_to: data.email,
      subject: `New Nozomy 360 Assessment — ${data.organization} — ${data.score}/100`,
      html: buildInternalEmail(data),
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      reply_to: CUSTOMER_REPLY_TO,
      subject: `Your Nozomy 360 Preliminary Result — ${data.organization}`,
      html: buildCustomerEmail(data),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend assessment email error:', error);
    return res.status(500).json({ success: false, message: 'Unable to send assessment emails right now.' });
  }
};
