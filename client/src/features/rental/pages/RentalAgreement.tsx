import React, { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { AppLayout } from "@/features/rental/components/AppLayout";
import { BotMessage } from "@/features/rental/components/OmiaBot";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ChevronLeft,
  PenLine,
  RotateCcw,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  ExternalLink,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { allowOnlyText } from "@/lib/inputValidation";

const RENTAL_TERMS = `By submitting this application, I/we authorize KCO Properties, LLC to verify all information provided in this application, including but not limited to employment, income, rental history, and credit history. I/we understand that a background check and soft credit inquiry will be performed through TransUnion, which will NOT affect my/our credit score.

I/we certify that all information provided in this application is true and accurate to the best of my/our knowledge. I/we understand that any misrepresentation or omission of facts may result in the rejection of this application or termination of any lease agreement.

I/we agree that this application does not constitute a lease agreement and that KCO Properties, LLC reserves the right to accept or reject this application based on their screening criteria.

I/we acknowledge that the application fee is non-refundable. I/we understand that my/our personal information will be kept confidential and will not be shared with third parties except as required by law or for the purpose of processing this application.

I/we agree to the Terms of Use and Privacy Policy of KCO Properties, LLC.`;

// ---------------------------------------------------------------------------
// PaymentConfirmDialog — modal that appears before Stripe redirect
// ---------------------------------------------------------------------------
interface PaymentConfirmDialogProps {
  applicantName: string;
  applicationId: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

function PaymentConfirmDialog({
  applicantName,
  applicationId,
  onConfirm,
  onCancel,
  isLoading,
}: PaymentConfirmDialogProps) {
  // Trap focus inside dialog and close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isLoading, onCancel]);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-dialog-title"
    >
      {/* Panel */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-[#0099CC]" />
            <h2 id="pay-dialog-title" className="font-bold text-gray-800 text-base">
              Confirm Payment
            </h2>
          </div>
          {!isLoading && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancel payment"
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {/* Charge summary */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
              <span className="text-sm text-gray-600">Application &amp; Background Check Fee</span>
              <span className="font-bold text-gray-800 text-base">$50.00</span>
            </div>
            <div className="px-4 py-2 space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Applicant</span>
                <span className="font-medium text-gray-700 truncate max-w-[160px]">
                  {applicantName || "—"}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Application ID</span>
                <span className="font-medium text-gray-700">#{applicationId}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Processed via</span>
                <span className="font-medium text-gray-700">Stripe (SSL Encrypted)</span>
              </div>
            </div>
          </div>

          {/* Non-refundable warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>This charge is non-refundable.</strong> The $50.00 fee covers the cost
              of your background and credit check regardless of the application outcome.
            </p>
          </div>

          {/* Redirect notice */}
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            You will be redirected to Stripe's secure checkout page. After payment you will
            return here automatically to sign and submit.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-60 min-h-[44px]"
            style={{ backgroundColor: "#0099CC" }}
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Redirecting…
              </>
            ) : (
              <>
                {/* <CreditCard size={15} /> */}
                Confirm &amp; Pay $50.00
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function RentalAgreement() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const applicationId = Number(localStorage.getItem("kco_app_id") || "0");
  const applicantName = localStorage.getItem("kco_app_name") || "";

  const [signatureType, setSignatureType] = useState<"type" | "draw">("type");
  const [typedSignature, setTypedSignature] = useState(applicantName);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);

  // Confirmation dialog state
  const [showPayConfirm, setShowPayConfirm] = useState(false);

  // True while we are verifying the Stripe session after redirect.
  // During this window the Pay button is hidden to prevent the dialog
  // from re-opening before isPaid has been updated by the refetch.
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(() => {
    // Detect a returning Stripe redirect on the very first render so we
    // suppress the Pay button immediately, before any useEffect runs.
    const params = new URLSearchParams(window.location.search);
    return params.get("payment") === "success" && !!params.get("session_id");
  });

  const [signatureDate] = useState(() =>
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );

  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const uploadFileMutation = trpc.rental.upload.uploadFile.useMutation();
  const saveDraftMutation = trpc.rental.application.saveDraft.useMutation();
  const createCheckoutMutation = trpc.rental.payment.createCheckoutSession.useMutation();
  const verifyCheckoutMutation = trpc.rental.payment.verifyCheckoutSession.useMutation();

  // React Query utilities for cache invalidation
  const utils = trpc.useUtils();

  const {
    data: paymentData,
    isLoading: paymentLoading,
    refetch: refetchPayment,
  } = trpc.rental.payment.getPaymentStatus.useQuery(
    { applicationId },
    { enabled: !!applicationId, refetchOnWindowFocus: true }
  );

  const isPaid = paymentData?.paymentStatus === "paid";

  const submitMutation = trpc.rental.application.submit.useMutation({
    onSuccess: () => {
      navigate("/rental/apply/confirmation");
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Submission failed. Please try again.";
      toast.error(message);
      setIsSubmitting(false);
    },
  });

  // Handle return from Stripe Checkout
  useEffect(() => {
    if (!applicationId) return;
    const params = new URLSearchParams(searchString);
    const paymentResult = params.get("payment");
    const sessionId = params.get("session_id");

    if (paymentResult === "success" && sessionId) {
      // Keep isVerifyingPayment=true (set in useState initialiser) until
      // the refetch resolves so the Pay button stays hidden the whole time.
      setIsVerifyingPayment(true);
      // Clean the URL immediately so a manual refresh doesn't re-trigger
      window.history.replaceState({}, "", "/rental/apply/agreement");

      verifyCheckoutMutation.mutate(
        { applicationId, sessionId },
        {
          onSuccess: async (data) => {
            if (data.paid) {
              // Invalidate the payment status query cache to force a fresh fetch
              await utils.rental.payment.getPaymentStatus.invalidate({ applicationId });
              // Refetch the payment status to update isPaid immediately
              await refetchPayment({ throwOnError: false });
              // Auto-check the agreement checkbox since payment confirms agreement
              setHasAgreed(true);
              toast.success("Payment confirmed! You may now sign and submit your application.");
            } else {
              toast.error("Payment verification failed. Please contact support.");
            }
            setIsVerifyingPayment(false);
          },
          onError: () => {
            toast.error("Could not verify payment. Please refresh the page.");
            setIsVerifyingPayment(false);
          },
        }
      );
    } else if (paymentResult === "cancelled") {
      toast.info("Payment was cancelled. You can try again when ready.");
      window.history.replaceState({}, "", "/rental/apply/agreement");
      setIsVerifyingPayment(false);
    }
  }, [applicationId, searchString, refetchPayment, utils]);

  useEffect(() => {
    if (!applicationId) navigate("/rental/signup");
  }, [applicationId]);

  const clearSignature = () => {
    sigCanvasRef.current?.clear();
  };

  // Step 1: user clicks "Pay $50.00" → open confirmation dialog
  const handlePayNowClick = () => {
    if (!applicationId) return;
    // If already paid, just refresh status — no dialog needed
    if (isPaid) {
      toast.success("Your payment is already confirmed!");
      refetchPayment();
      return;
    }
    setShowPayConfirm(true);
  };

  // Step 2: user confirms in dialog → actually redirect to Stripe
  const handleConfirmPayment = async () => {
    setIsRedirectingToPayment(true);
    try {
      const result = await createCheckoutMutation.mutateAsync({ applicationId });
      if (result.alreadyPaid) {
        toast.success("Your payment is already confirmed!");
        refetchPayment();
        setShowPayConfirm(false);
        return;
      }
      if (result.url) {
        toast.info("Redirecting to secure payment page…");
        window.location.href = result.url;
        // Note: dialog stays open / loading until navigation completes
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not start payment. Please try again.";
      toast.error(message);
      setIsRedirectingToPayment(false);
      setShowPayConfirm(false);
    }
  };

  const handleCancelPayment = () => {
    setShowPayConfirm(false);
  };

  const handleSubmit = async () => {
    if (!hasAgreed) {
      toast.error("Please agree to the terms before submitting.");
      return;
    }
    if (!isPaid) {
      toast.error("Please complete the application fee payment before submitting.");
      return;
    }
    if (signatureType === "type" && !typedSignature.trim()) {
      toast.error("Please type your full name as your signature.");
      return;
    }
    if (signatureType === "draw" && sigCanvasRef.current?.isEmpty()) {
      toast.error("Please draw your signature.");
      return;
    }

    setIsSubmitting(true);

    try {
      let signatureDrawUrl = "";

      if (
        signatureType === "draw" &&
        sigCanvasRef.current &&
        !sigCanvasRef.current.isEmpty()
      ) {
        const dataUrl = sigCanvasRef.current.toDataURL("image/png");
        const result = await uploadFileMutation.mutateAsync({
          applicationId,
          fileType: "signature",
          fileName: "signature.png",
          contentType: "image/png",
          base64Data: dataUrl,
        });
        signatureDrawUrl = result.url;
      }

      await saveDraftMutation.mutateAsync({
        applicationId,
        step: 7,
        data: {
          signatureName: signatureType === "type" ? typedSignature : "",
          signatureDrawUrl,
          signatureDate,
        },
      });

      submitMutation.mutate({ applicationId });
    } catch {
      toast.error("Error saving signature. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout currentStep={7} showProgress={true}>
      {/* Payment confirmation dialog — rendered above everything else */}
      {showPayConfirm && (
        <PaymentConfirmDialog
          applicantName={applicantName}
          applicationId={applicationId}
          onConfirm={handleConfirmPayment}
          onCancel={handleCancelPayment}
          isLoading={isRedirectingToPayment}
        />
      )}

      <div className="mb-4">
        <h2 className="section-heading">Rental Agreement &amp; Signature</h2>
      </div>

      {/* Bot message */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 animate-slide-in">
        <BotMessage>
          {isPaid
            ? "Payment confirmed! Please review the agreement, sign below, and submit your application."
            : "Almost there! Please review the rental agreement, complete the application fee payment, then sign to submit."}
        </BotMessage>
      </div>

      {/* Agreement Text */}
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 animate-slide-in"
        style={{ animationDelay: "0.1s" }}
      >
        <h3 className="font-bold text-gray-800 mb-4 text-center">
          KCO Properties, LLC — Rental Application Agreement
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed max-h-48 overflow-y-auto border border-gray-200">
          {RENTAL_TERMS}
        </div>

        {/* TransUnion Disclosure */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <ShieldCheck size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800 leading-relaxed">
            <strong>TransUnion Background Check Disclosure:</strong> By proceeding, you
            authorize KCO Properties, LLC to obtain a consumer report through TransUnion
            for tenant screening purposes. This is a <em>soft inquiry</em> and will{" "}
            <strong>not</strong> affect your credit score. The $50.00 application fee
            covers the cost of this background check and is non-refundable.
          </p>
        </div>

        {/* Agree checkbox */}
        <label className="flex items-start gap-3 mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={hasAgreed}
            onChange={(e) => setHasAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#0099CC]"
          />
          <span className="text-sm text-gray-700">
            I have read and agree to the terms of this rental application agreement,
            including the TransUnion background check authorization.
          </span>
        </label>
      </div>

      {/* Payment Section */}
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 animate-slide-in"
        style={{ animationDelay: "0.15s" }}
      >
        <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
          <CreditCard size={18} className="text-[#0099CC]" />
          Application Fee Payment
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          A one-time, non-refundable fee is required to process your application and
          background check.
        </p>

        {paymentLoading || isVerifyingPayment ? (
          <div className="flex items-center gap-2 text-gray-400 py-4">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">
              {isVerifyingPayment ? "Confirming your payment…" : "Checking payment status…"}
            </span>
          </div>
        ) : isPaid ? (
          /* Paid state */
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 size={22} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800 text-sm">
                Payment Confirmed — $50.00
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                Your application fee has been received. You may now sign and submit.
              </p>
            </div>
          </div>
        ) : (
          /* Unpaid state */
          <div className="space-y-4">
            {/* Fee breakdown */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
                <span className="text-sm text-gray-600">Application &amp; Background Check Fee</span>
                <span className="font-bold text-gray-800">$50.00</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2">
                <span className="text-xs text-gray-400">Processed securely via Stripe</span>
                <div className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-400">SSL Encrypted</span>
                </div>
              </div>
            </div>

            {/* Pay button — opens confirmation dialog */}
            <button
              type="button"
              onClick={handlePayNowClick}
              disabled={showPayConfirm || isRedirectingToPayment || !hasAgreed}
              className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 px-6 rounded-lg text-base transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
              style={{ backgroundColor: "#0099CC" }}
            >
              <CreditCard size={16} />
              Pay $50.00 — Secure Checkout
              <ExternalLink size={14} className="opacity-70" />
            </button>

            {!hasAgreed && (
              <p className="text-xs text-amber-600 text-center">
                Please agree to the terms above before proceeding to payment.
              </p>
            )}

            <p className="text-xs text-gray-400 text-center">
              You will be redirected to Stripe's secure payment page. After payment, you
              will return here to sign and submit your application.
            </p>
          </div>
        )}
      </div>

      {/* Signature Section — only shown after payment */}
      {isPaid && (
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 animate-slide-in"
          style={{ animationDelay: "0.2s" }}
        >
          <BotMessage>
            Please sign below. You can type your name or draw your signature.
          </BotMessage>

          {/* Signature type toggle */}
          <div className="flex gap-2 mt-4 mb-4">
            <button
              type="button"
              onClick={() => setSignatureType("type")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                signatureType === "type"
                  ? "text-white border-transparent"
                  : "text-gray-600 border-gray-300"
              }`}
              style={
                signatureType === "type"
                  ? { backgroundColor: "#0099CC", borderColor: "#0099CC" }
                  : {}
              }
            >
              Type Signature
            </button>
            <button
              type="button"
              onClick={() => setSignatureType("draw")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                signatureType === "draw"
                  ? "text-white border-transparent"
                  : "text-gray-600 border-gray-300"
              }`}
              style={
                signatureType === "draw"
                  ? { backgroundColor: "#0099CC", borderColor: "#0099CC" }
                  : {}
              }
            >
              <PenLine size={14} /> Draw Signature
            </button>
          </div>

          {signatureType === "type" ? (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Type your full legal name
              </label>
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => setTypedSignature(allowOnlyText(e.target.value))}
                placeholder="Full Legal Name"
                className="w-full border-b-2 border-gray-400 px-2 py-2 text-xl focus:outline-none"
                style={{
                  fontFamily: "'Dancing Script', cursive, serif",
                  borderColor: typedSignature ? "#0099CC" : undefined,
                  color: "#1a1a2e",
                }}
              />
              <p className="text-xs text-gray-400 mt-1">
                This typed name constitutes your legal electronic signature.
              </p>
            </div>
          ) : (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Draw your signature in the box below
              </label>
              <div className="relative">
                <p className="text-xs text-[#0099CC] font-semibold mb-1 text-center tracking-wide">
                  ✏️  Sign here — draw with your finger or mouse
                </p>
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor="#1a1a2e"
                  canvasProps={{
                    width: 600,
                    height: 150,
                    className:
                      "signature-canvas w-full border-2 border-dashed border-gray-300 rounded-lg bg-gray-50",
                    style: {
                      maxWidth: "100%",
                      height: 150,
                      touchAction: "none",
                      display: "block",
                    },
                  }}
                />
                <button
                  type="button"
                  onClick={clearSignature}
                  className="absolute top-2 right-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                >
                  <RotateCcw size={12} /> Clear
                </button>
              </div>
            </div>
          )}

          {/* Date */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Date:</span>
            <span>{signatureDate}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => navigate("/rental/apply/general-info")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium py-3 px-5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all min-h-[44px]"
        >
          <ChevronLeft size={16} /> Back
        </button>

        {isPaid && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !hasAgreed}
            className="flex items-center gap-2 text-white font-bold py-3 px-8 rounded-lg text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            style={{ backgroundColor: "#CC0000" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                SUBMIT APPLICATION
              </>
            )}
          </button>
        )}
      </div>
    </AppLayout>
  );
}
