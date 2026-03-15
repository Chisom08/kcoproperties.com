import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/features/rental/components/AppLayout";
import { BotMessage } from "@/features/rental/components/OmiaBot";
import { SaveProgress } from "@/features/rental/components/SaveProgress";
import { US_STATES } from "@/lib/states";
import { formatPhone } from "@/lib/formatPhone";
import { formatZipCode, formatMoney, allowOnlyText } from "@/lib/inputValidation";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, ChevronRight, ChevronLeft, Plus, X } from "lucide-react";

interface PreviousEmployer {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  position: string;
  from: string;
  to: string;
}

const QUESTIONS = [
  { id: "employer", label: "Great! Now I need to ask you about your employment. What's the name of your employer?" },
  { id: "employerAddress", label: "And what's the employer's address?" },
  { id: "position", label: "What is your position/title?" },
  { id: "officePhone", label: "What's the office phone number?" },
  { id: "income", label: "What's your monthly gross pay?" },
  { id: "supervisor", label: "What's your supervisor's name and phone number?" },
  { id: "additionalIncome", label: "Do you have any additional income sources?" },
  { id: "employmentDates", label: "What are your employment dates?" },
  { id: "incomeProof", label: "Please upload your proof of income (W2, Paystub, or Bank Statement)." },
  { id: "previousEmployer", label: "Do you have a previous employer you'd like to add?" },
  { id: "landlord", label: "Now let's get your landlord's information for references." },
];

export default function Employment() {
  const [, navigate] = useLocation();
  const applicationId = Number(localStorage.getItem("kco_app_id") || "0");

  const [currentQ, setCurrentQ] = useState(0);
  const [formData, setFormData] = useState({
    employerName: "",
    employerStreet: "",
    employerCity: "",
    employerState: "",
    employerZip: "",
    position: "",
    officePhone: "",
    monthlyGrossPay: "",
    supervisorName: "",
    supervisorPhone: "",
    additionalIncome: "",
    employmentFrom: "",
    employmentTo: "",
    incomeProofUrls: [] as string[],
    landlordName: "",
    landlordPhone: "",
    landlordEmail: "",
    landlordAddress: "",
  });
  const [previousEmployers, setPreviousEmployers] = useState<PreviousEmployer[]>([]);
  const [hasPrevEmployer, setHasPrevEmployer] = useState<boolean | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const saveDraftMutation = trpc.rental.application.saveDraft.useMutation();
  const uploadFileMutation = trpc.rental.upload.uploadFile.useMutation();
  const questionRef = useRef<HTMLDivElement>(null);

  // Load saved application data
  const { data: savedApplication } = trpc.rental.application.getApplication.useQuery(
    { applicationId },
    { enabled: !!applicationId, refetchOnWindowFocus: false }
  );

  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!applicationId) navigate("/rental/signup");
  }, [applicationId]);

  // Load saved data when application data is available
  useEffect(() => {
    if (savedApplication && !dataLoaded) {
      // Restore form data from saved application
      setFormData((prev) => ({
        ...prev,
        employerName: savedApplication.employerName || prev.employerName,
        employerStreet: savedApplication.employerStreet || prev.employerStreet,
        employerCity: savedApplication.employerCity || prev.employerCity,
        employerState: savedApplication.employerState || prev.employerState,
        employerZip: savedApplication.employerZip || prev.employerZip,
        position: savedApplication.position || prev.position,
        officePhone: savedApplication.officePhone || prev.officePhone,
        monthlyGrossPay: savedApplication.monthlyGrossPay || prev.monthlyGrossPay,
        supervisorName: savedApplication.supervisorName || prev.supervisorName,
        supervisorPhone: savedApplication.supervisorPhone || prev.supervisorPhone,
        additionalIncome: savedApplication.additionalIncome || prev.additionalIncome,
        employmentFrom: savedApplication.employmentFrom || prev.employmentFrom,
        employmentTo: savedApplication.employmentTo || prev.employmentTo,
        incomeProofUrls: Array.isArray(savedApplication.incomeProofUrls)
          ? savedApplication.incomeProofUrls
          : prev.incomeProofUrls,
        // Landlord fields are not yet on the application schema; keep previous/local state
        landlordName: prev.landlordName,
        landlordPhone: prev.landlordPhone,
        landlordEmail: prev.landlordEmail,
        landlordAddress: prev.landlordAddress,
      }));

      setDataLoaded(true);
    }
  }, [savedApplication, dataLoaded]);

  useEffect(() => {
    questionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentQ]);

  const set = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const result = await uploadFileMutation.mutateAsync({
          applicationId,
          fileType: "income-proof",
          fileName: file.name,
          contentType: file.type,
          base64Data: base64,
        });
        setFormData((prev) => ({
          ...prev,
          incomeProofUrls: [...prev.incomeProofUrls, result.url],
        }));
        setIsUploading(false);
        toast.success("Income proof uploaded!");
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
      case "employer":
        if (!formData.employerName.trim()) { toast.error("Please enter your employer name."); return false; }
        break;
      case "employerAddress":
        if (!formData.employerStreet.trim() || !formData.employerCity.trim() || !formData.employerState) {
          toast.error("Please complete the employer address."); return false;
        }
        break;
      case "position":
        if (!formData.position.trim()) { toast.error("Please enter your position."); return false; }
        break;
      case "officePhone":
        if (!formData.officePhone.trim()) { toast.error("Please enter the office phone."); return false; }
        break;
      case "income":
        if (!formData.monthlyGrossPay.trim()) { toast.error("Please enter your monthly gross pay."); return false; }
        break;
      case "supervisor":
        if (!formData.supervisorName.trim()) { toast.error("Please enter your supervisor's name."); return false; }
        break;
      case "employmentDates":
        if (!formData.employmentFrom) { toast.error("Please enter your employment start date."); return false; }
        break;
      case "incomeProof":
        if (formData.incomeProofUrls.length === 0) { toast.error("Please upload at least one proof of income."); return false; }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentQuestion()) return;

    saveDraftMutation.mutate({
      applicationId,
      step: 4,
      data: { ...formData, incomeProofUrls: formData.incomeProofUrls },
    });

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      navigate("/rental/apply/emergency");
    }
  };

  const handleBack = () => {
    if (currentQ > 0) setCurrentQ((prev) => prev - 1);
    else navigate("/rental/apply/personal");
  };

  const renderQuestion = () => {
    const q = QUESTIONS[currentQ];

    switch (q.id) {
      case "employer":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <input
              type="text"
              value={formData.employerName}
              onChange={(e) => set("employerName", allowOnlyText(e.target.value))}
              placeholder="Employer Name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mt-2 focus:outline-none"
              style={{ borderColor: formData.employerName ? "#0099CC" : undefined }}
              autoFocus
            />
          </div>
        );

      case "employerAddress":
        return (
          <div className="animate-slide-in space-y-3">
            <BotMessage>{q.label}</BotMessage>
            <input
              type="text"
              value={formData.employerStreet}
              onChange={(e) => set("employerStreet", allowOnlyText(e.target.value))}
              placeholder="Street Address"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: formData.employerStreet ? "#0099CC" : undefined }}
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={formData.employerCity}
                onChange={(e) => set("employerCity", allowOnlyText(e.target.value))}
                placeholder="City"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: formData.employerCity ? "#0099CC" : undefined }}
              />
              <select
                value={formData.employerState}
                onChange={(e) => set("employerState", e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none bg-white"
                style={{ borderColor: formData.employerState ? "#0099CC" : undefined }}
              >
                <option value="">State</option>
                {US_STATES.map((s) => (
                  <option key={s.value} value={s.value}>{s.value}</option>
                ))}
              </select>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="postal-code"
                value={formData.employerZip}
                onChange={(e) => set("employerZip", formatZipCode(e.target.value))}
                placeholder="Zip"
                maxLength={10}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: formData.employerZip ? "#0099CC" : undefined }}
              />
            </div>
          </div>
        );

      case "position":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => set("position", allowOnlyText(e.target.value))}
              placeholder="Position / Title"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mt-2 focus:outline-none"
              style={{ borderColor: formData.position ? "#0099CC" : undefined }}
              autoFocus
            />
          </div>
        );

      case "officePhone":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={formData.officePhone}
              onChange={(e) => set("officePhone", formatPhone(e.target.value))}
              placeholder="(555) 000-0000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mt-2 focus:outline-none"
              style={{ borderColor: formData.officePhone ? "#0099CC" : undefined }}
              autoFocus
            />
          </div>
        );

      case "income":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                autoComplete="off"
                value={formData.monthlyGrossPay}
                onChange={(e) => set("monthlyGrossPay", formatMoney(e.target.value))}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: formData.monthlyGrossPay ? "#0099CC" : undefined }}
                autoFocus
              />
            </div>
          </div>
        );

      case "supervisor":
        return (
          <div className="animate-slide-in space-y-3">
            <BotMessage>{q.label}</BotMessage>
            <input
              type="text"
              value={formData.supervisorName}
              onChange={(e) => set("supervisorName", allowOnlyText(e.target.value))}
              placeholder="Supervisor Name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: formData.supervisorName ? "#0099CC" : undefined }}
            />
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={formData.supervisorPhone}
              onChange={(e) => set("supervisorPhone", formatPhone(e.target.value))}
              placeholder="(555) 000-0000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: formData.supervisorPhone ? "#0099CC" : undefined }}
            />
          </div>
        );

      case "additionalIncome":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <textarea
              value={formData.additionalIncome}
              onChange={(e) => set("additionalIncome", e.target.value)}
              placeholder="Describe any additional income sources (or leave blank if none)"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mt-2 focus:outline-none resize-none"
              style={{ borderColor: formData.additionalIncome ? "#0099CC" : undefined }}
            />
          </div>
        );

      case "employmentDates":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">From</label>
                <input
                  type="date"
                  value={formData.employmentFrom}
                  onChange={(e) => set("employmentFrom", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: formData.employmentFrom ? "#0099CC" : undefined }}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">To (leave blank if current)</label>
                <input
                  type="date"
                  value={formData.employmentTo}
                  onChange={(e) => set("employmentTo", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: formData.employmentTo ? "#0099CC" : undefined }}
                />
              </div>
            </div>
          </div>
        );

      case "incomeProof":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <div className="mt-3 space-y-2">
              <label className="upload-btn cursor-pointer">
                <Upload size={16} />
                Upload Proof of Income
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </label>
              {isUploading && <p className="text-xs text-gray-400">Uploading...</p>}
              {formData.incomeProofUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-green-600">
                  <span>✓ Document {i + 1} uploaded</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        incomeProofUrls: prev.incomeProofUrls.filter((_, j) => j !== i),
                      }))
                    }
                    className="text-red-400 hover:text-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <p className="text-xs text-gray-400">Accepted: W2, Paystub, Bank Statement (PDF or image)</p>
            </div>
          </div>
        );

      case "previousEmployer":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <div className="flex gap-3 mt-3">
              <button
                type="button"
                onClick={() => {
                  setHasPrevEmployer(true);
                  if (previousEmployers.length === 0) {
                    setPreviousEmployers([{ name: "", street: "", city: "", state: "", zip: "", position: "", from: "", to: "" }]);
                  }
                }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${hasPrevEmployer === true ? "text-white border-transparent" : "text-gray-600 border-gray-300"}`}
                style={hasPrevEmployer === true ? { backgroundColor: "#0099CC", borderColor: "#0099CC" } : {}}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => { setHasPrevEmployer(false); setPreviousEmployers([]); }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${hasPrevEmployer === false ? "text-white border-transparent" : "text-gray-600 border-gray-300"}`}
                style={hasPrevEmployer === false ? { backgroundColor: "#666", borderColor: "#666" } : {}}
              >
                No
              </button>
            </div>

            {hasPrevEmployer === true && previousEmployers.map((pe, idx) => (
              <div key={idx} className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-gray-700">Previous Employer {idx + 1}</h4>
                  <button
                    type="button"
                    onClick={() => setPreviousEmployers((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-xs text-red-500"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Employer Name"
                  value={pe.name}
                  onChange={(e) => {
                    const updated = [...previousEmployers];
                    updated[idx] = { ...updated[idx], name: allowOnlyText(e.target.value) };
                    setPreviousEmployers(updated);
                  }}
                  className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    placeholder="From"
                    value={pe.from}
                    onChange={(e) => {
                      const updated = [...previousEmployers];
                      updated[idx] = { ...updated[idx], from: e.target.value };
                      setPreviousEmployers(updated);
                    }}
                    className="border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none"
                  />
                  <input
                    type="date"
                    placeholder="To"
                    value={pe.to}
                    onChange={(e) => {
                      const updated = [...previousEmployers];
                      updated[idx] = { ...updated[idx], to: e.target.value };
                      setPreviousEmployers(updated);
                    }}
                    className="border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
            ))}

            {hasPrevEmployer === true && (
              <button
                type="button"
                onClick={() => setPreviousEmployers((prev) => [...prev, { name: "", street: "", city: "", state: "", zip: "", position: "", from: "", to: "" }])}
                className="add-btn mt-3"
              >
                <Plus size={12} /> Add+
              </button>
            )}
          </div>
        );

      case "landlord":
        return (
          <div className="animate-slide-in space-y-3">
            <BotMessage>{q.label}</BotMessage>
            <input
              type="text"
              value={formData.landlordName}
              onChange={(e) => set("landlordName", allowOnlyText(e.target.value))}
              placeholder="Landlord Name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: formData.landlordName ? "#0099CC" : undefined }}
            />
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={formData.landlordPhone}
              onChange={(e) => set("landlordPhone", formatPhone(e.target.value))}
              placeholder="(555) 000-0000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: formData.landlordPhone ? "#0099CC" : undefined }}
            />
            <input
              type="email"
              value={formData.landlordEmail}
              onChange={(e) => set("landlordEmail", e.target.value)}
              placeholder="Landlord Email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: formData.landlordEmail ? "#0099CC" : undefined }}
            />
            <input
              type="text"
              value={formData.landlordAddress}
              onChange={(e) => set("landlordAddress", allowOnlyText(e.target.value))}
              placeholder="Property Address"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: formData.landlordAddress ? "#0099CC" : undefined }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const progress = Math.round(((currentQ + 1) / QUESTIONS.length) * 100);

  return (
    <AppLayout currentStep={4} showProgress={true}>
      <SaveProgress applicationId={applicationId} currentStep={4} />
      <div className="mb-4">
        <h2 className="section-heading">Employment & Income Information</h2>
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

      <div ref={questionRef} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        {renderQuestion()}
      </div>

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
          {currentQ === QUESTIONS.length - 1 ? "Continue to Emergency Contacts" : "Next"}
          <ChevronRight size={16} />
        </button>
      </div>
    </AppLayout>
  );
}
