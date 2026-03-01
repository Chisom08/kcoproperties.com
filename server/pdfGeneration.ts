import PDFDocument from 'pdfkit';
import * as https from 'https';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build an absolute URL for use inside the PDF (clickable links)
// - If url is already absolute (http/https), return as-is
// - If url is relative (e.g. "/uploads/..."), prefix with PUBLIC_BASE_URL or localhost
const makeAbsoluteUrl = (url: string): string => {
  try {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const base = 'http://localhost:3000';

    return new URL(url, base).toString();
  } catch {
    return url;
  }
};

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

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  // Handle locally stored uploads like "/uploads/filename.jpg" by reading from disk
  if (url.startsWith('/uploads/')) {
    try {
      const fileName = url.replace('/uploads/', '');
      const uploadsDir = path.join(__dirname, 'uploads');
      const filePath = path.join(uploadsDir, fileName);
      return await fs.promises.readFile(filePath);
    } catch {
      return null;
    }
  }

  // Fallback to fetching remote HTTPS images (e.g. Cloudinary URLs)
  return new Promise((resolve) => {
    try {
      https
        .get(url, (res) => {
          if (res.statusCode !== 200) {
            res.resume();
            return resolve(null);
          }

          const data: Uint8Array[] = [];

          res.on('data', (chunk: Uint8Array) => data.push(chunk));
          res.on('end', () => resolve(Buffer.concat(data)));
        })
        .on('error', () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

async function generateApplicationPdf(
  application: ApplicationInput,
  propertyName: string
): Promise<Buffer> {
  const logoUrl = 'https://plaxweb.com/assets/images/kco.png';
  const logoBuffer = await fetchImageBuffer(logoUrl);

  // Pre-fetch uploaded document images (if any) so PDF generation can stay synchronous
  const idDocumentBuffer = application.idDocumentUrl
    ? await fetchImageBuffer(application.idDocumentUrl)
    : null;
  const incomeProofBuffer = application.incomeProofUrl
    ? await fetchImageBuffer(application.incomeProofUrl)
    : null;

  return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
  
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));
  
      // Register fonts
      const boldFontPath = path.join(process.cwd(), 'client', 'public', 'font', 'Montserrat-Bold.ttf');
      const regularFontPath = path.join(process.cwd(), 'client', 'public', 'font', 'Montserrat-Regular.ttf');
      //const blackFontPath = path.join(process.cwd(), 'client', 'public', 'font', 'MontserratAlternates-Black.ttf');
      
      if (fs.existsSync(boldFontPath)) {
        doc.registerFont('Montserrat-Bold', boldFontPath);
      }
      if (fs.existsSync(regularFontPath)) {
        doc.registerFont('Montserrat-Regular', regularFontPath);
      }
      
      
      // Font families for different uses
      //const fontFamily = fs.existsSync(blackFontPath) ? 'MontserratAlternates-Black' : 'Helvetica-Bold'; // For headers/titles
      const labelFont = fs.existsSync(boldFontPath) ? 'Montserrat-Bold' : 'Helvetica-Bold'; // For labels
      const valueFont = fs.existsSync(regularFontPath) ? 'Montserrat-Regular' : 'Helvetica'; // For values
      const fontSize = 12; // 16px ≈ 12pt
      const footerFontSize = 10;
  
      const primaryColor = '#083A5B';
      const textColor = '#555555';
      const labelColor = '#333333';
  
      const pageWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const pageHeight = doc.page.height;
      const bottomMargin = 50; // Space reserved at bottom of page

      // Helper to parse the combined currentAddress string into components
      // Format from the form: `${street}, ${city}, ${state} ${zip}`
      const parseCurrentAddress = (
        full?: string
      ): {
        streetAddress?: string;
        city?: string;
        state?: string;
        zipCode?: string;
      } => {
        if (!full) return {};
        const parts = full.split(',').map(p => p.trim());
        const streetAddress = parts[0];
        const city = parts[1];
        let state: string | undefined;
        let zipCode: string | undefined;

        if (parts[2]) {
          const stateZipParts = parts[2].split(/\s+/).filter(Boolean);
          state = stateZipParts[0];
          zipCode = stateZipParts[1];
        }

        return { streetAddress, city, state, zipCode };
      };

      // Helper function to check if we need a new page
      const checkPageBreak = (requiredHeight: number) => {
        const currentY = doc.y;
        const availableHeight = pageHeight - currentY - bottomMargin;
        if (availableHeight < requiredHeight) {
          doc.addPage();
          // PDFKit automatically resets doc.y to top margin when addPage() is called
        }
      };

      // Header with logo and title
      if (logoBuffer) {
        // Logo width ~100px and comfortable space below
        const logoWidth = 100;
        const logoX = doc.page.margins.left + (pageWidth - logoWidth) / 2;
        const logoY = doc.y;

        doc.image(logoBuffer, logoX, logoY, { width: logoWidth });
        // Push cursor below the logo so it doesn't overlap the title text
        doc.y = logoY + 80;
      } else {
        // Fallback spacing if logo fails to load
        doc.moveDown(1.5);
      }

      // Company name + main title
      doc
        .fillColor(primaryColor)
        .font(labelFont)
        .fontSize(8)
        .text('KCO PROPERTIES, LLC.', { align: 'center' });

      doc.moveDown(0.2);

      doc
        .fillColor(labelColor)
        .font(labelFont)
        .fontSize(18)
        .text('Rental Application', { align: 'center' });

      doc.moveDown(0.4);

      doc.moveDown(1.2);

      // Divider line
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.margins.left + pageWidth, doc.y)
        .strokeColor('#dddddd')
        .stroke();

      doc.moveDown(1);

      const addSection = (title: string, body: () => void) => {
        // Check if we need a new page before adding section (reserve ~50px for section header)
        // Only break if we're very close to the bottom
        checkPageBreak(50);
        
        const left = doc.page.margins.left;
        const width = pageWidth;
        // Get current Y position after potential page break
        const currentY = doc.y;

        // Section heading bar
        doc
          .roundedRect(left, currentY + 5, width, 22, 4)
          .fillAndStroke(primaryColor, primaryColor);

    
        
        doc
          .fillColor('#ffffff')
          .font(labelFont)
          .fontSize(fontSize)
          .text(title, left + 10, currentY + 8);

        // Move cursor below section header - use moveDown for better page break handling
        doc.y = currentY + 35;
        doc.moveDown(0.2);
        doc.fillColor(textColor).fontSize(fontSize).font(valueFont);
        body();

        doc.moveDown(0.6);
      };
  
      const field = (label: string, value?: unknown) => {
        // Always show the field name, even if value is empty
        const displayValue = (value === undefined || value === null || value === '') 
          ? '' 
          : String(value);

        doc
          .fillColor(labelColor)
          .font(labelFont)
          .fontSize(fontSize)
          .text(`${label}: `, {
            continued: true,
          });

        doc
          .fillColor(textColor)
          .font(valueFont)
          .fontSize(fontSize)
          .text(displayValue || ' '); // Use space if empty to ensure cursor advances
        
        // Ensure proper spacing after each field
        doc.moveDown(0.3);
      };

      // Two-column field row: "Label1: value1      Label2: value2" on same line
      const fieldRow = (
        label1: string,
        value1?: unknown,
        label2?: string,
        value2?: unknown
      ) => {
        const left = doc.page.margins.left;
        const columnGap = 30;
        const colWidth = (pageWidth - columnGap) / 2;
        const yStart = doc.y;

        const renderColumn = (
          x: number,
          label?: string,
          value?: unknown
        ): number => {
          if (!label) return yStart;

          const displayValue =
            value === undefined || value === null || value === ''
              ? ''
              : String(value);

          doc
            .fillColor(labelColor)
            .font(labelFont)
            .fontSize(fontSize)
            .text(`${label}: `, x, doc.y, {
              continued: true,
              width: colWidth,
            });

          doc
            .fillColor(textColor)
            .font(valueFont)
            .fontSize(fontSize)
            .text(displayValue || ' ', { width: colWidth });

          return doc.y;
        };

        // Left column
        doc.y = yStart;
        const leftY = renderColumn(left, label1, value1);

        // Right column (if provided)
        let rightY = yStart;
        if (label2) {
          const rightX = left + colWidth + columnGap;
          doc.y = yStart;
          rightY = renderColumn(rightX, label2, value2);
        }

        const maxY = Math.max(leftY, rightY);
        doc.y = maxY + 6; // small spacing after the row
      };
  
      const boolField = (label: string, value?: boolean) => {
        if (value === undefined || value === null) return;
        field(label, value ? 'Yes' : 'No');
      };
  
      // Personal Information
      addSection('Personal Information', () => {
        // Match labels to the form step 1
        fieldRow('Name', application.fullName, 'Email Address', application.email);
        fieldRow('Phone Number', application.phone, 'Date of Birth', application.dateOfBirth);
        fieldRow('Last 4 Digits of SSN', application.ssnLast4);
      });
  
      // Current Residence
      addSection('Current Residence', () => {
        // Match labels to the form step 2
        const {
          streetAddress,
          city,
          state,
          zipCode,
        } = parseCurrentAddress(application.currentAddress);

        fieldRow('Street Address', streetAddress,'City', city);
        fieldRow('ZIP Code', zipCode, 'State', state);
        fieldRow('Reason for Leaving', application.reasonForLeaving);
      });
  
      // Employment & Income
      addSection('Employment & Income', () => {
        // Prefer explicit fields; fall back to parsing supervisorContact ("Name - Phone")
        const parseSupervisorContact = (contact?: string) => {
          if (!contact) return { name: undefined, phone: undefined };
          const parts = contact.split(' - ');
          return {
            name: parts[0]?.trim() || undefined,
            phone: parts[1]?.trim() || undefined,
          };
        };

        const parsed = parseSupervisorContact(application.supervisorContact);
        const supervisorName = application.supervisorName ?? parsed.name;
        const supervisorPhone = application.supervisorPhone ?? parsed.phone;

        // Match all fields from the form step 3
        fieldRow('Employer Name', application.employerName, 'Position/Title', application.position);
        fieldRow('Employer Address', application.employerAddress);
        fieldRow(
          'Length of Employment',
          application.employmentLength,
          'Monthly Gross Income',
          typeof application.monthlyIncome === 'number'
            ? `$${(application.monthlyIncome / 100).toLocaleString()}`
            : application.monthlyIncome
        );
        fieldRow('Supervisor Name', supervisorName, 'Supervisor Phone', supervisorPhone);
        fieldRow(
          'Additional Monthly Income',
          application.additionalIncome,
          'Source of Additional Income',
          application.additionalIncomeSource
        );
      });
          // Emergency Contact
      addSection('Emergency Contact & Additional Info', () => {
        fieldRow('Name', application.emergencyContactName, 'Phone Number', application.emergencyContactPhone);
        fieldRow('Relationship', application.emergencyContactRelation);
        // Use boolean values directly from form, fallback to checking if pets/vehicles strings exist
        const hasPets = application.hasPets ?? (!!application.pets && typeof application.pets === 'string' && application.pets.trim() !== '');
        const hasVehicles = application.hasVehicles ?? (!!application.vehicles && typeof application.vehicles === 'string' && application.vehicles.trim() !== '');

      const checkboxLine = (checked: boolean, label: string) => {
        const box = checked ? '[x]' : '[ ]';
        doc
          .fillColor(textColor)
          .font(labelFont)
          .fontSize(fontSize)
          .text(`${box} ${label}`);
        doc.moveDown(0.3);
      };

      // Check if we have enough space for "Additional Information" heading and both checkboxes
      // Estimate: 0.5 moveDown + heading text (~15pt) + 0.4 moveDown + checkbox1 (~15pt) + 0.3 moveDown + checkbox2 (~15pt) ≈ 60pt
      checkPageBreak(60);

      // Additional Information heading
      doc.moveDown(0.5);
      doc
        .fillColor(primaryColor)
        .font(labelFont)
        .fontSize(fontSize)
        .text('Additional Information');
      doc.moveDown(0.4);

      checkboxLine(!!hasPets, 'I have pets');
      checkboxLine(!!hasVehicles, 'I have vehicles');
      });

      // Additional Occupants
      addSection('Additional Occupants', () => {
        // Show only the value, not the label
        const displayValue = (application.additionalOccupants === undefined || application.additionalOccupants === null || application.additionalOccupants === '') 
          ? '' 
          : String(application.additionalOccupants);
        
        doc
          .fillColor(textColor)
          .font(valueFont)
          .fontSize(fontSize)
          .text(displayValue || ' ');
        
        doc.moveDown(0.3);
      });

     

      // Upload Documents
      addSection('Upload Documents', () => {
        const maxWidth = pageWidth - 40;
        const maxHeight = 220;

        const drawImageIfAvailable = (
          label: string,
          buffer: Buffer | null,
          url?: string
        ): void => {
          if (!buffer) {
            return;
          }

          checkPageBreak(maxHeight + 50);

          const x = doc.page.margins.left + 20;
          const labelY = doc.y;

          // Draw label above the image (top-left position)
          doc
            .fillColor(labelColor)
            .font(labelFont)
            .fontSize(fontSize)
            .text(label, x, labelY);

          // Move cursor down for spacing between label and image
          doc.moveDown(0.3);
          const imageY = doc.y;

          // Draw image below the label
          doc.image(buffer, x, imageY, {
            fit: [maxWidth, maxHeight],
          });

          // Add clickable link over the image if URL is provided
          // Using maxWidth and maxHeight ensures the link covers the entire image area
          if (url) {
            const linkUrl = makeAbsoluteUrl(url);
            doc.link(x, imageY, maxWidth, maxHeight, linkUrl);
          }

          // Update cursor position after image
          doc.y = imageY + maxHeight + 10;
        };

        drawImageIfAvailable('Photo ID:', idDocumentBuffer, application.idDocumentUrl);
        drawImageIfAvailable('Proof of Income:', incomeProofBuffer, application.incomeProofUrl);
      });
  
      // Consent & Authorization - always start on a new page
      doc.addPage();
      addSection('Consent & Authorization', () => {
        doc
          .fillColor(textColor)
          .font(valueFont)
          .fontSize(footerFontSize)
          .text(
            'By submitting this application, I certify that all information provided is true and complete to the best of my knowledge. I understand that false information may result in denial of my application or termination of my lease agreement.',
            { align: 'justify' }
          );

        doc.moveDown(0.4);

        doc
        .fillColor(textColor)
          .font(valueFont)
          .fontSize(footerFontSize)
          .text(
          'I authorize KCO Properties, LLC to verify the information provided and to obtain a consumer credit report and criminal background check. I understand that this is a soft inquiry and will not affect my credit score.',
          { align: 'justify' }
        );

        doc.moveDown(0.4);

        doc
        .fillColor(textColor)  
        .font(valueFont)
          .fontSize(footerFontSize)
          .text(
          'I understand that submission of this application does not guarantee approval or reservation of the property. The application will be processed in the order received, and approval is subject to verification of all information and satisfactory credit and background checks.',
          { align: 'justify' }
        );

        doc.moveDown(0.4);

        doc
          .fillColor(textColor)
          .font(valueFont)
          .fontSize(footerFontSize)
          .text(
          'I acknowledge that KCO Properties, LLC complies with all Fair Housing laws and does not discriminate based on race, color, religion, sex, national origin, familial status, or disability.',
          { align: 'justify' }
        );

        doc.moveDown(0.6);

        const consentBox = application.consentGiven ? '[x]' : '[ ]';
        doc
          .font(valueFont)
          .fontSize(12)
          .fillColor(labelColor)
          .text(
            `${consentBox} I have read and agree to the above consent and authorization. I understand that by checking this box, I am providing my electronic signature.`
          );

        doc.moveDown(0.8);

        // field(
        //   'Signature Date',
        //   application.signatureDate
        //     ? application.signatureDate.toISOString().split('T')[0]
        //     : undefined
        // );
      });
  
      // Footer - check if we need a new page for footer
      checkPageBreak(30);  
      doc.end();
    });
  }

  export default generateApplicationPdf;