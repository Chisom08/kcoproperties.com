import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/features/rental/components/AppLayout";
import { BotMessage } from "@/features/rental/components/OmiaBot";
import { SaveProgress } from "@/features/rental/components/SaveProgress";
import { US_STATES } from "@/lib/states";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Plus, Car } from "lucide-react";
import { formatPhone } from "@/lib/formatPhone";
import { formatZipCode, formatYear, allowOnlyText } from "@/lib/inputValidation";

interface Vehicle {
  make: string;
  model: string;
  color: string;
  year: string;
  licensePlate: string;
}

const QUESTIONS = [
  { id: "emergencyName", label: "Great! Now let's get your emergency contact information. What's the name of your emergency contact?" },
  { id: "emergencyRelationship", label: "And what is their relationship to you?" },
  { id: "emergencyPhone", label: "What's their phone number?" },
  { id: "emergencyEmail", label: "What's their email address?" },
  { id: "emergencyAddress", label: "What's their address?" },
  { id: "medicalContact", label: "Now, let's add a medical emergency contact. What's their name?" },
  { id: "medicalPhone", label: "What's their phone number?" },
  { id: "medicalEmail", label: "What's their email?" },
  { id: "medicalAddress", label: "What's their address?" },
  { id: "vehicles", label: "Do you have any vehicles? If so, please add them here." },
  { id: "pets", label: "Do you have any pets?" },
];

export default function EmergencyContacts() {
  const [, navigate] = useLocation();
  const applicationId = Number(localStorage.getItem("kco_app_id") || "0");

  const [currentQ, setCurrentQ] = useState(0);
  const [formData, setFormData] = useState({
    emergencyName: "",
    emergencyRelationship: "",
    emergencyRelationshipOther: "",
    emergencyPhone: "",
    emergencyEmail: "",
    emergencyAddress: "",
    emergencyCity: "",
    emergencyState: "",
    emergencyZip: "",
    medicalName: "",
    medicalPhone: "",
    medicalEmail: "",
    medicalAddress: "",
    medicalCity: "",
    medicalState: "",
    medicalZip: "",
    hasPets: null as boolean | null,
    petDescription: "",
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [hasVehicles, setHasVehicles] = useState<boolean | null>(null);

  const saveDraftMutation = trpc.rental.application.saveDraft.useMutation();
  const saveVehiclesMutation = trpc.rental.application.saveVehicles.useMutation();
  const questionRef = useRef<HTMLDivElement>(null);

  // Load saved application data
  const { data: savedApplication } = trpc.rental.application.getApplication.useQuery(
    { applicationId },
    { enabled: !!applicationId, refetchOnWindowFocus: false }
  );
  const { data: savedVehicles = [] } = trpc.rental.application.getVehicles.useQuery(
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
        emergencyName: (savedApplication.emergencyName as string | null) || prev.emergencyName,
        emergencyRelationship: (savedApplication.emergencyRelationship as string | null) || prev.emergencyRelationship,
        emergencyPhone: (savedApplication.emergencyPhone as string | null) || prev.emergencyPhone,
        emergencyEmail: (savedApplication.emergencyEmail as string | null) || prev.emergencyEmail,
        emergencyAddress: (savedApplication.emergencyAddress as string | null) || prev.emergencyAddress,
        emergencyCity: (savedApplication.emergencyCity as string | null) || prev.emergencyCity,
        emergencyState: (savedApplication.emergencyState as string | null) || prev.emergencyState,
        emergencyZip: (savedApplication.emergencyZip as string | null) || prev.emergencyZip,
        medicalName: (savedApplication.medicalName as string | null) || prev.medicalName,
        medicalPhone: (savedApplication.medicalPhone as string | null) || prev.medicalPhone,
        medicalEmail: (savedApplication.medicalEmail as string | null) || prev.medicalEmail,
        medicalAddress: (savedApplication.medicalAddress as string | null) || prev.medicalAddress,
        medicalCity: (savedApplication.medicalCity as string | null) || prev.medicalCity,
        medicalZip: (savedApplication.medicalZip as string | null) || prev.medicalZip,
        hasPets: savedApplication.petsInfo ? (savedApplication.petsInfo.trim() !== "" ? true : false) : prev.hasPets,
        petDescription: savedApplication.petsInfo || prev.petDescription,
      }));

      // Restore vehicles
      if (savedVehicles.length > 0) {
        setVehicles(savedVehicles.map((v) => ({
          make: v.make || "",
          model: v.model || "",
          color: v.color || "",
          year: v.year || "",
          licensePlate: v.licensePlate || "",
        })));
        setHasVehicles(true);
      }

      setDataLoaded(true);
    }
  }, [savedApplication, savedVehicles, dataLoaded]);

  useEffect(() => {
    questionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentQ]);

  const set = (field: string, value: string | boolean | null) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const validateCurrentQuestion = () => {
    const q = QUESTIONS[currentQ];
    switch (q.id) {
      case "emergencyName":
        if (!formData.emergencyName.trim()) { toast.error("Please enter the emergency contact name."); return false; }
        break;
      case "emergencyRelationship":
        if (!formData.emergencyRelationship.trim()) { toast.error("Please select the relationship."); return false; }
        if (formData.emergencyRelationship === "Other" && !formData.emergencyRelationshipOther.trim()) {
          toast.error("Please specify the relationship."); return false;
        }
        break;
      case "emergencyPhone":
        if (!formData.emergencyPhone.trim()) { toast.error("Please enter the phone number."); return false; }
        break;
      case "emergencyEmail":
        if (!formData.emergencyEmail.trim()) { toast.error("Please enter the email address."); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emergencyEmail)) {
          toast.error("Please enter a valid email address."); return false;
        }
        break;
      case "emergencyAddress":
        if (!formData.emergencyAddress.trim()) { toast.error("Please enter the street address."); return false; }
        if (!formData.emergencyCity.trim()) { toast.error("Please enter the city."); return false; }
        if (!formData.emergencyState) { toast.error("Please select the state."); return false; }
        if (!formData.emergencyZip.trim()) { toast.error("Please enter the zip code."); return false; }
        break;
      case "medicalContact":
        if (!formData.medicalName.trim()) { toast.error("Please enter the medical contact name."); return false; }
        break;
      case "medicalPhone":
        if (!formData.medicalPhone.trim()) { toast.error("Please enter the phone number."); return false; }
        break;
      case "medicalEmail":
        if (!formData.medicalEmail.trim()) { toast.error("Please enter the email address."); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.medicalEmail)) {
          toast.error("Please enter a valid email address."); return false;
        }
        break;
      case "medicalAddress":
        if (!formData.medicalAddress.trim()) { toast.error("Please enter the street address."); return false; }
        if (!formData.medicalCity.trim()) { toast.error("Please enter the city."); return false; }
        if (!formData.medicalState) { toast.error("Please select the state."); return false; }
        if (!formData.medicalZip.trim()) { toast.error("Please enter the zip code."); return false; }
        break;
      case "vehicles":
        if (hasVehicles === null) { toast.error("Please indicate if you have any vehicles."); return false; }
        if (hasVehicles === true) {
          if (vehicles.length === 0) { toast.error("Please add at least one vehicle."); return false; }
          for (let i = 0; i < vehicles.length; i++) {
            const v = vehicles[i];
            if (!v.make.trim()) { toast.error(`Please enter the make for Vehicle ${i + 1}.`); return false; }
            if (!v.model.trim()) { toast.error(`Please enter the model for Vehicle ${i + 1}.`); return false; }
            if (!v.color.trim()) { toast.error(`Please enter the color for Vehicle ${i + 1}.`); return false; }
            if (!v.year.trim()) { toast.error(`Please enter the year for Vehicle ${i + 1}.`); return false; }
            if (!v.licensePlate.trim()) { toast.error(`Please enter the license plate for Vehicle ${i + 1}.`); return false; }
          }
        }
        break;
      case "pets":
        if (formData.hasPets === null) { toast.error("Please indicate if you have any pets."); return false; }
        if (formData.hasPets === true && !formData.petDescription.trim()) {
          toast.error("Please describe your pets."); return false;
        }
        break;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentQuestion()) return;

    saveDraftMutation.mutate({
      applicationId,
      step: 5,
      data: { ...formData },
    });

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      // Save vehicles
      if (vehicles.length > 0) {
        await saveVehiclesMutation.mutateAsync({ applicationId, vehicles });
      }
      navigate("/rental/apply/general-info");
    }
  };

  const handleBack = () => {
    if (currentQ > 0) setCurrentQ((prev) => prev - 1);
    else navigate("/rental/apply/employment");
  };

  const renderQuestion = () => {
    const q = QUESTIONS[currentQ];

    switch (q.id) {
      case "emergencyName":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <input
              type="text"
              value={formData.emergencyName}
              onChange={(e) => set("emergencyName", allowOnlyText(e.target.value))}
              placeholder="Full Name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mt-2 focus:outline-none"
              style={{ borderColor: formData.emergencyName ? "#0099CC" : undefined }}
              autoFocus
            />
          </div>
        );

      case "emergencyRelationship":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <div className="flex gap-3 mt-3 flex-wrap">
              {["Spouse", "Parent", "Sibling", "Friend", "Other"].map((rel) => (
                <label key={rel} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="emergencyRelationship"
                    value={rel}
                    checked={formData.emergencyRelationship === rel}
                    onChange={() => set("emergencyRelationship", rel)}
                    className="accent-[#0099CC] w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{rel}</span>
                </label>
              ))}
            </div>
            {formData.emergencyRelationship === "Other" && (
              <input
                type="text"
                value={formData.emergencyRelationshipOther}
                onChange={(e) => set("emergencyRelationshipOther", allowOnlyText(e.target.value))}
                placeholder="Please specify"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mt-2 focus:outline-none"
                style={{ borderColor: formData.emergencyRelationshipOther ? "#0099CC" : undefined }}
                autoFocus
              />
            )}
          </div>
        );

      case "emergencyPhone":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={formData.emergencyPhone}
              onChange={(e) => set("emergencyPhone", formatPhone(e.target.value))}
              placeholder="(555) 000-0000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mt-2 focus:outline-none"
              style={{ borderColor: formData.emergencyPhone ? "#0099CC" : undefined }}
              autoFocus
            />
          </div>
        );

      case "emergencyEmail":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <input
              type="email"
              value={formData.emergencyEmail}
              onChange={(e) => set("emergencyEmail", e.target.value)}
              placeholder="email@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mt-2 focus:outline-none"
              style={{ borderColor: formData.emergencyEmail ? "#0099CC" : undefined }}
              autoFocus
            />
          </div>
        );

      case "emergencyAddress":
        return (
          <div className="animate-slide-in space-y-3">
            <BotMessage>{q.label}</BotMessage>
            <input
              type="text"
              value={formData.emergencyAddress}
              onChange={(e) => set("emergencyAddress", allowOnlyText(e.target.value))}
              placeholder="Street Address"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: formData.emergencyAddress ? "#0099CC" : undefined }}
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={formData.emergencyCity}
                onChange={(e) => set("emergencyCity", allowOnlyText(e.target.value))}
                placeholder="City"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: formData.emergencyCity ? "#0099CC" : undefined }}
              />
              <select
                value={formData.emergencyState}
                onChange={(e) => set("emergencyState", e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none bg-white"
                style={{ borderColor: formData.emergencyState ? "#0099CC" : undefined }}
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
                value={formData.emergencyZip}
                onChange={(e) => set("emergencyZip", formatZipCode(e.target.value))}
                placeholder="Zip"
                maxLength={10}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: formData.emergencyZip ? "#0099CC" : undefined }}
              />
            </div>
          </div>
        );

      case "medicalContact":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <input
              type="text"
              value={formData.medicalName}
              onChange={(e) => set("medicalName", allowOnlyText(e.target.value))}
              placeholder="Medical Contact Name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mt-2 focus:outline-none"
              style={{ borderColor: formData.medicalName ? "#0099CC" : undefined }}
              autoFocus
            />
          </div>
        );

      case "medicalPhone":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={formData.medicalPhone}
              onChange={(e) => set("medicalPhone", formatPhone(e.target.value))}
              placeholder="(555) 000-0000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mt-2 focus:outline-none"
              style={{ borderColor: formData.medicalPhone ? "#0099CC" : undefined }}
              autoFocus
            />
          </div>
        );

      case "medicalEmail":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <input
              type="email"
              value={formData.medicalEmail}
              onChange={(e) => set("medicalEmail", e.target.value)}
              placeholder="email@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mt-2 focus:outline-none"
              style={{ borderColor: formData.medicalEmail ? "#0099CC" : undefined }}
              autoFocus
            />
          </div>
        );

      case "medicalAddress":
        return (
          <div className="animate-slide-in space-y-3">
            <BotMessage>{q.label}</BotMessage>
            <input
              type="text"
              value={formData.medicalAddress}
              onChange={(e) => set("medicalAddress", allowOnlyText(e.target.value))}
              placeholder="Street Address"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: formData.medicalAddress ? "#0099CC" : undefined }}
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={formData.medicalCity}
                onChange={(e) => set("medicalCity", allowOnlyText(e.target.value))}
                placeholder="City"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: formData.medicalCity ? "#0099CC" : undefined }}
              />
              <select
                value={formData.medicalState}
                onChange={(e) => set("medicalState", e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none bg-white"
                style={{ borderColor: formData.medicalState ? "#0099CC" : undefined }}
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
                value={formData.medicalZip}
                onChange={(e) => set("medicalZip", formatZipCode(e.target.value))}
                placeholder="Zip"
                maxLength={10}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: formData.medicalZip ? "#0099CC" : undefined }}
              />
            </div>
          </div>
        );

      case "vehicles":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <div className="flex gap-3 mt-3">
              <button
                type="button"
                onClick={() => {
                  setHasVehicles(true);
                  if (vehicles.length === 0) {
                    setVehicles([{ make: "", model: "", color: "", year: "", licensePlate: "" }]);
                  }
                }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${hasVehicles === true ? "text-white border-transparent" : "text-gray-600 border-gray-300"}`}
                style={hasVehicles === true ? { backgroundColor: "#0099CC", borderColor: "#0099CC" } : {}}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => { setHasVehicles(false); setVehicles([]); }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${hasVehicles === false ? "text-white border-transparent" : "text-gray-600 border-gray-300"}`}
                style={hasVehicles === false ? { backgroundColor: "#666", borderColor: "#666" } : {}}
              >
                No
              </button>
            </div>

            {hasVehicles === true && vehicles.map((v, idx) => (
              <div key={idx} className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <Car size={16} style={{ color: "#0099CC" }} />
                  <span className="font-semibold text-sm text-gray-700">Vehicle {idx + 1}</span>
                  {vehicles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setVehicles((prev) => prev.filter((_, i) => i !== idx))}
                      className="ml-auto text-xs text-red-500"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                   {(["make", "model", "color", "year", "licensePlate"] as const).map((field) => (
                    <input
                      key={field}
                      type="text"
                      inputMode={field === "year" ? "numeric" : "text"}
                      pattern={field === "year" ? "[0-9]{4}" : undefined}
                      placeholder={field === "licensePlate" ? "License Plate" : field.charAt(0).toUpperCase() + field.slice(1)}
                      value={v[field]}
                      onChange={(e) => {
                        const updated = [...vehicles];
                        updated[idx] = { 
                          ...updated[idx], 
                          [field]: field === "year" 
                            ? formatYear(e.target.value) 
                            : allowOnlyText(e.target.value)
                        };
                        setVehicles(updated);
                      }}
                      className={`border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none ${field === "licensePlate" ? "col-span-2" : ""}`}
                    />
                  ))}
                </div>
              </div>
            ))}

            {hasVehicles === true && (
              <button
                type="button"
                onClick={() => setVehicles((prev) => [...prev, { make: "", model: "", color: "", year: "", licensePlate: "" }])}
                className="add-btn mt-3"
              >
                <Plus size={12} /> Add Vehicle+
              </button>
            )}
          </div>
        );

      case "pets":
        return (
          <div className="animate-slide-in">
            <BotMessage>{q.label}</BotMessage>
            <div className="flex gap-3 mt-3">
              <button
                type="button"
                onClick={() => set("hasPets", true)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${formData.hasPets === true ? "text-white border-transparent" : "text-gray-600 border-gray-300"}`}
                style={formData.hasPets === true ? { backgroundColor: "#0099CC", borderColor: "#0099CC" } : {}}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => set("hasPets", false)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${formData.hasPets === false ? "text-white border-transparent" : "text-gray-600 border-gray-300"}`}
                style={formData.hasPets === false ? { backgroundColor: "#666", borderColor: "#666" } : {}}
              >
                No
              </button>
            </div>
            {formData.hasPets === true && (
              <div className="mt-3">
                <textarea
                  value={formData.petDescription}
                  onChange={(e) => set("petDescription", e.target.value)}
                  placeholder="Please describe your pets (type, breed, weight)"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
                  style={{ borderColor: formData.petDescription ? "#0099CC" : undefined }}
                />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const progress = Math.round(((currentQ + 1) / QUESTIONS.length) * 100);

  return (
    <AppLayout currentStep={5} showProgress={true}>
      <SaveProgress applicationId={applicationId} currentStep={5} />
      <div className="mb-4">
        <h2 className="section-heading">Emergency & Medical Contacts</h2>
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
          className="flex items-center gap-2 text-white font-bold py-3 px-6 rounded-lg text-sm transition-all hover:opacity-90 min-h-[44px]"
          style={{ backgroundColor: "#0099CC" }}
        >
          {currentQ === QUESTIONS.length - 1 ? "Continue to Agreement" : "Next"}
          <ChevronRight size={16} />
        </button>
      </div>
    </AppLayout>
  );
}
