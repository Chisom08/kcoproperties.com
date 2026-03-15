/**
 * KCO Rental Application PDF Generator (rental form)
 * Ported from kco-rental-app-v3.4.0. Produces a multi-page PDF that matches the
 * Sheketa Holmes example layout:
 *   - KCO logo centered at top
 *   - "RENTAL APPLICATION" title
 *   - Dark-teal section headers (white text)
 *   - Teal sub-section headers
 *   - Labeled field boxes
 *   - Radio-button style Yes/No indicators
 *   - Signature image embedded from URL
 *   - Page footer: "Page X of Y | KCO Rental Application Form | Property [addr] | Applying for:"
 */

import PDFDocument from "pdfkit";
import https from "https";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build an absolute URL for clickable links in PDF (opens in new tab in most viewers)
function makeAbsoluteUrl(url: string): string {
  try {
    if (/^https?:\/\//i.test(url)) return url;
    const base = process.env.PUBLIC_BASE_URL || "http://localhost:3000";
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

// ─── Colours ────────────────────────────────────────────────────────────────
const TEAL_DARK = "#1B5E7A";   // section header background
const TEAL_MID  = "#1B7A8A";   // sub-section header text
const GRAY_BORDER = "#CCCCCC"; // field box borders
const GRAY_LABEL  = "#555555"; // label text
const BLACK       = "#111111"; // value text

// ─── Page geometry ──────────────────────────────────────────────────────────
const PAGE_W  = 612;  // US Letter width  (8.5 in × 72)
const PAGE_H  = 792;  // US Letter height (11 in × 72)
const MARGIN  = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Fetch image buffer: /uploads/ from disk, else http(s) URL */
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  if (url.startsWith("/uploads/")) {
    try {
      const fileName = url.replace("/uploads/", "");
      const uploadsDir = path.join(__dirname, "uploads");
      const filePath = path.join(uploadsDir, fileName);
      return await fs.promises.readFile(filePath);
    } catch {
      return null;
    }
  }
  return new Promise((resolve) => {
    try {
      const mod = url.startsWith("https") ? https : http;
      mod.get(url, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return resolve(null);
        }
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", () => resolve(null));
      }).on("error", () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

/** Safely return value or "N/A" */
const val = (v: string | null | undefined): string =>
  v && v.trim() ? v.trim() : "N/A";

// ─── Drawing primitives ─────────────────────────────────────────────────────

function sectionHeader(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc
    .rect(MARGIN, y, CONTENT_W, 20)
    .fill(TEAL_DARK);
  doc
    .fillColor("white")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(title, MARGIN, y + 5, { width: CONTENT_W, align: "center" });
  doc.fillColor(BLACK);
  return y + 26;
}

function subHeader(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc
    .fillColor(TEAL_MID)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(title, MARGIN, y);
  doc.fillColor(BLACK);
  return y + 16;
}

/** Draw a labeled field box. */
function fieldBox(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  h = 18
): void {
  doc
    .fillColor(GRAY_LABEL)
    .font("Helvetica")
    .fontSize(8)
    .text(label, x, y, { width: w });
  const boxY = y + 10;
  doc
    .rect(x, boxY, w, h)
    .strokeColor(GRAY_BORDER)
    .lineWidth(0.5)
    .stroke();
  doc
    .fillColor(BLACK)
    .font("Helvetica")
    .fontSize(9)
    .text(value, x + 3, boxY + 4, { width: w - 6, height: h - 4, ellipsis: true });
}

/** Draw a row of field boxes from a spec array. */
function fieldRow(
  doc: PDFKit.PDFDocument,
  fields: { label: string; value: string; w: number }[],
  y: number,
  gap = 6
): number {
  let x = MARGIN;
  for (const f of fields) {
    fieldBox(doc, f.label, f.value, x, y, f.w - gap);
    x += f.w;
  }
  return y + 30;
}

/** Draw a horizontal rule */
function rule(doc: PDFKit.PDFDocument, y: number): void {
  doc
    .moveTo(MARGIN, y)
    .lineTo(MARGIN + CONTENT_W, y)
    .strokeColor(GRAY_BORDER)
    .lineWidth(0.5)
    .stroke();
}

const PAGE_OPTS = { size: "LETTER" as const, margin: MARGIN };

/** Force PDFKit to treat the new page as current by doing a minimal draw at (MARGIN, y) */
function anchorCursorToNewPage(doc: PDFKit.PDFDocument, y: number): void {
  doc.save();
  doc.fillOpacity(0);
  doc.text("\u200B", MARGIN, y, { width: 0.001 });
  doc.restore();
}

/** Ensure there is enough vertical space; add a new page if not */
function ensureSpace(
  doc: PDFKit.PDFDocument,
  y: number,
  needed: number,
  propertyAddress: string,
  pageInfo: { current: number; total: number }
): number {
  if (y + needed > PAGE_H - 50) {
    doc.addPage(PAGE_OPTS);
    pageInfo.current++;
    const newY = MARGIN + 10;
    anchorCursorToNewPage(doc, newY);
    return newY;
  }
  return y;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export interface RentalApplicationPDFData {
  applicationId: number;
  propertyAddress?: string | null;
  submittedAt?: Date | null;

  firstName?: string | null;
  lastName?: string | null;
  ssn?: string | null;
  dateOfBirth?: string | null;
  maritalStatus?: string | null;
  cellPhone?: string | null;
  workPhone?: string | null;
  email?: string | null;
  dlState?: string | null;
  dlNumber?: string | null;
  dlFrontUrl?: string | null;
  dlBackUrl?: string | null;
  incomeProofUrls?: string[] | null;

  currentStreet?: string | null;
  currentCity?: string | null;
  currentState?: string | null;
  currentZip?: string | null;
  reasonForMoving?: string | null;

  employerName?: string | null;
  employerStreet?: string | null;
  employerCity?: string | null;
  employerState?: string | null;
  employerZip?: string | null;
  position?: string | null;
  officePhone?: string | null;
  monthlyGrossPay?: string | null;
  supervisorName?: string | null;
  supervisorPhone?: string | null;
  additionalIncome?: string | null;
  employmentFrom?: string | null;
  employmentTo?: string | null;

  emergencyName?: string | null;
  emergencyRelationship?: string | null;
  emergencyPhone?: string | null;
  emergencyEmail?: string | null;
  emergencyAddress?: string | null;
  emergencyCity?: string | null;
  emergencyState?: string | null;
  emergencyZip?: string | null;

  medicalName?: string | null;
  medicalPhone?: string | null;
  medicalEmail?: string | null;
  medicalAddress?: string | null;
  medicalCity?: string | null;
  medicalZip?: string | null;

  beenSued?: string | null;
  brokenLease?: string | null;
  convictedFelony?: string | null;
  moveInAmountAvailable?: string | null;
  filedBankruptcy?: string | null;
  bankruptcyDischarged?: string | null;
  rentPlanDuration?: string | null;
  lockedOutBySheriff?: string | null;
  servedLateRentNote?: string | null;
  occupantsSmoke?: string | null;
  landlordProblems?: string | null;
  landlordProblemsExplanation?: string | null;
  additionalIncomeSource?: string | null;
  creditCheckComment?: string | null;
  petsInfo?: string | null;
  howHeardAboutHome?: string | null;

  signatureName?: string | null;
  signatureDrawUrl?: string | null;
  signatureDate?: string | null;

  paymentStatus?: string | null;
  paymentAmount?: number | null;

  coApplicants?: Array<{
    firstName?: string | null;
    lastName?: string | null;
    ssn?: string | null;
    dateOfBirth?: string | null;
    cellPhone?: string | null;
    email?: string | null;
  }>;
  vehicles?: Array<{
    make?: string | null;
    model?: string | null;
    color?: string | null;
    year?: string | null;
    licensePlate?: string | null;
  }>;
}

export async function generateRentalApplicationPDF(data: RentalApplicationPDFData): Promise<Buffer> {
  const [signatureImageBuffer, dlFrontBuffer, dlBackBuffer, incomeProofBuffers] = await Promise.all([
    data.signatureDrawUrl ? fetchImageBuffer(data.signatureDrawUrl) : Promise.resolve(null),
    data.dlFrontUrl ? fetchImageBuffer(data.dlFrontUrl) : Promise.resolve(null),
    data.dlBackUrl ? fetchImageBuffer(data.dlBackUrl) : Promise.resolve(null),
    (data.incomeProofUrls && data.incomeProofUrls.length > 0)
      ? Promise.all(data.incomeProofUrls.slice(0, 3).map((u) => fetchImageBuffer(u)))
      : Promise.resolve([] as (Buffer | null)[]),
  ]);

  const logoPath = path.join(
    process.cwd(),
    "client",
    "public",
    "kco-logo.a3f9b2e4.png"
  );
  const logoExists = fs.existsSync(logoPath);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: MARGIN, autoFirstPage: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageInfo = { current: 1, total: 15 };
    const prop = data.propertyAddress || "";

    let y = MARGIN;

    // Document image block dimensions (used for Photo ID and Proof of Income)
    const docImgH = 180;
    const docImgW = CONTENT_W;
    const docImageBlockH = 6 + 12 + docImgH + 8;
    const drawDocImage = (label: string, buffer: Buffer | null, url?: string | null) => {
      if (!buffer) return;
      y = ensureSpace(doc, y, docImageBlockH, prop, pageInfo);
      y += 6;
      doc.fillColor(GRAY_LABEL).font("Helvetica-Bold").fontSize(9).text(label, MARGIN, y);
      y += 12;
      const imgY = y;
      doc.image(buffer, MARGIN, imgY, { fit: [docImgW, docImgH] });
      if (url) {
        const linkUrl = makeAbsoluteUrl(url);
        doc.link(MARGIN, imgY, docImgW, docImgH, linkUrl);
      }
      y = imgY + docImgH + 8;
    };

    if (logoExists) {
      const logoW = 120;
      doc.image(logoPath, (PAGE_W - logoW) / 2, y, { width: logoW });
      y += 110; // logo height + space before heading
    } else {
      y += 10;
    }

    doc
      .fillColor(TEAL_DARK)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("RENTAL APPLICATION", MARGIN, y, { width: CONTENT_W, align: "center" });
    y += 22;

    doc
      .fillColor(GRAY_LABEL)
      .font("Helvetica")
      .fontSize(9)
      .text(
        "Please fill out this form COMPLETELY and sign where indicated. Valid Picture ID Required.",
        MARGIN,
        y,
        { width: CONTENT_W, align: "left" }
      );
    y += 18;

    y = sectionHeader(doc, "PERSONAL INFORMATION", y);

    const nameParts = (data.firstName || "").split(" ");
    const first = nameParts[0] || "";
    const middle = nameParts.length > 2 ? nameParts[1] : "";
    const last = data.lastName || "";

    y = fieldRow(doc, [
      { label: "First Name", value: first, w: 140 },
      { label: "Middle", value: middle, w: 80 },
      { label: "Last Name", value: last, w: 160 },
      { label: "Social Security", value: val(data.ssn), w: 152 },
    ], y);

    const ms = (data.maritalStatus || "").toLowerCase();
    const maritalDisplay =
      ms === "single" ? "Single" : ms === "married" ? "Married" : ms === "divorced" ? "Divorced" : val(data.maritalStatus);

    y = fieldRow(doc, [
      { label: "Date Of Birth", value: val(data.dateOfBirth), w: 100 },
      { label: "Marital Status", value: maritalDisplay, w: 200 },
      { label: "Driver's License", value: val(data.dlNumber), w: 150 },
      { label: "DL State", value: val(data.dlState), w: 82 },
    ], y);

    y = fieldRow(doc, [
      { label: "Cell Phone", value: val(data.cellPhone), w: 150 },
      { label: "Work Phone", value: val(data.workPhone), w: 150 },
      { label: "Email Address", value: val(data.email), w: 232 },
    ], y);

    y = subHeader(doc, "Current Residence", y);

    y = fieldRow(doc, [
      { label: "Street Address", value: val(data.currentStreet), w: 200 },
      { label: "City", value: val(data.currentCity), w: 140 },
      { label: "State", value: val(data.currentState), w: 80 },
      { label: "Zip Code", value: val(data.currentZip), w: 112 },
    ], y);

    y = fieldRow(doc, [
      { label: "Reason for Moving", value: val(data.reasonForMoving), w: CONTENT_W },
    ], y);

    y = sectionHeader(doc, "PROPOSED OCCUPANT(S)", y);

    doc
      .fillColor(GRAY_LABEL)
      .font("Helvetica-Bold")
      .fontSize(8);
    const coW = [160, 110, 130, 132];
    const coLabels = ["Name", "Birth Date", "SSN", "Relationship To Applicant"];
    let cx = MARGIN;
    coLabels.forEach((lbl, i) => {
      doc.text(lbl, cx, y, { width: coW[i] });
      cx += coW[i];
    });
    y += 12;

    const coApps = data.coApplicants || [];
    const coRows = Math.max(coApps.length, 2);
    for (let i = 0; i < coRows; i++) {
      const co = coApps[i];
      const coName = co ? `${co.firstName || ""} ${co.lastName || ""}`.trim() : "";
      const rowData = [
        { label: "", value: coName, w: coW[0] },
        { label: "", value: co?.dateOfBirth ? val(co.dateOfBirth) : "", w: coW[1] },
        { label: "", value: co?.ssn ? val(co.ssn) : "", w: coW[2] },
        { label: "", value: "", w: coW[3] },
      ];
      y = fieldRow(doc, rowData, y - 10, 4);
      y -= 2;
    }

    // Only add new page if next section (Employment) doesn't fit
    const employmentSectionHeight = 220;
    y = ensureSpace(doc, y, employmentSectionHeight, prop, pageInfo);

    y = sectionHeader(doc, "EMPLOYMENT AND INCOME", y);
    y = subHeader(doc, "Current Employment", y);

    y = fieldRow(doc, [
      { label: "Employer Name", value: val(data.employerName), w: 160 },
      { label: "Street Address", value: val(data.employerStreet), w: 160 },
      { label: "City", value: val(data.employerCity), w: 100 },
      { label: "State", value: val(data.employerState), w: 60 },
      { label: "Zip", value: val(data.employerZip), w: 52 },
    ], y);

    y = fieldRow(doc, [
      { label: "Occupation", value: val(data.position), w: 140 },
      { label: "Office Phone", value: val(data.officePhone), w: 150 },
      { label: "Monthly Gross Pay", value: val(data.monthlyGrossPay), w: 242 },
    ], y);

    y = fieldRow(doc, [
      { label: "Supervisor/Manager's Name", value: val(data.supervisorName), w: 200 },
      { label: "Phone", value: val(data.supervisorPhone), w: 150 },
      { label: "Additional Income", value: val(data.additionalIncome), w: 182 },
    ], y);

    y = fieldRow(doc, [
      { label: "Dates of Employment From", value: val(data.employmentFrom), w: 200 },
      { label: "To", value: val(data.employmentTo), w: 332 },
    ], y);

    y = ensureSpace(doc, y, 120, prop, pageInfo);
    y = sectionHeader(doc, "VEHICLES (INCLUDE VEHICLES BELONGING TO OTHER PROPOSED OCCUPANTS ALSO)", y);

    doc.fillColor(GRAY_LABEL).font("Helvetica-Bold").fontSize(8);
    const vW = [100, 100, 100, 80, 152];
    const vLabels = ["Vehicle Make", "Model", "Color", "Year", "License Plate"];
    let vx = MARGIN;
    vLabels.forEach((lbl, i) => {
      doc.text(lbl, vx, y, { width: vW[i] });
      vx += vW[i];
    });
    y += 12;

    const vehicleRows = data.vehicles && data.vehicles.length > 0 ? data.vehicles : [{}];
    for (const v of vehicleRows) {
      y = fieldRow(doc, [
        { label: "", value: val((v as { make?: string | null }).make), w: vW[0] },
        { label: "", value: val((v as { model?: string | null }).model), w: vW[1] },
        { label: "", value: val((v as { color?: string | null }).color), w: vW[2] },
        { label: "", value: val((v as { year?: string | null }).year), w: vW[3] },
        { label: "", value: val((v as { licensePlate?: string | null }).licensePlate), w: vW[4] },
      ], y - 10, 4);
      y -= 2;
    }

    y = ensureSpace(doc, y, 100, prop, pageInfo);
    y = sectionHeader(doc, "REFERENCES & EMERGENCY CONTACTS (INCLUDING HELP TO PAY RENT)", y);
    y = subHeader(doc, "Relative (Emergency Contact)", y);

    y = fieldRow(doc, [
      { label: "Name", value: val(data.emergencyName), w: 180 },
      { label: "Phone", value: val(data.emergencyPhone), w: 150 },
      { label: "Email", value: val(data.emergencyEmail), w: 202 },
    ], y);

    y = fieldRow(doc, [
      { label: "Street Address", value: val(data.emergencyAddress), w: 180 },
      { label: "City", value: val(data.emergencyCity), w: 130 },
      { label: "State", value: val(data.emergencyState), w: 80 },
      { label: "Zip Code", value: val(data.emergencyZip), w: 142 },
    ], y);

    y = fieldRow(doc, [
      { label: "Relationship", value: val(data.emergencyRelationship), w: 200 },
    ], y);

    // Only add new page if next section (Medical) doesn't fit
    const medicalSectionHeight = 100;
    y = ensureSpace(doc, y, medicalSectionHeight, prop, pageInfo);

    y = subHeader(doc, "Medical Emergency (Doctor's Contact)", y);

    y = fieldRow(doc, [
      { label: "Name", value: val(data.medicalName), w: 180 },
      { label: "Phone", value: val(data.medicalPhone), w: 150 },
      { label: "Email", value: val(data.medicalEmail), w: 202 },
    ], y);

    y = fieldRow(doc, [
      { label: "Street Address", value: val(data.medicalAddress), w: 200 },
      { label: "City", value: val(data.medicalCity), w: 150 },
      { label: "Zip Code", value: val(data.medicalZip), w: 182 },
    ], y);

    const yesNoDisplay = (v: string | null | undefined): string => {
      if (v === "yes" || v === "Yes") return "Yes";
      if (v === "no" || v === "No") return "No";
      return "";
    };

    const questions: [string, string][] = [
      ["Have you ever been sued for bills?", yesNoDisplay(data.beenSued)],
      ["Have you ever been locked out by a sheriff?", yesNoDisplay(data.lockedOutBySheriff)],
      ["Have you ever broken a lease?", yesNoDisplay(data.brokenLease)],
      ["Have you ever been served a late rent note?", yesNoDisplay(data.servedLateRentNote)],
      ["Have you ever been convicted of felony?", yesNoDisplay(data.convictedFelony)],
      ["Have you ever been served an eviction notice?", "N/A"],
      ["Is total move-in amount available now (rent/deposit)?", yesNoDisplay(data.moveInAmountAvailable)],
      ["Do you or proposed occupants smoke?", yesNoDisplay(data.occupantsSmoke)],
      ["Have you filed for bankruptcy?", yesNoDisplay(data.filedBankruptcy)],
      ["Are you on Section 8?", "N/A"],
      ["Is bankruptcy discharged? (leave blank if N/A)", yesNoDisplay(data.bankruptcyDischarged)],
      ["Number of bedrooms on voucher (Section 8 Only)", "N/A"],
      ["How long do you plan to rent this home?", val(data.rentPlanDuration)],
      ["When can you move in?", "N/A"],
    ];

    const halfLen = Math.ceil(questions.length / 2);
    const leftQ  = questions.slice(0, halfLen);
    const rightQ = questions.slice(halfLen);
    const qColW  = (CONTENT_W - 10) / 2;

    // Reserve space for section header + full questions block so we don't get a page with only the header
    const sectionHeaderHeight = 26;
    const questionsBlockHeight = halfLen * 22 + 6;
    y = ensureSpace(doc, y, sectionHeaderHeight + questionsBlockHeight, prop, pageInfo);

    y = sectionHeader(doc, "GENERAL INFORMATION", y);

    for (let i = 0; i < halfLen; i++) {
      const lq = leftQ[i];
      const rq = rightQ[i];
      const rowH = 22;

      if (lq) {
        doc.fillColor(GRAY_LABEL).font("Helvetica").fontSize(8)
          .text(lq[0], MARGIN, y, { width: qColW - 80 });
        doc.fillColor(BLACK).font("Helvetica").fontSize(9)
          .text(lq[1], MARGIN + qColW - 78, y, { width: 78 });
      }
      if (rq) {
        doc.fillColor(GRAY_LABEL).font("Helvetica").fontSize(8)
          .text(rq[0], MARGIN + qColW + 10, y, { width: qColW - 80 });
        doc.fillColor(BLACK).font("Helvetica").fontSize(9)
          .text(rq[1], MARGIN + qColW + 10 + qColW - 78, y, { width: 78 });
      }
      y += rowH;
    }

    y += 6;

    y = ensureSpace(doc, y, 200, prop, pageInfo);
    doc.fillColor(GRAY_LABEL).font("Helvetica").fontSize(8)
      .text("Have you had any reoccurring problems with your current apartment or landlord? If yes, please explain:", MARGIN, y, { width: CONTENT_W });
    y += 12;
    doc.rect(MARGIN, y, CONTENT_W, 20).strokeColor(GRAY_BORDER).lineWidth(0.5).stroke();
    doc.fillColor(BLACK).font("Helvetica").fontSize(9)
      .text(val(data.landlordProblemsExplanation), MARGIN + 3, y + 4, { width: CONTENT_W - 6, height: 14, ellipsis: true });
    y += 26;

    doc.fillColor(GRAY_LABEL).font("Helvetica").fontSize(8)
      .text("List any verifiable sources and amounts of income you wish to have considered (optional):", MARGIN, y, { width: CONTENT_W });
    y += 12;
    doc.rect(MARGIN, y, CONTENT_W, 20).strokeColor(GRAY_BORDER).lineWidth(0.5).stroke();
    doc.fillColor(BLACK).font("Helvetica").fontSize(9)
      .text(val(data.additionalIncomeSource), MARGIN + 3, y + 4, { width: CONTENT_W - 6, height: 14, ellipsis: true });
    y += 26;

    doc.fillColor(GRAY_LABEL).font("Helvetica").fontSize(8)
      .text("May we run a credit and criminal background check?", MARGIN, y, { width: CONTENT_W });
    y += 12;
    doc.fillColor(BLACK).font("Helvetica").fontSize(9)
      .text("Yes", MARGIN, y);
    y += 16;

    doc.fillColor(GRAY_LABEL).font("Helvetica").fontSize(8)
      .text("Is there anything negative we will find that you want to comment on?", MARGIN, y, { width: CONTENT_W });
    y += 12;
    doc.rect(MARGIN, y, CONTENT_W, 20).strokeColor(GRAY_BORDER).lineWidth(0.5).stroke();
    doc.fillColor(BLACK).font("Helvetica").fontSize(9)
      .text(val(data.creditCheckComment), MARGIN + 3, y + 4, { width: CONTENT_W - 6, height: 14, ellipsis: true });
    y += 26;

    y = fieldRow(doc, [
      { label: "How did you hear about this home?", value: val(data.howHeardAboutHome), w: 260 },
      { label: "How many pets do you have (list Type, Breed, approx. Weight & Age)?", value: val(data.petsInfo), w: 272 },
    ], y);

    // UPLOAD DOCUMENTS section: Front ID, Back ID, Proof of income
    const uploadSectionHeight = 26 + 3 * docImageBlockH;
    y = ensureSpace(doc, y, uploadSectionHeight, prop, pageInfo);
    y = sectionHeader(doc, "UPLOAD DOCUMENTS", y);
    drawDocImage("Front ID image", dlFrontBuffer, data.dlFrontUrl);
    drawDocImage("Back ID image", dlBackBuffer, data.dlBackUrl);
    const incomeUrls = data.incomeProofUrls || [];
    incomeProofBuffers.forEach((buf, idx) => {
      drawDocImage(`Proof of income images${incomeUrls.length > 1 ? ` (${idx + 1})` : ""}:`, buf, incomeUrls[idx]);
    });

    // Only add new page if next section (Agreement) doesn't fit
    const agreementSectionHeight = 140;
    y = ensureSpace(doc, y, agreementSectionHeight, prop, pageInfo);

    y = sectionHeader(doc, "AGREEMENT & AUTHORIZATION SIGNATURE", y);
    y += 6;

    const agreementText =
      `This agreement made this date by and between owner/manager here in after "Landlord" and ${val(data.signatureName)}, the below signed hereafter "Applicant." The Applicant shall pay to the Landlord a nonrefundable fee to cover the costs of processing the application. Applicant authorizes the Landlord, his employees, agents, or representatives to make any and all inquiries necessary to verify the information provided herein, including but not limited to direct contact with Applicant's employer, landlords, credit, neighbors, police, government agencies and any and all other sources of information which the Landlord may deem necessary and appropriate within his/her sole discretion. I authorize and permit my credit report to be obtained and further authorize the landlord or management to make future credit inquiries in regard to continued creditworthiness and for purposes of collection of unpaid rent or damages to premises, should that become necessary. I permit, upon occasion, contact with my employer to verify my employment status during my tenancy. I shall not hold the landlord or management responsible for any allergic reactions to the premises, inside or outside, from me, other occupants or guests. I shall check for allergic reactions before signing the Rental Agreement. The Applicant represents to the Landlord that the application has been completed in full and all the information provided for herein is true, accurate and complete to the best of the Applicant's knowledge and further, agrees that if any such information is not as represented, or if the application is incomplete the Applicant may, at the Landlords sole discretion, be disqualified. Landlord is not liable to the Applicant, his heirs, executors, administrators, or assigns for any damages of any kind, actual or consequential by reason of verification by the Landlord of the information provided by the Applicant, and Applicant hereby releases the Landlord, his agent, employees and representatives from any and all actions, causes of action of any kind or nature that may arise by virtue of the execution or implementation of the agreement provided herein. Landlord will attempt to contact the Applicant by the phone numbers listed on this application once approved. Applicant has 24 hours from time of approval to fulfill rental agreement by producing all monies required and signing all rental agreement papers. If Applicant fails to perform within 24 hours of Landlord's approval, Applicant may be disqualified and Landlord may rent this home to the next qualified Applicant.`;

    // Draw agreement in chunks to avoid PDFKit creating blank continuation pages
    const chunkSize = 520;
    const agreementChunks: string[] = [];
    for (let i = 0; i < agreementText.length; i += chunkSize) {
      let end = i + chunkSize;
      if (end < agreementText.length) {
        const nextSpace = agreementText.indexOf(" ", end);
        if (nextSpace !== -1 && nextSpace - i < chunkSize + 80) end = nextSpace + 1;
        else end = Math.min(end, agreementText.length);
      } else {
        end = agreementText.length;
      }
      agreementChunks.push(agreementText.slice(i, end));
    }
    doc.fillColor(BLACK).font("Helvetica").fontSize(9);
    const agreementChunkHeight = 95;
    for (const chunk of agreementChunks) {
      y = ensureSpace(doc, y, agreementChunkHeight, prop, pageInfo);
      doc.text(chunk, MARGIN, y, {
        width: CONTENT_W,
        align: "justify",
        height: agreementChunkHeight,
      });
      y = doc.y + 8;
    }
    y += 6;

    y = ensureSpace(doc, y, 200, prop, pageInfo);
    const standards = [
      "Our required standards for qualifying to rent a home are simple and fair. They are:",
      "All homes are offered without regard to race, color, religion, national origin, sex, disability or familial status.",
      ". Each adult occupant must submit an application.",
      ". A favorable credit history.",
      ". Your gross monthly income must equal approximately three times or more the monthly rent.",
      ". Be employed and be able to furnish acceptable proof of the required income.",
      ". Good references, housekeeping, and property maintenance from your previous Landlords.",
      ". Limit the number occupants to 2 per bedroom.",
      ". Compensating Factors can include additional requirements such as double deposit or rent paid in advance for applicants who fall short of above criteria",
    ];

    for (const line of standards) {
      doc.fillColor(BLACK).font("Helvetica").fontSize(9)
        .text(line, MARGIN, y, { width: CONTENT_W });
      y += 13;
    }

    y += 8;

    doc
      .fillColor(BLACK)
      .font("Helvetica-Oblique")
      .fontSize(12)
      .text("The Applicant authorizes release of all information to manager/landlord.", MARGIN, y, {
        width: CONTENT_W,
        align: "center",
      });
    y += 24;

    y = ensureSpace(doc, y, 90, prop, pageInfo);
    doc.fillColor(GRAY_LABEL).font("Helvetica").fontSize(8).text("Applicant Signature:", MARGIN, y);
    y += 12;

    if (signatureImageBuffer) {
      try {
        doc.image(signatureImageBuffer, MARGIN, y, { width: 160, height: 50 });
        doc.rect(MARGIN, y, 160, 50).strokeColor(GRAY_BORDER).lineWidth(0.5).stroke();
      } catch {
        doc.rect(MARGIN, y, 160, 50).strokeColor(GRAY_BORDER).lineWidth(0.5).stroke();
        doc.fillColor(BLACK).font("Helvetica").fontSize(10)
          .text(val(data.signatureName), MARGIN + 4, y + 16, { width: 152 });
      }
    } else if (data.signatureName) {
      doc.rect(MARGIN, y, 160, 50).strokeColor(GRAY_BORDER).lineWidth(0.5).stroke();
      doc.fillColor(BLACK).font("Helvetica-Oblique").fontSize(14)
        .text(val(data.signatureName), MARGIN + 4, y + 16, { width: 152 });
    } else {
      doc.rect(MARGIN, y, 160, 50).strokeColor(GRAY_BORDER).lineWidth(0.5).stroke();
    }

    fieldBox(doc, "Date:", val(data.signatureDate), MARGIN + 200, y + 10, 140);

    doc.end();
  });
}
