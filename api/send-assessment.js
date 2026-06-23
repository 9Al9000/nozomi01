const { Resend } = require('resend');

const INTERNAL_EMAIL = process.env.NOZOMY_INTERNAL_EMAIL || 'info@nozomy.ai';
const FROM_EMAIL = process.env.NOZOMY_FROM_EMAIL || 'Nozomy <info@nozomy.ai>';

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function required(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
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

  if (score >= 80) {
    return `Based on your responses, your organization appears to have strong foundations in ${strength}. The main opportunity appears to be improving ${opportunity} as the organization scales.`;
  }

  if (score >= 61) {
    return `Based on your responses, your organization appears to have a workable foundation in ${strength}. The main opportunity appears to be strengthening ${opportunity} before larger transformation investments.`;
  }

  return `Based on your responses, your organization may benefit from validating ${strength} while addressing the primary opportunity around ${opportunity}.`;
}

function buildInternalEmail(data) {
  const dimensions = Array.isArray(data.dimensionAverages) ? data.dimensionAverages : [];
  const answers = Array.isArray(data.answers) ? data.answers : [];

  return `
    <div style="font-family:Arial,sans-serif;color:#1A1A1A;line-height:1.6;max-width:760px;">
      <h2 style="color:#0B1320;">New Nozomy 360 Assessment</h2>
      <table style="border-collapse:collapse;width:100%;margin:18px 0;">
        ${[
          ['Full name', data.fullName],
          ['Organization', data.organization],
          ['Role', data.role],
          ['Email', data.email],
          ['Review call requested', data.reviewCallRequested || 'No'],
          ['Preliminary operating score', `${data.score}/100`],
          ['Readiness level', data.readinessLevel],
          ['Top strength', data.topStrength],
          ['Lowest dimension / primary opportunity', data.lowestDimension || data.primaryOpportunity],
          ['Likely pain pattern', data.likelyPainPattern],
          ['Recommended next step', data.recommendedNextStep],
          ['Validation focus', data.validationFocus],
          ['Submission source', data.submissionSource || 'Nozomy.ai homepage assessment form'],
        ].map(([label, value]) => `
          <tr>
            <td style="border:1px solid #E2E4E7;padding:8px 10px;background:#F7F7F5;font-weight:700;width:34%;">${escapeHtml(label)}</td>
            <td style="border:1px solid #E2E4E7;padding:8px 10px;">${escapeHtml(value || 'Not provided')}</td>
          </tr>
        `).join('')}
      </table>

      <h3 style="color:#0B1320;">Dimension averages</h3>
      <ul>
        ${dimensions.map((item) => `<li>${escapeHtml(item.label)}: ${escapeHtml(item.average)}/5</li>`).join('')}
      </ul>

      <h3 style="color:#0B1320;">All 24 answers</h3>
      <ol>
        ${answers.map((item) => `<li><strong>${escapeHtml(item.dimension)}:</strong> ${escapeHtml(item.question)} — ${escapeHtml(item.answer)}/5</li>`).join('')}
      </ol>

      <p style="font-size:12px;color:#6B7280;border-top:1px solid #E2E4E7;padding-top:12px;">
        Disclaimer: This result is based on self-reported responses and should be treated as a preliminary operating signal. The Diagnostic Blueprint validates findings through interviews, workflow review, metrics review, document review, and operating evidence.
      </p>
    </div>
  `;
}

function buildCustomerEmail(data) {
  const opportunity = getCustomerOpportunity(data);
  const explanation = getCustomerExplanation(data);

  return `
    <div style="margin:0;padding:0;background:#F7F7F5;font-family:Inter,Arial,sans-serif;color:#374151;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;">
        <div style="background:#0B1320;padding:32px 40px 28px;border-bottom:2px solid #D4AF37;">
          <div style="font-family:Arial,sans-serif;font-size:22px;font-weight:800;color:#ffffff;">Nozomy</div>
          <div style="font-size:10px;font-weight:600;color:#C8A15A;letter-spacing:0.14em;text-transform:uppercase;margin-top:4px;">Assessment-first transformation firm</div>
        </div>
        <div style="padding:36px 40px;">
          <p style="font-size:15px;line-height:1.75;margin:0 0 18px;">Hi ${escapeHtml(data.fullName)},</p>
          <p style="font-size:15px;line-height:1.75;margin:0 0 22px;">Thank you for completing the Nozomy 360 Preliminary Operating Assessment for <strong style="color:#0B1320;">${escapeHtml(data.organization)}</strong>.</p>
          <p style="font-size:15px;line-height:1.75;margin:0 0 26px;">Your preliminary operating score is <strong style="color:#0B1320;">${escapeHtml(data.score)}/100</strong>, which indicates a <strong style="color:#0B1320;">${escapeHtml(data.readinessLevel)}</strong> operating profile.</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
            <tr><td style="padding:11px 14px;background:#F7F7F5;border:1px solid #E2E4E7;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;width:42%;">Readiness Level</td><td style="padding:11px 14px;border:1px solid #E2E4E7;font-size:14px;font-weight:600;color:#1A1A1A;">${escapeHtml(data.readinessLevel)}</td></tr>
            <tr><td style="padding:11px 14px;background:#F7F7F5;border:1px solid #E2E4E7;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;">Top Strength</td><td style="padding:11px 14px;border:1px solid #E2E4E7;font-size:14px;font-weight:600;color:#1A1A1A;">${escapeHtml(data.topStrength)}</td></tr>
            <tr><td style="padding:11px 14px;background:#F7F7F5;border:1px solid #E2E4E7;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;">Primary Opportunity</td><td style="padding:11px 14px;border:1px solid #E2E4E7;font-size:14px;font-weight:600;color:#1A1A1A;">${escapeHtml(opportunity)}</td></tr>
            <tr><td style="padding:11px 14px;background:#F7F7F5;border:1px solid #E2E4E7;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;">Recommended Next Step</td><td style="padding:11px 14px;border:1px solid #E2E4E7;font-size:14px;font-weight:600;color:#1A1A1A;">${escapeHtml(data.recommendedNextStep)}</td></tr>
          </table>
          <p style="font-size:14px;line-height:1.75;margin:0 0 24px;">${explanation}</p>
          <p style="font-size:13px;color:#6B7280;line-height:1.7;border-top:1px solid #E2E4E7;padding-top:20px;margin:0 0 18px;">This result is based on self-reported responses and should be treated as a preliminary operating signal. A Diagnostic Blueprint or Strategic Scaling Review would validate the findings through interviews, workflow review, metrics review, document review, and operating evidence.</p>
          <p style="font-size:14px;line-height:1.75;margin:0;">If you requested a review call, Nozomy will follow up within 24 hours or less.</p>
        </div>
        <div style="background:#06101C;padding:24px 40px;text-align:center;">
          <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:6px;">Nozomy.ai</div>
          <a href="mailto:info@nozomy.ai" style="color:#C8A15A;font-size:13px;text-decoration:none;">info@nozomy.ai</a>
        </div>
      </div>
    </div>
  `;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY');
    return res.status(500).json({ success: false, message: 'Email service is not configured.' });
  }

  const data = req.body || {};
  const requiredFields = ['fullName', 'organization', 'email', 'role', 'score', 'readinessLevel'];
  const missing = requiredFields.filter((field) => !required(data[field]));

  if (missing.length || !isValidEmail(data.email)) {
    return res.status(400).json({ success: false, message: 'Please check the assessment contact details.' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const internalSubject = `New Nozomy 360 Assessment — ${data.organization} — ${data.score}/100`;
    const customerSubject = `Your Nozomy 360 Preliminary Result for ${data.organization}`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: INTERNAL_EMAIL,
      reply_to: data.email,
      subject: internalSubject,
      html: buildInternalEmail(data),
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      reply_to: INTERNAL_EMAIL,
      subject: customerSubject,
      html: buildCustomerEmail(data),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend assessment email error:', error);
    return res.status(500).json({ success: false, message: 'Unable to send assessment emails right now.' });
  }
};
