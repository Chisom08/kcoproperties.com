import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/features/rental/components/AppLayout";
import { BotMessage } from "@/features/rental/components/OmiaBot";
import { SaveProgress } from "@/features/rental/components/SaveProgress";
import { ChevronRight, ChevronLeft, CheckCircle2, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Each Yes/No question can have an explanation field that appears when "yes" is selected.
// Text-only questions (type: "text") always show a textarea.
interface Question {
  id: string;
  text: string;
  type: "yesno" | "text";
  explanationId?: string;          // field key for the explanation text
  explanationPrompt?: string;      // label shown above the textarea
  explanationPlaceholder?: string; // placeholder inside the textarea
  requiresExplanation?: boolean;   // if true, explanation is REQUIRED when Yes is selected
  optional?: boolean;
  placeholder?: string;            // for type:"text" questions
}

// High-risk questions that REQUIRE an explanation when answered "Yes"
const HIGH_RISK_QUESTIONS = new Set([
  "beenSued",
  "brokenLease",
  "convictedFelony",
  "filedBankruptcy",
  "lockedOutBySheriff",
  "landlordProblems",
]);

const QUESTIONS: Question[] = [
  {
    id: "beenSued",
    text: "Have you ever been <strong>sued</strong> for unpaid bills?",
    type: "yesno",
    explanationId: "beenSued_explanation",
    explanationPrompt: "Please provide details about the lawsuit(s):",
    explanationPlaceholder: "e.g., When, by whom, outcome...",
    requiresExplanation: true,
  },
  {
    id: "brokenLease",
    text: "Have you ever <strong>broken a lease</strong>?",
    type: "yesno",
    explanationId: "brokenLease_explanation",
    explanationPrompt: "Please explain the circumstances:",
    explanationPlaceholder: "e.g., When, why, how it was resolved...",
    requiresExplanation: true,
  },
  {
    id: "convictedFelony",
    text: "Have you ever been <strong>convicted of a felony</strong>?",
    type: "yesno",
    explanationId: "convictedFelony_explanation",
    explanationPrompt: "Please provide details about the conviction:",
    explanationPlaceholder: "e.g., Nature of offense, date, jurisdiction...",
    requiresExplanation: true,
  },
  {
    id: "moveInAmountAvailable",
    text: "Is the total <strong>move-in amount available</strong> now?",
    type: "yesno",
    // No explanation needed for "Yes" — only relevant if "No"
    explanationId: "moveInAmount_explanation",
    explanationPrompt: "Please explain when the funds will be available:",
    explanationPlaceholder: "e.g., Expected date, source of funds...",
    // We'll show the explanation only on "no" for this question — handled via logic below
  },
  {
    id: "filedBankruptcy",
    text: "Have you <strong>filed for bankruptcy</strong>?",
    type: "yesno",
    explanationId: "filedBankruptcy_explanation",
    explanationPrompt: "Please provide details (type, year, discharge status):",
    explanationPlaceholder: "e.g., Chapter 7, filed 2019, discharged 2020...",
    requiresExplanation: true,
  },
  {
    id: "rentPlanDuration",
    text: "How long do you <strong>plan to rent</strong> this home?",
    type: "text",
    placeholder: "e.g., 1 year, 2 years, month-to-month...",
  },
  {
    id: "lockedOutBySheriff",
    text: "Have you ever been <strong>locked out by a sheriff</strong>?",
    type: "yesno",
    explanationId: "lockedOutBySheriff_explanation",
    explanationPrompt: "Please explain the circumstances:",
    explanationPlaceholder: "e.g., When, property address, reason...",
    requiresExplanation: true,
  },
  {
    id: "servedLateRentNote",
    text: "Have you ever been <strong>served a late rent notice</strong>?",
    type: "yesno",
    explanationId: "servedLateRentNote_explanation",
    explanationPrompt: "Please provide details:",
    explanationPlaceholder: "e.g., How many times, circumstances...",
  },
  {
    id: "occupantsSmoke",
    text: "Do you or any <strong>proposed occupants smoke</strong>?",
    type: "yesno",
    explanationId: "occupantsSmoke_explanation",
    explanationPrompt: "Please specify who smokes and where (indoors/outdoors):",
    explanationPlaceholder: "e.g., Applicant smokes outdoors only...",
  },
  {
    id: "landlordProblems",
    text: "Have you had any <strong>recurring problems</strong> with your current apartment or landlord?",
    type: "yesno",
    explanationId: "landlordProblemsExplanation",
    explanationPrompt: "Please describe the recurring problems:",
    explanationPlaceholder: "e.g., Maintenance issues, disputes, noise complaints...",
    requiresExplanation: true,
  },
  {
    id: "additionalIncomeSource",
    text: "List any <strong>verifiable sources and amounts of income</strong> you wish to have considered:",
    type: "text",
    placeholder: "e.g., Rental income $500/mo, Social Security $800/mo...",
    optional: true,
  },
  {
    id: "creditCheckComment",
    text: "We may run a <strong>credit check and criminal background check</strong>. Is there anything negative we will find that you want to comment on?",
    type: "text",
    placeholder: "Enter any comments here, or type 'None'...",
    optional: true,
  },
  {
    id: "petsInfo",
    text: "How many <strong>pets</strong> do you have? Please list Type, Breed, approximate Weight & Age:",
    type: "text",
    placeholder: "e.g., Dog, Labrador, 50 lbs, 3 years old. Or type 'None'...",
    optional: true,
  },
  {
    id: "howHeardAboutHome",
    text: "How did you <strong>hear about this home</strong>?",
    type: "text",
    placeholder: "e.g., Zillow, Referral, Drive-by, Social media...",
  },
];

// For the moveInAmountAvailable question, the explanation shows on "no" not "yes"
const SHOW_EXPLANATION_ON_NO = new Set(["moveInAmountAvailable"]);

type DataRecord = Record<string, string>;

export default function GeneralInfo() {
  const [, navigate] = useLocation();
  const appId = localStorage.getItem("kco_app_id");

  // All answers stored in a flat record: { questionId: "yes"|"no"|text, explanationId: text, ... }
  const [data, setData] = useState<DataRecord>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [explanationError, setExplanationError] = useState(false);
  const explanationRef = useRef<HTMLTextAreaElement>(null);

  // Load saved application data
  const { data: savedApplication } = trpc.rental.application.getApplication.useQuery(
    { applicationId: Number(appId) },
    { enabled: !!appId, refetchOnWindowFocus: false }
  );

  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!appId) navigate("/rental/signup");
  }, [appId, navigate]);

  // Load saved data when application data is available
  useEffect(() => {
    if (savedApplication && !dataLoaded) {
      // Restore all question answers from saved application
      const savedData: DataRecord = {};
      
      QUESTIONS.forEach((q) => {
        const value = savedApplication[q.id as keyof typeof savedApplication];
        if (value !== null && value !== undefined && value !== "") {
          savedData[q.id] = String(value);
        }
        if (q.explanationId) {
          const explanationValue = savedApplication[q.explanationId as keyof typeof savedApplication];
          if (explanationValue !== null && explanationValue !== undefined && explanationValue !== "") {
            savedData[q.explanationId] = String(explanationValue);
          }
        }
      });

      setData(savedData);
      setDataLoaded(true);
    }
  }, [savedApplication, dataLoaded]);

  // Auto-focus explanation textarea when it appears
  useEffect(() => {
    const q = QUESTIONS[currentIndex];
    if (!q) return;
    const answer = data[q.id];
    const showExplanation =
      q.explanationId &&
      (SHOW_EXPLANATION_ON_NO.has(q.id) ? answer === "no" : answer === "yes");
    if (showExplanation) {
      setTimeout(() => explanationRef.current?.focus(), 100);
    }
  }, [data, currentIndex]);

  const saveDraftMutation = trpc.rental.application.saveDraft.useMutation({
    onError: (err) => {
      toast.error("Failed to save: " + err.message);
      setIsSaving(false);
    },
  });

  const currentQ = QUESTIONS[currentIndex];
  const progress = Math.round(((currentIndex + 1) / QUESTIONS.length) * 100);

  const handleAnswer = (value: string) => {
    setData((prev) => ({ ...prev, [currentQ.id]: value }));
    setExplanationError(false); // clear error when answer changes
  };

  const handleExplanation = (value: string) => {
    if (!currentQ.explanationId) return;
    setData((prev) => ({ ...prev, [currentQ.explanationId!]: value }));
    if (value.trim()) setExplanationError(false); // clear error when user starts typing
  };

  const handleNext = async () => {
    if (!currentQ.optional && !data[currentQ.id]) {
      toast.error("Please answer this question before continuing.");
      return;
    }

    // For high-risk questions: require explanation when Yes is selected
    const isHighRisk = HIGH_RISK_QUESTIONS.has(currentQ.id);
    const answeredYes = data[currentQ.id] === "yes";
    const explanationFilled = currentQ.explanationId
      ? (data[currentQ.explanationId] || "").trim().length > 0
      : true;
    if (isHighRisk && answeredYes && !explanationFilled) {
      setExplanationError(true);
      toast.error("Please provide an explanation before continuing.");
      setTimeout(() => explanationRef.current?.focus(), 100);
      return;
    }

    const isLast = currentIndex >= QUESTIONS.length - 1;

    if (isLast) {
      setIsSaving(true);
      await saveDraftMutation.mutateAsync({
        applicationId: Number(appId),
        step: 7,
        data: { ...data },
      });
      setIsSaving(false);
      navigate("/rental/apply/agreement");
    } else {
      // Auto-save every 3 steps
      if ((currentIndex + 1) % 3 === 0) {
        saveDraftMutation.mutate({
          applicationId: Number(appId),
          step: 6,
          data: { ...data },
        });
      }
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else {
      navigate("/rental/apply/emergency");
    }
  };

  if (!currentQ) return null;

  const currentValue = data[currentQ.id] || "";
  const isLast = currentIndex >= QUESTIONS.length - 1;

  // Determine whether to show the explanation textarea
  const showExplanation =
    currentQ.type === "yesno" &&
    currentQ.explanationId &&
    (SHOW_EXPLANATION_ON_NO.has(currentQ.id)
      ? currentValue === "no"
      : currentValue === "yes");

  const isHighRisk = HIGH_RISK_QUESTIONS.has(currentQ.id);
  const isRequiredExplanation = isHighRisk && currentValue === "yes";

  const explanationValue = currentQ.explanationId ? data[currentQ.explanationId] || "" : "";

  // Contextual coaching messages for high-risk Yes answers
  const HIGH_RISK_COACHING: Record<string, string> = {
    beenSued:
      "No worries — being sued doesn't automatically disqualify you. We review every application fairly. Just give us a brief description of what happened and how it was resolved, and we'll take it from there.",
    brokenLease:
      "Life happens, and we understand that. A broken lease in the past doesn't mean we can't work together. Please share the circumstances — context makes all the difference in our review.",
    convictedFelony:
      "Thank you for your honesty — it means a lot. We review each situation individually and consider rehabilitation and time elapsed. Please provide the details below so we can give your application a fair and thorough review.",
    filedBankruptcy:
      "Bankruptcy is a legal fresh start, and many people have been in that situation. Please share the type, year, and current status so we can understand your financial journey and assess your application fairly.",
    lockedOutBySheriff:
      "We appreciate your transparency. Please describe the circumstances — including when it happened and how things were resolved. Every situation is different, and we want to give you a fair chance.",
    landlordProblems:
      "We know that landlord-tenant issues can go both ways. Please describe what happened — whether it was a maintenance dispute, communication breakdown, or something else. Your perspective matters to us.",
  };

  // Default intro and progress messages
  const DEFAULT_BOT_MESSAGES: Record<number, string> = {
    0: "Now we need some general information. I'll ask you a few questions — just answer Yes or No. If you answer Yes, a box will appear for you to provide more details.",
    6: "You're doing great — halfway through! Just a few more questions and we'll move on to the final step.",
    10: "Almost there! These last few questions help us complete your profile. Take your time.",
  };

  // Determine the active bot message
  let botMessage: string;
  if (isHighRisk && currentValue === "yes" && HIGH_RISK_COACHING[currentQ.id]) {
    botMessage = HIGH_RISK_COACHING[currentQ.id];
  } else if (currentQ.type === "yesno" && currentValue === "yes" && !isHighRisk) {
    botMessage = "Got it! Please provide any additional details in the box below if you'd like, then click Next to continue.";
  } else if (currentQ.type === "yesno" && currentValue === "no") {
    botMessage = "Great, noted! Click Next whenever you're ready to continue.";
  } else {
    botMessage =
      DEFAULT_BOT_MESSAGES[currentIndex] ||
      `Question ${currentIndex + 1} of ${QUESTIONS.length} — take your time, there's no rush.`;
  }

  return (
    <AppLayout currentStep={6}>
      <SaveProgress applicationId={Number(appId)} currentStep={6} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Section title */}
        <h2 className="text-xl font-bold text-[#1a3a5c] mb-2">General Information</h2>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#0099CC] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {currentIndex + 1}/{QUESTIONS.length}
          </span>
        </div>

        {/* Omia bot message — animationKey changes when message content changes, triggering fade */}
        <div className="mb-6">
          <BotMessage animationKey={`${currentIndex}-${currentValue}`}>{botMessage}</BotMessage>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 transition-all">
          {/* Question text */}
          <p
            className="text-base sm:text-lg text-[#1a3a5c] mb-5 leading-relaxed font-medium"
            dangerouslySetInnerHTML={{ __html: currentQ.text }}
          />

          {currentQ.type === "yesno" ? (
            <>
              {/* Yes / No buttons */}
              <div className="flex flex-col min-[360px]:flex-row gap-3 mb-0">
                {(["yes", "no"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={`flex-1 py-4 rounded-xl border-2 font-semibold text-base transition-all duration-150 min-h-[52px] ${
                      currentValue === option
                        ? option === "yes"
                          ? "border-[#0099CC] bg-[#0099CC] text-white shadow-md"
                          : "border-gray-500 bg-gray-500 text-white shadow-md"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {option === "yes" ? "✓  Yes" : "✗  No"}
                  </button>
                ))}
              </div>

              {/* Conditional explanation textarea — slides in when Yes (or No for move-in) */}
              {showExplanation && (
                <div className="mt-5 animate-slide-in">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <MessageSquare size={15} className={isRequiredExplanation ? "text-amber-600" : "text-[#0099CC]"} />
                    <label className="text-sm font-semibold text-[#1a3a5c]">
                      {currentQ.explanationPrompt || "Please provide details:"}
                    </label>
                    {isRequiredExplanation && (
                      <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">
                        REQUIRED
                      </span>
                    )}
                  </div>
                  <textarea
                    ref={explanationRef}
                    value={explanationValue}
                    onChange={(e) => handleExplanation(e.target.value)}
                    placeholder={
                      currentQ.explanationPlaceholder || "Please provide details here..."
                    }
                    rows={4}
                    className={`w-full border-2 rounded-xl px-4 py-3 text-gray-800 focus:outline-none resize-none transition-colors text-sm leading-relaxed ${
                      explanationError
                        ? "border-red-500 focus:border-red-600 bg-red-50"
                        : "border-[#0099CC] focus:border-[#007aad]"
                    }`}
                    style={explanationError ? {} : { backgroundColor: "#f0faff" }}
                  />
                  {explanationError ? (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      ⚠ This explanation is required for high-risk questions. Please provide details before continuing.
                    </p>
                  ) : isRequiredExplanation ? (
                    <p className="text-xs text-amber-600 mt-1 font-medium">
                      ★ Required — please provide details to proceed.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      Optional — but providing details helps speed up your application review.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Free-text questions */
            <textarea
              value={currentValue}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder={currentQ.placeholder || "Type your answer here..."}
              rows={3}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-[#0099CC] resize-none transition-colors"
            />
          )}

          {currentQ.optional && currentQ.type === "text" && (
            <p className="text-sm text-gray-400 mt-2 italic">Optional — you may leave this blank.</p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 font-medium transition-all min-h-[44px]"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={isSaving || (!currentQ.optional && !currentValue)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all min-h-[44px] ${
              isSaving || (!currentQ.optional && !currentValue)
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : isLast
                ? "bg-[#0099CC] hover:bg-[#007aad] text-white shadow-md"
                : "bg-[#1a3a5c] hover:bg-[#142d47] text-white shadow-md"
            }`}
          >
            {isSaving ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : isLast ? (
              <>
                <CheckCircle2 size={18} />
                Continue to Agreement
              </>
            ) : (
              <>
                Next
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
