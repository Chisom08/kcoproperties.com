/**
 * Email templates for rental app feature module
 */

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface ApplicationReceiptData {
  applicationId: number;
  applicantName: string;
  applicantEmail: string;
  propertyAddress?: string | null;
  submittedAt: Date;
  paymentStatus: "paid" | "unpaid";
  paymentAmount?: number | null; // in cents
  stripePaymentIntentId?: string | null;
}

export function buildApplicationReceiptHtml(data: ApplicationReceiptData): string {
  const {
    applicationId,
    applicantName,
    propertyAddress,
    submittedAt,
    paymentStatus,
    paymentAmount,
    stripePaymentIntentId,
  } = data;

  const formattedDate = submittedAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const paymentAmountFormatted =
    paymentAmount != null
      ? `$${(paymentAmount / 100).toFixed(2)}`
      : "$50.00";

  const paymentBadge =
    paymentStatus === "paid"
      ? `<span style="display:inline-block;background:#d1fae5;color:#065f46;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;">✓ Payment Confirmed</span>`
      : `<span style="display:inline-block;background:#fef3c7;color:#92400e;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;">⏳ Payment Pending</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Received — KCO Properties</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:28px 16px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.10);">
          <tr>
            <td style="padding:32px 48px 20px 48px;border-bottom:3px solid #0099CC;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle">
                    <div style="display:inline-block;">
                      <span style="font-size:26px;font-weight:900;color:#0099CC;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">KCO</span><span style="font-size:26px;font-weight:300;color:#1f2937;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;"> PROPERTIES</span>
                      <div style="font-size:10px;font-weight:600;color:#6b7280;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">ONLINE RENTAL APPLICATION</div>
                    </div>
                  </td>
                  <td valign="middle" align="right" style="font-size:11px;color:#9ca3af;line-height:1.7;">
                    <div><a href="https://kcoproperties.com" style="color:#0099CC;text-decoration:none;">kcoproperties.com</a></div>
                    <div><a href="mailto:clientcare@kcoproperties.com" style="color:#6b7280;text-decoration:none;">clientcare@kcoproperties.com</a></div>
                    <div style="color:#6b7280;">(901) 607-1891</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 48px 0 48px;">
              <p style="color:#6b7280;font-size:13px;margin:0;">${formattedDate}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 48px 0 48px;">
              <p style="color:#1f2937;font-size:15px;margin:0 0 16px;line-height:1.6;">Dear <strong>${escapeHtml(applicantName)}</strong>,</p>
              <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 16px;">
                We are pleased to confirm that your rental application has been successfully received by KCO Properties, LLC.
                Your application is now under review and our team will contact you within <strong>2&ndash;3 business days</strong>
                with a decision.
              </p>
              <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 24px;">
                For your records, your application has been assigned reference number <strong>#${applicationId}</strong>.
                ${propertyAddress ? `The property you applied for is located at <strong>${escapeHtml(propertyAddress)}</strong>.` : ""}
                A non-refundable application and background check fee of <strong>${paymentAmountFormatted}</strong> has been collected
                to cover the cost of your TransUnion background and credit check. Please note this is a <em>soft inquiry</em>
                and will <strong>not</strong> affect your credit score.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;margin-bottom:24px;font-size:13px;">
                <tr style="background:#f9fafb;">
                  <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.5px;" colspan="2">Application &amp; Payment Summary</td>
                </tr>
                <tr>
                  <td style="padding:9px 16px;border-bottom:1px solid #f3f4f6;color:#6b7280;width:45%;">Application ID</td>
                  <td style="padding:9px 16px;border-bottom:1px solid #f3f4f6;color:#1f2937;font-weight:600;">#${applicationId}</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="padding:9px 16px;border-bottom:1px solid #f3f4f6;color:#6b7280;">Applicant</td>
                  <td style="padding:9px 16px;border-bottom:1px solid #f3f4f6;color:#1f2937;">${escapeHtml(applicantName)}</td>
                </tr>
                ${propertyAddress ? `<tr>
                  <td style="padding:9px 16px;border-bottom:1px solid #f3f4f6;color:#6b7280;">Property Applied For</td>
                  <td style="padding:9px 16px;border-bottom:1px solid #f3f4f6;color:#1f2937;">${escapeHtml(propertyAddress)}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding:9px 16px;border-bottom:1px solid #f3f4f6;color:#6b7280;">Application Fee</td>
                  <td style="padding:9px 16px;border-bottom:1px solid #f3f4f6;color:#1f2937;font-weight:600;">${paymentAmountFormatted} USD</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="padding:9px 16px;border-bottom:1px solid #f3f4f6;color:#6b7280;">Payment Status</td>
                  <td style="padding:9px 16px;border-bottom:1px solid #f3f4f6;">${paymentBadge}</td>
                </tr>
                ${stripePaymentIntentId ? `<tr>
                  <td style="padding:9px 16px;color:#6b7280;">Transaction ID</td>
                  <td style="padding:9px 16px;color:#374151;font-family:monospace;font-size:12px;">${escapeHtml(stripePaymentIntentId)}</td>
                </tr>` : ""}
              </table>
              <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 24px;">
                Should you have any questions or require further assistance, please do not hesitate to contact our
                Client Care team at <a href="mailto:clientcare@kcoproperties.com" style="color:#0099CC;text-decoration:none;">clientcare@kcoproperties.com</a>
                or by phone at <strong>(901) 607-1891</strong>.
              </p>
              <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 6px;">Sincerely yours,</p>
              <p style="color:#1f2937;font-size:14px;font-weight:700;margin:0 0 2px;">KCO Properties, LLC</p>
              <p style="color:#6b7280;font-size:13px;margin:0 0 32px;">Client Care Team</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 48px 16px;text-align:center;">
              <p style="color:#c4c4c4;font-size:10px;margin:0;">
                &copy; ${new Date().getFullYear()} KCO Properties, LLC. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildApplicationReceiptText(data: ApplicationReceiptData): string {
  const {
    applicationId,
    applicantName,
    propertyAddress,
    submittedAt,
    paymentStatus,
    paymentAmount,
    stripePaymentIntentId,
  } = data;

  const formattedDate = submittedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const paymentAmountFormatted =
    paymentAmount != null ? `$${(paymentAmount / 100).toFixed(2)}` : "$50.00";

  return `KCO PROPERTIES — APPLICATION RECEIVED
========================================

Hi ${applicantName},

We are pleased to confirm that your rental application has been successfully received by KCO Properties, LLC.

APPLICATION SUMMARY
-------------------
Application ID:     #${applicationId}
Applicant Name:     ${applicantName}
${propertyAddress ? `Property Applied:   ${propertyAddress}\n` : ""}Submitted On:       ${formattedDate}

PAYMENT RECEIPT
---------------
Description:        Application & Background Check Fee
Amount:             ${paymentAmountFormatted}
Payment Status:     ${paymentStatus === "paid" ? "CONFIRMED" : "PENDING"}
${stripePaymentIntentId ? `Transaction ID:     ${stripePaymentIntentId}\n` : ""}

WHAT HAPPENS NEXT?
------------------
1. Application Review — Our team will review your application.
2. Background Check — TransUnion will process your background check.
3. Decision — You will receive a decision within 2–3 business days.

Questions? Contact us at clientcare@kcoproperties.com | (901) 607-1891
© ${new Date().getFullYear()} KCO Properties, LLC. All rights reserved.`;
}

export interface ResumeLinkData {
  applicantName: string;
  applicantEmail: string;
  resumeUrl: string;
  applicationId: number;
}

export function buildResumeLinkHtml(data: ResumeLinkData): string {
  const { applicantName, resumeUrl, applicationId } = data;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Resume Your Application — KCO Properties</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:28px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.10);">
          <tr>
            <td style="padding:32px 48px 20px 48px;border-bottom:3px solid #0099CC;">
              <span style="font-size:24px;font-weight:900;color:#0099CC;letter-spacing:1px;">KCO</span>
              <span style="font-size:24px;font-weight:300;color:#1f2937;letter-spacing:1px;"> PROPERTIES</span>
              <div style="font-size:10px;font-weight:600;color:#6b7280;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">ONLINE RENTAL APPLICATION</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 48px;">
              <p style="color:#1f2937;font-size:15px;margin:0 0 16px;line-height:1.6;">Dear <strong>${escapeHtml(applicantName)}</strong>,</p>
              <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 20px;">
                Here is your personal resume link for your KCO Properties rental application
                <strong>(#${applicationId})</strong>. Click the button below to pick up exactly where you left off.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${resumeUrl}"
                       style="display:inline-block;background:#0099CC;color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
                      ▶ Resume My Application
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#6b7280;font-size:12px;line-height:1.6;margin:0 0 8px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="word-break:break-all;font-size:12px;color:#0099CC;margin:0 0 24px;">
                <a href="${resumeUrl}" style="color:#0099CC;">${resumeUrl}</a>
              </p>
              <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:6px;padding:12px 16px;margin-bottom:24px;">
                <p style="color:#92400e;font-size:12px;margin:0;line-height:1.6;">
                  <strong>⚠ Keep this link private.</strong> Anyone with this link can access and edit your application.
                  Do not share it with others.
                </p>
              </div>
              <p style="color:#374151;font-size:13px;line-height:1.8;margin:0 0 8px;">
                Questions? Contact us at
                <a href="mailto:clientcare@kcoproperties.com" style="color:#0099CC;text-decoration:none;">clientcare@kcoproperties.com</a>
                or <strong>(901) 607-1891</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 48px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:11px;margin:0;text-align:center;">
                © ${new Date().getFullYear()} KCO Properties, LLC — P.O. Box 752141, Memphis, TN 38175
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface AdminPaymentNotificationData {
  applicationId: number;
  applicantName: string;
  applicantEmail: string;
  propertyAddress?: string | null;
  paymentAmount: number; // in cents
  stripePaymentIntentId: string;
  paidAt: Date;
  stripeCheckoutSessionId?: string | null;
}

export function buildAdminPaymentHtml(data: AdminPaymentNotificationData): string {
  const {
    applicationId,
    applicantName,
    applicantEmail,
    propertyAddress,
    paymentAmount,
    stripePaymentIntentId,
    stripeCheckoutSessionId,
    paidAt,
  } = data;
  const formattedDate = paidAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const amountFormatted = `$${(paymentAmount / 100).toFixed(2)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Received — KCO Properties Admin</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:28px 16px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.10);">
          <tr>
            <td style="padding:32px 48px 20px 48px;border-bottom:3px solid #0099CC;">
              <div style="display:inline-block;">
                <span style="font-size:26px;font-weight:900;color:#0099CC;letter-spacing:1px;">KCO</span><span style="font-size:26px;font-weight:300;color:#1f2937;letter-spacing:1px;"> PROPERTIES</span>
                <div style="font-size:10px;font-weight:600;color:#6b7280;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">ADMIN — PAYMENT NOTIFICATION</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 48px 0 48px;">
              <p style="color:#6b7280;font-size:13px;margin:0;">${formattedDate}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 48px 0 48px;">
              <p style="color:#1f2937;font-size:15px;margin:0 0 16px;line-height:1.6;">Dear KCO Properties Team,</p>
              <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 16px;">
                This is an automated notification to inform you that a rental application fee has been
                <strong>successfully processed via Stripe</strong>. The applicant's payment has been confirmed
                and their application is now ready for review.
              </p>
              <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 24px;">
                Application reference <strong>#${applicationId}</strong> was submitted by
                <strong>${escapeHtml(applicantName)}</strong>
                (<a href="mailto:${escapeHtml(applicantEmail)}" style="color:#0099CC;text-decoration:none;">${escapeHtml(applicantEmail)}</a>).
                ${propertyAddress ? `The property applied for is <strong>${escapeHtml(propertyAddress)}</strong>.` : ""}
                A payment of <strong>${amountFormatted} USD</strong> has been collected and confirmed.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;margin-bottom:24px;font-size:13px;">
                <tr style="background:#f9fafb;">
                  <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.5px;" colspan="2">Payment &amp; Application Summary</td>
                </tr>
                <tr>
                  <td style="padding:9px 16px;border-bottom:1px solid #f3f4f6;color:#6b7280;width:45%;">Application ID</td>
                  <td style="padding:9px 16px;border-bottom:1px solid #f3f4f6;color:#1f2937;font-weight:600;">#${applicationId}</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="padding:9px 16px;border-bottom:1px solid #f3f4f6;color:#6b7280;">Applicant Name</td>
                  <td style="padding:9px 16px;border-bottom:1px solid #f3f4f6;color:#1f2937;">${escapeHtml(applicantName)}</td>
                </tr>
                <tr>
                  <td style="padding:9px 16px;border-bottom:1px solid #f3f4f6;color:#6b7280;">Amount Paid</td>
                  <td style="padding:9px 16px;border-bottom:1px solid #f3f4f6;color:#065f46;font-weight:700;font-size:15px;">${amountFormatted} USD</td>
                </tr>
                ${stripePaymentIntentId ? `<tr style="background:#fafafa;">
                  <td style="padding:9px 16px;border-bottom:${stripeCheckoutSessionId ? "1px solid #f3f4f6" : "none"};color:#6b7280;">Stripe Payment Intent</td>
                  <td style="padding:9px 16px;border-bottom:${stripeCheckoutSessionId ? "1px solid #f3f4f6" : "none"};color:#374151;font-family:monospace;font-size:12px;">${escapeHtml(stripePaymentIntentId)}</td>
                </tr>` : ""}
                ${stripeCheckoutSessionId ? `<tr>
                  <td style="padding:9px 16px;color:#6b7280;">Stripe Checkout Session</td>
                  <td style="padding:9px 16px;color:#374151;font-family:monospace;font-size:12px;">${escapeHtml(stripeCheckoutSessionId)}</td>
                </tr>` : ""}
              </table>
              <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 24px;">
                Please log in to the admin dashboard to review this application at your earliest convenience.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 48px 16px;text-align:center;">
              <p style="color:#c4c4c4;font-size:10px;margin:0;">
                &copy; ${new Date().getFullYear()} KCO Properties, LLC. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildAdminPaymentText(data: AdminPaymentNotificationData): string {
  const {
    applicationId,
    applicantName,
    applicantEmail,
    propertyAddress,
    paymentAmount,
    stripePaymentIntentId,
    stripeCheckoutSessionId,
    paidAt,
  } = data;

  const amountFormatted = `$${(paymentAmount / 100).toFixed(2)}`;
  const formattedDate = paidAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `KCO PROPERTIES — ADMIN PAYMENT NOTIFICATION
=============================================

A rental application fee has been successfully processed via Stripe.

PAYMENT SUMMARY
---------------
Amount:             ${amountFormatted} USD
Status:             PAID
Payment Date:       ${formattedDate}
${stripePaymentIntentId ? `Payment Intent ID:  ${stripePaymentIntentId}\n` : ""}${stripeCheckoutSessionId ? `Checkout Session:   ${stripeCheckoutSessionId}\n` : ""}
APPLICANT DETAILS
-----------------
Application ID:     #${applicationId}
Applicant Name:     ${applicantName}
Applicant Email:    ${applicantEmail}
${propertyAddress ? `Property Applied:   ${propertyAddress}\n` : ""}
ACTION REQUIRED
---------------
Please log in to the admin dashboard to review this application.

© ${new Date().getFullYear()} KCO Properties, LLC — Internal Admin Notification`;
}

