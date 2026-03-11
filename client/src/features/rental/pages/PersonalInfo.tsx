import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/features/rental/components/AppLayout";
import { BotMessage } from "@/features/rental/components/OmiaBot";
import { SaveProgress } from "@/features/rental/components/SaveProgress";
import { US_STATES } from "@/lib/states";
import { formatPhone } from "@/lib/formatPhone";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Camera, Plus, ChevronRight, ChevronLeft, Upload, Lock, Eye } from "lucide-react";

interface CoApplicant {
  firstName: string;
  lastName: string;
  ssn: string;
  dateOfBirth: string;
  maritalStatus: "single" | "married" | "divorced" | "";
  cellPhone: string;
  workPhone: string;
  email: string;
  dlState: string;
  dlNumber: string;
  currentStreet: string;
  currentCity: string;
  currentState: string;
  currentZip: string;
}

const emptyCoApplicant = (): CoApplicant => ({
  firstName: "", lastName: "", ssn: "", dateOfBirth: "", maritalStatus: "",
  cellPhone: "", workPhone: "", email: "", dlState: "", dlNumber: "",
  currentStreet: "", currentCity: "", currentState: "", currentZip: "",
});

const QUESTIONS = [
  { id: "propertyAddress", label: "Okay, first things first, what property are you applying for?", type: "text", placeholder: "Property address" },
  { id: "name", label: "Got it. Now, what's your First and Last name?", type: "name" },
  { id: "ssn", label: "Thanks! And what's your Social Security number?", type: "text", placeholder: "XXX-XX-XXXX" },
  { id: "dateOfBirth", label: "And your Date of Birth?", type: "date" },
  { id: "maritalStatus", label: "Thank you! And what's your marital status?", type: "marital" },
  { id: "contact", label: "Great! Now, please type in your email and phone numbers here:", type: "contact" },
  { id: "dl", label: "Thanks, now please type in your Driver's License here. First, what state is it from?", type: "dl" },
  { id: "dlFront", label: "Great. Now, please upload the front side of your ID.", type: "upload-front" },
  { id: "dlBack", label: "Thanks! Now, please upload the back side.", type: "upload-back" },
  { id: "address", label: "Now let's get information about your current residence:", type: "address" },
  { id: "coApplicant", label: "Great! Do you have a Co-Applicant?", type: "co-applicant" },
  { id: "reasonForMoving", label: "Thank you! So, what's the reason you're moving?", type: "reason" },
];

export default function PersonalInfo() {
  const [, navigate] = useLocation();
  const applicationId = Number(localStorage.getItem("kco_app_id") || "0");

  const [currentQ, setCurrentQ] = useState(0);
  const [formData, setFormData] = useState({
    propertyAddress: "",
    firstName: "",
    lastName: "",
    ssn: "",
    dateOfBirth: "",
    maritalStatus: "" as "single" | "married" | "divorced" | "",
    cellPhone: "",
    workPhone: "",
    email: localStorage.getItem("kco_app_email") || "",
    dlState: "",
    dlNumber: "",
    dlFrontUrl: "",
    dlBackUrl: "",
    currentStreet: "",
    currentCity: "",
    currentState: "",
    currentZip: "",
    reasonForMoving: "",
  });
  const [coApplicants, setCoApplicants] = useState<CoApplicant[]>([]);
  const [hasCoApplicant, setHasCoApplicant] = useState<boolean | null>(null);
  // SSN masking: true = field is blurred and showing masked value
  const [ssnMasked, setSsnMasked] = useState(false);
  const [coApplicantStep, setCoApplicantStep] = useState(0); // 0 = main form, 1+ = co-applicant index
  const [dlFrontFile, setDlFrontFile] = useState<File | null>(null);
  const [dlBackFile, setDlBackFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const saveDraftMutation = trpc.rental.application.saveDraft.useMutation();
  const saveCoApplicantsMutation = trpc.rental.application.saveCoApplicants.useMutation();
  const uploadFileMutation = trpc.rental.upload.uploadFile.useMutation();

  // Load saved application data
  const { data: savedApplication } = trpc.rental.application.getApplication.useQuery(
    { applicationId },
    { enabled: !!applicationId, refetchOnWindowFocus: false }
  );
  const { data: savedCoApplicants = [] } = trpc.rental.application.getCoApplicants.useQuery(
    { applicationId },
    { enabled: !!applicationId, refetchOnWindowFocus: false }
  );

  const questionRef = useRef<HTMLDivElement>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!applicationId) {
      navigate("/rental/signup");
    }
  }, [applicationId]);

  // Load saved data when application data is available
  useEffect(() => {
    if (savedApplication && !dataLoaded) {
      // Restore form data from saved application
      setFormData((prev) => ({
        ...prev,
        propertyAddress: savedApplication.propertyAddress || prev.propertyAddress,
        firstName: savedApplication.firstName || prev.firstName,
        lastName: savedApplication.lastName || prev.lastName,
        ssn: savedApplication.ssn || prev.ssn,
        dateOfBirth: savedApplication.dateOfBirth || prev.dateOfBirth,
        maritalStatus: (savedApplication.maritalStatus as "single" | "married" | "divorced" | "") || prev.maritalStatus,
        cellPhone: savedApplication.cellPhone || prev.cellPhone,
        workPhone: savedApplication.workPhone || prev.workPhone,
        email: savedApplication.email || prev.email,
        dlState: savedApplication.dlState || prev.dlState,
        dlNumber: savedApplication.dlNumber || prev.dlNumber,
        dlFrontUrl: savedApplication.dlFrontUrl || prev.dlFrontUrl,
        dlBackUrl: savedApplication.dlBackUrl || prev.dlBackUrl,
        currentStreet: savedApplication.currentStreet || prev.currentStreet,
        currentCity: savedApplication.currentCity || prev.currentCity,
        currentState: savedApplication.currentState || prev.currentState,
        currentZip: savedApplication.currentZip || prev.currentZip,
        reasonForMoving: savedApplication.reasonForMoving || prev.reasonForMoving,
      }));

      // Restore co-applicants
      if (savedCoApplicants.length > 0) {
        setCoApplicants(savedCoApplicants.map((ca) => ({
          firstName: ca.firstName || "",
          lastName: ca.lastName || "",
          ssn: ca.ssn || "",
          dateOfBirth: ca.dateOfBirth || "",
          maritalStatus: (ca.maritalStatus || "") as "single" | "married" | "divorced" | "",
          cellPhone: ca.cellPhone || "",
          workPhone: ca.workPhone || "",
          email: ca.email || "",
          dlState: ca.dlState || "",
          dlNumber: ca.dlNumber || "",
          currentStreet: ca.currentStreet || "",
          currentCity: ca.currentCity || "",
          currentState: ca.currentState || "",
          currentZip: ca.currentZip || "",
        })));
        setHasCoApplicant(true);
      }

      setDataLoaded(true);
    }
  }, [savedApplication, savedCoApplicants, dataLoaded]);

  useEffect(() => {
    questionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentQ]);

  const set = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File, type: "dl-front" | "dl-back") => {
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const result = await uploadFileMutation.mutateAsync({
          applicationId,
          fileType: type,
          fileName: file.name,
          contentType: file.type,
          base64Data: base64,
        });
        if (type === "dl-front") {
          setFormData((prev) => ({ ...prev, dlFrontUrl: result.url }));
        } else {
          setFormData((prev) => ({ ...prev, dlBackUrl: result.url }));
        }
        setIsUploading(false);
        toast.success(`${type === "dl-front" ? "Front" : "Back"} of ID uploaded successfully!`);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Upload failed. Please try again.");
      setIsUploading(false);
    }
  };

  const validateCurrentQuestion = () => {
    const q = QUESTIONS[currentQ];
    switch (q.id) {
      case "propertyAddress":
        if (!formData.propertyAddress.trim()) { toast.error("Please enter the property address."); return false; }
        break;
      case "name":
        if (!formData.firstName.trim() || !formData.lastName.trim()) { toast.error("Please enter your first and last name."); return false; }
        break;
      case "ssn":
        if (!formData.ssn.trim()) { toast.error("Please enter your Social Security number."); return false; }
        break;
      case "dateOfBirth":
        if (!formData.dateOfBirth) { toast.error("Please enter your date of birth."); return false; }
        break;
      case "maritalStatus":
        if (!formData.maritalStatus) { toast.error("Please select your marital status."); return false; }
        break;
      case "contact":
        if (!formData.cellPhone.trim() || !formData.email.trim()) { toast.error("Please enter your cell phone and email."); return false; }
        break;
      case "dl":
        if (!formData.dlState || !formData.dlNumber.trim()) { toast.error("Please select your state and enter your driver's license number."); return false; }
        break;
      case "dlFront":
        if (!formData.dlFrontUrl) { toast.error("Please upload the front of your ID."); return false; }
        break;
      case "dlBack":
        if (!formData.dlBackUrl) { toast.error("Please upload the back of your ID."); return false; }
        break;
      case "address":
        if (!formData.currentStreet.trim() || !formData.currentCity.trim() || !formData.currentState || !formData.currentZip.trim()) {
          toast.error("Please complete all address fields."); return false;
        }
        break;
      case "coApplicant":
        if (hasCoApplicant === null) { toast.error("Please indicate if you have a co-applicant."); return false; }
        break;
      case "reasonForMoving":
        if (!formData.reasonForMoving) { toast.error("Please select a reason for moving."); return false; }
        break;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentQuestion()) return;

    // Auto-save
    saveDraftMutation.mutate({
      applicationId,
      step: 3,
      data: { ...formData },
    });

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      // Save co-applicants and proceed
      if (coApplicants.length > 0) {
        await saveCoApplicantsMutation.mutateAsync({
          applicationId,
          coApplicants: coApplicants.map((ca) => ({
            ...ca,
            maritalStatus: (ca.maritalStatus || undefined) as "single" | "married" | "divorced" | undefined,
          })),
        });
      }
      navigate("/rental/apply/employment");
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      setCurrentQ((prev) => prev - 1);
    } else {
      navigate("/rental/signup");
    }
  };

  const renderQuestion = () => {
    const q = QUESTIONS[currentQ];

    switch (q.id) {
      case "propertyAddress":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <input
              type="text"
              value={formData.propertyAddress}
              onChange={(e) => set("propertyAddress", e.target.value)}
              placeholder={q.placeholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mt-2 focus:outline-none"
              style={{ borderColor: formData.propertyAddress ? "#0099CC" : undefined }}
              autoFocus
            />
          </div>
        );

      case "name":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="First Name"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: formData.firstName ? "#0099CC" : undefined }}
                autoFocus
              />
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder="Last Name"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: formData.lastName ? "#0099CC" : undefined }}
              />
            </div>
          </div>
        );

      case "ssn": {
        // Build the masked display value: •••-••-XXXX
        const maskedSSN = (() => {
          const digits = formData.ssn.replace(/\D/g, "");
          if (digits.length === 0) return "";
          const last4 = digits.slice(-4).padStart(digits.length, "•");
          // Format as •••-••-XXXX (always show last 4 plain)
          const d = digits;
          if (d.length <= 3) return "•".repeat(d.length);
          if (d.length <= 5) return `${"•".repeat(3)}-${"•".repeat(d.length - 3)}`;
          return `•••-••-${d.slice(5)}`;
        })();

        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <div className="relative mt-2">
              <input
                type="text"
                inputMode={ssnMasked ? "none" : "numeric"}
                pattern="[0-9\-]*"
                autoComplete="off"
                value={ssnMasked ? maskedSSN : formData.ssn}
                onChange={(e) => {
                  if (!ssnMasked) set("ssn", e.target.value);
                }}
                onFocus={() => setSsnMasked(false)}
                onBlur={() => { if (formData.ssn) setSsnMasked(true); }}
                placeholder="XXX-XX-XXXX"
                maxLength={ssnMasked ? undefined : 11}
                readOnly={ssnMasked}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none tracking-widest"
                style={{
                  borderColor: formData.ssn ? "#0099CC" : undefined,
                  fontFamily: ssnMasked ? "monospace" : undefined,
                  letterSpacing: ssnMasked ? "0.15em" : undefined,
                }}
                autoFocus
                aria-label="Social Security Number"
              />
              {/* Lock / Eye icon on the right */}
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer select-none"
                onClick={() => setSsnMasked((prev) => !prev)}
                title={ssnMasked ? "Click to edit" : "Click to mask"}
              >
                {ssnMasked
                  ? <Lock size={15} className="text-gray-400" />
                  : <Eye size={15} className="text-gray-400" />}
              </span>
            </div>
            {ssnMasked ? (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#0099CC" }}>
                <Lock size={11} /> Secured — click the field to edit
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Your SSN is encrypted and securely stored.</p>
            )}
          </div>
        );
      }

      case "dateOfBirth":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mt-2 focus:outline-none"
              style={{ borderColor: formData.dateOfBirth ? "#0099CC" : undefined }}
              autoFocus
            />
          </div>
        );

      case "maritalStatus":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <div className="flex gap-4 mt-3">
              {(["single", "married", "divorced"] as const).map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="maritalStatus"
                    value={status}
                    checked={formData.maritalStatus === status}
                    onChange={() => set("maritalStatus", status)}
                    className="accent-[#0099CC] w-4 h-4"
                  />
                  <span className="text-sm capitalize text-gray-700">{status}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case "contact":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <div className="space-y-3 mt-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <label className="text-sm text-gray-600 sm:w-28 sm:text-right sm:flex-shrink-0">Cell phone:</label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={formData.cellPhone}
                  onChange={(e) => set("cellPhone", formatPhone(e.target.value))}
                  placeholder="(555) 000-0000"
                  className="w-full sm:flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: formData.cellPhone ? "#0099CC" : undefined }}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <label className="text-sm text-gray-600 sm:w-28 sm:text-right sm:flex-shrink-0">Work phone:</label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={formData.workPhone}
                  onChange={(e) => set("workPhone", formatPhone(e.target.value))}
                  placeholder="(555) 000-0000"
                  className="w-full sm:flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: formData.workPhone ? "#0099CC" : undefined }}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <label className="text-sm text-gray-600 sm:w-28 sm:text-right sm:flex-shrink-0">Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="your@email.com"
                  className="w-full sm:flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: formData.email ? "#0099CC" : undefined }}
                />
              </div>
            </div>
          </div>
        );

      case "dl":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <select
                value={formData.dlState}
                onChange={(e) => set("dlState", e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none bg-white"
                style={{ borderColor: formData.dlState ? "#0099CC" : undefined }}
              >
                <option value="">Select State</option>
                {US_STATES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={formData.dlNumber}
                onChange={(e) => set("dlNumber", e.target.value)}
                placeholder="License Number"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: formData.dlNumber ? "#0099CC" : undefined }}
              />
            </div>
          </div>
        );

      case "dlFront":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <div className="mt-3">
              <label className="upload-btn cursor-pointer">
                <Camera size={16} />
                {formData.dlFrontUrl ? "Front ID Uploaded ✓" : "Upload Front side of your ID"}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setDlFrontFile(file); handleFileUpload(file, "dl-front"); }
                  }}
                />
              </label>
              {formData.dlFrontUrl && (
                <p className="text-xs text-green-600 mt-1">✓ Front of ID uploaded successfully</p>
              )}
              {isUploading && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
            </div>
          </div>
        );

      case "dlBack":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <div className="mt-3">
              <label className="upload-btn cursor-pointer">
                <Camera size={16} />
                {formData.dlBackUrl ? "Back ID Uploaded ✓" : "Upload Back side of your ID"}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setDlBackFile(file); handleFileUpload(file, "dl-back"); }
                  }}
                />
              </label>
              {formData.dlBackUrl && (
                <p className="text-xs text-green-600 mt-1">✓ Back of ID uploaded successfully</p>
              )}
            </div>
          </div>
        );

      case "address":
        return (
          <div className="animate-slide-in">

            <div className="space-y-3">
              <div>
                <BotMessage>What's your current street address?</BotMessage>
                <input
                  type="text"
                  value={formData.currentStreet}
                  onChange={(e) => set("currentStreet", e.target.value)}
                  placeholder="Street Address"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: formData.currentStreet ? "#0099CC" : undefined }}
                />
              </div>
              <div>
                <BotMessage>And what's the city?</BotMessage>
                <input
                  type="text"
                  value={formData.currentCity}
                  onChange={(e) => set("currentCity", e.target.value)}
                  placeholder="City"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: formData.currentCity ? "#0099CC" : undefined }}
                />
              </div>
              <div>
                <BotMessage>Got it. What state do you live in?</BotMessage>
                <select
                  value={formData.currentState}
                  onChange={(e) => set("currentState", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none bg-white"
                  style={{ borderColor: formData.currentState ? "#0099CC" : undefined }}
                >
                  <option value="">Select State</option>
                  {US_STATES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <BotMessage>Finally, what's the zip code?</BotMessage>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="postal-code"
                  value={formData.currentZip}
                  onChange={(e) => set("currentZip", e.target.value)}
                  placeholder="Zip Code"
                  maxLength={10}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: formData.currentZip ? "#0099CC" : undefined }}
                />
              </div>
            </div>
          </div>
        );

      case "coApplicant":
        return (
          <div className="animate-slide-in">
            <BotMessage>
              Great! Do you have a Co-Applicant? If yes, click the Add+ button to add another person to this application.
            </BotMessage>
            <div className="flex gap-3 mt-3">
              <button
                type="button"
                onClick={() => { setHasCoApplicant(true); if (coApplicants.length === 0) setCoApplicants([emptyCoApplicant()]); }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${hasCoApplicant === true ? "text-white border-transparent" : "text-gray-600 border-gray-300 hover:border-[#0099CC]"}`}
                style={hasCoApplicant === true ? { backgroundColor: "#0099CC", borderColor: "#0099CC" } : {}}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => { setHasCoApplicant(false); setCoApplicants([]); }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${hasCoApplicant === false ? "text-white border-transparent" : "text-gray-600 border-gray-300 hover:border-gray-400"}`}
                style={hasCoApplicant === false ? { backgroundColor: "#666", borderColor: "#666" } : {}}
              >
                No
              </button>
            </div>

            {hasCoApplicant === true && coApplicants.map((ca, idx) => (
              <div key={idx} className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm text-gray-700">Co-Applicant {idx + 1}</h4>
                  {coApplicants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCoApplicants((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={ca.firstName}
                    onChange={(e) => {
                      const updated = [...coApplicants];
                      updated[idx] = { ...updated[idx], firstName: e.target.value };
                      setCoApplicants(updated);
                    }}
                    className="border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={ca.lastName}
                    onChange={(e) => {
                      const updated = [...coApplicants];
                      updated[idx] = { ...updated[idx], lastName: e.target.value };
                      setCoApplicants(updated);
                    }}
                    className="border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={ca.email}
                    onChange={(e) => {
                      const updated = [...coApplicants];
                      updated[idx] = { ...updated[idx], email: e.target.value };
                      setCoApplicants(updated);
                    }}
                    className="border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none"
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(555) 000-0000"
                    value={ca.cellPhone}
                    onChange={(e) => {
                      const updated = [...coApplicants];
                      updated[idx] = { ...updated[idx], cellPhone: formatPhone(e.target.value) };
                      setCoApplicants(updated);
                    }}
                    className="border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
            ))}

            {hasCoApplicant === true && (
              <button
                type="button"
                onClick={() => setCoApplicants((prev) => [...prev, emptyCoApplicant()])}
                className="add-btn mt-3"
              >
                <Plus size={12} /> Add+
              </button>
            )}

            {hasCoApplicant === false && (
              <div className="mt-3">
                <BotMessage>Thank you! So, what's the reason you're moving?</BotMessage>
                <div className="flex gap-4 mt-2 flex-wrap">
                  {["Job relocation", "Need more space", "Other"].map((reason) => (
                    <label key={reason} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reasonForMoving"
                        value={reason}
                        checked={formData.reasonForMoving === reason}
                        onChange={() => set("reasonForMoving", reason)}
                        className="accent-[#0099CC] w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "reasonForMoving":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <div className="flex gap-4 mt-3 flex-wrap">
              {["Job relocation", "Need more space", "Other"].map((reason) => (
                <label key={reason} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reasonForMoving"
                    value={reason}
                    checked={formData.reasonForMoving === reason}
                    onChange={() => set("reasonForMoving", reason)}
                    className="accent-[#0099CC] w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = Math.round(((currentQ + 1) / QUESTIONS.length) * 100);

  return (
    <AppLayout currentStep={3} showProgress={true}>
      <SaveProgress applicationId={applicationId} currentStep={3} />
      {/* Section header */}
      <div className="mb-4">
        <h2 className="section-heading">Property and Personal Information</h2>

        {/* Mini progress */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: "#0099CC" }}
            />
          </div>
          <span className="text-xs text-gray-400">{currentQ + 1}/{QUESTIONS.length}</span>
        </div>
      </div>

      {/* Question Card */}
      <div
        ref={questionRef}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 overflow-hidden"
      >
        {renderQuestion()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium py-3 px-5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all min-h-[44px]"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={isUploading}
          className="flex items-center gap-2 text-white font-bold py-3 px-6 rounded-lg text-sm transition-all hover:opacity-90 disabled:opacity-50 min-h-[44px]"
          style={{ backgroundColor: "#0099CC" }}
        >
          {currentQ === QUESTIONS.length - 1 ? "Continue to Employment" : "Next"}
          <ChevronRight size={16} />
        </button>
      </div>
    </AppLayout>
  );
}
