import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';


import generateApplicationPdf from './pdfGeneration';
import { generateCalendarInvite, generateTourConfirmationEmail } from './calendarInvite';

// Initialize SendGrid with API key from environment (used for most emails)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn('[EmailService] SENDGRID_API_KEY not set - SendGrid-based emails will not be sent');
}

// Nodemailer SMTP config (used for application PDF email)
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'apply@kcoproperties.com';

interface TourConfirmationData {
  propertyName: string;
  propertyAddress: string;
  tourDate: string;
  tourTime: string;
  attendeeName: string;
  attendeeEmail: string;
  numberOfPeople: number;
  unitNumber?: string;
}

/**
 * Send tour confirmation email with calendar invite attachment via SendGrid
 */
export async function sendTourConfirmationEmail(data: TourConfirmationData): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('[EmailService] Cannot send email - SENDGRID_API_KEY not configured');
    return false;
  }

  try {
    const icsContent = generateCalendarInvite(data);
    const htmlContent = generateTourConfirmationEmail(data);
    
    // Format date for subject line
    const tourDate = new Date(`${data.tourDate}T${data.tourTime}`);
    const formattedDate = tourDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const subject = `Tour Confirmation - ${data.propertyName}${data.unitNumber ? ` Unit ${data.unitNumber}` : ''} on ${formattedDate}`;
    
    await sgMail.send({
      to: data.attendeeEmail,
      from: 'apply@kcoproperties.com', // Must be verified sender in SendGrid
      subject: subject,
      html: htmlContent,
      attachments: [{
        content: Buffer.from(icsContent).toString('base64'),
        filename: 'tour-invite.ics',
        type: 'text/calendar',
        disposition: 'attachment'
      }]
    });
    
    console.log('[EmailService] Tour confirmation email sent successfully to:', data.attendeeEmail);
    return true;
  } catch (error: any) {
    console.error('[EmailService] Failed to send tour confirmation email:', error);
    if (error.response) {
      console.error('[EmailService] SendGrid error details:', error.response.body);
    }
    return false;
  }
}

/**
 * Send notification to property owner about new tour booking
 */
export async function notifyOwnerOfTourBooking(data: TourConfirmationData): Promise<boolean> {
  try {
    const tourDate = new Date(`${data.tourDate}T${data.tourTime}`);
    const formattedDateTime = tourDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    const unitInfo = data.unitNumber ? ` for Unit ${data.unitNumber}` : '';
    
    const content = `
New tour scheduled${unitInfo}:

Property: ${data.propertyName}
Address: ${data.propertyAddress}
Date & Time: ${formattedDateTime}
Attendee: ${data.attendeeName}
Email: ${data.attendeeEmail}
Number of People: ${data.numberOfPeople}

Please prepare the property for showing.
    `.trim();
    
    console.log('[Owner Notification] Tour booking notification prepared');
    console.log(content);
    
    // This would integrate with your owner notification system
    return true;
  } catch (error) {
    console.error('[Owner Notification] Failed to notify owner:', error);
    return false;
  }
}

interface ApplicationInput {
  propertyId: number;
  userId?: number;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  ssnLast4?: string;
  currentAddress?: string;
  moveInDate?: string;
  moveOutDate?: string;
  reasonForLeaving?: string;
  previousLandlordName?: string;
  previousLandlordPhone?: string;
  employerName?: string;
  position?: string;
  monthlyIncome?: number;
  supervisorContact?: string;
  // Extra employment fields from the frontend form (not stored in DB)
  employerAddress?: string;
  employmentLength?: string;
  additionalIncome?: string;
  additionalIncomeSource?: string;
  supervisorName?: string;
  supervisorPhone?: string;
  additionalOccupants?: string;
  pets?: string;
  vehicles?: string;
  hasPets?: boolean;
  hasVehicles?: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  consentGiven: boolean;
  signatureData?: string;
  signatureDate?: Date;
  idDocumentUrl?: string;
  incomeProofUrl?: string;
}

export async function sendApplicationPdfEmail(
  application: ApplicationInput,
  propertyName: string
): Promise<boolean> {
  // Use Nodemailer / SMTP for this function so it can be tested independently of SendGrid
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      '[EmailService] Cannot send application PDF - SMTP_HOST/SMTP_USER/SMTP_PASS not configured'
    );
    return false;
  }

  try {
    const pdfBuffer = await generateApplicationPdf(application, propertyName);

    const subject = `New Rental Application - ${propertyName} - ${application.fullName}`;

    const html = `
      <p>You have received a new rental application.</p>
      <p><strong>Applicant:</strong> ${application.fullName}</p>
      <p><strong>Property:</strong> ${propertyName}</p>
      <p>The full application details are attached as a PDF.</p>
    `.trim();

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for port 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: SMTP_FROM,
      to: ['muaazhanif2@gmail.com'],//,'kcopropertiesllc@gmail.com','apply@plaxsys.com'
      subject,
      html,
      attachments: [
        {
          filename: 'rental-application.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log('[EmailService] Application PDF email sent via Nodemailer for', application.fullName);
    return true;
  } catch (error: any) {
    console.error('[EmailService] Failed to send application PDF email via Nodemailer:', error);
    return false;
  }
}
