/**
 * SaveProgress — floating "Save & Resume Later" button + modal
 *
 * Usage:
 *   <SaveProgress applicationId={123} currentStep={4} />
 *
 * The component:
 *  1. Calls trpc.application.getResumeLink on demand (not on mount)
 *  2. Shows the unique resume URL with a copy-to-clipboard button
 *  3. Offers "Email me this link" which calls trpc.application.sendResumeEmail
 */
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Bookmark,
  X,
  Copy,
  Check,
  Mail,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

interface SaveProgressProps {
  applicationId: number;
  /** The step number the user is currently on (used to save currentStep before generating link) */
  currentStep: number;
}

export function SaveProgress({ applicationId, currentStep }: SaveProgressProps) {
  const [open, setOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const [expiresIn, setExpiresIn] = useState<string | null>(null);
  const getResumeLinkMutation = trpc.rental.application.getResumeLink.useMutation();
  const sendResumeEmailMutation = trpc.rental.application.sendResumeEmail.useMutation();
  const saveDraftMutation = trpc.rental.application.saveDraft.useMutation();

  const handleOpen = async () => {
    setOpen(true);
    if (resumeUrl) return; // already generated
    setIsGenerating(true);
    try {
      // Save current step first so the resume link lands on the right page
      await saveDraftMutation.mutateAsync({ applicationId, step: currentStep, data: {} });
      const result = await getResumeLinkMutation.mutateAsync({ applicationId });
      setResumeUrl(result.resumeUrl);
      if (result.expiresIn) setExpiresIn(result.expiresIn);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not generate resume link.";
      toast.error(msg);
      setOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!resumeUrl) return;
    try {
      await navigator.clipboard.writeText(resumeUrl);
      setCopied(true);
      toast.success("Resume link copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Could not copy — please copy the link manually.");
    }
  };

  const handleEmailMe = async () => {
    if (!resumeUrl) return;
    setIsSendingEmail(true);
    try {
      await sendResumeEmailMutation.mutateAsync({ applicationId, resumeUrl });
      setEmailSent(true);
      toast.success("Resume link sent to your email!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send email.";
      toast.error(msg);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset email-sent state so next open shows the button again
    setEmailSent(false);
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        title="Save & Resume Later"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg transition-all hover:opacity-90 active:scale-95 min-h-[44px]"
        style={{ backgroundColor: "#0099CC" }}
        aria-label="Save progress and resume later"
      >
        <Bookmark size={16} />
        <span className="hidden sm:inline">Save Progress</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.50)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-progress-title"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bookmark size={18} style={{ color: "#0099CC" }} />
                <h2 id="save-progress-title" className="font-bold text-gray-800 text-base">
                  Save &amp; Resume Later
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-4">
              {isGenerating ? (
                <div className="flex items-center justify-center gap-2 py-6 text-gray-400">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">Generating your resume link…</span>
                </div>
              ) : resumeUrl ? (
                <>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your progress has been saved. Use the link below to return to your
                    application at any time — no password required.
                  </p>

                  {/* Link box */}
                  <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <ExternalLink size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 truncate flex-1 font-mono">
                      {resumeUrl}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all min-h-[32px] flex-shrink-0"
                      style={{
                        backgroundColor: copied ? "#d1fae5" : "#e0f5fc",
                        color: copied ? "#065f46" : "#0099CC",
                      }}
                    >
                      {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>

                  {/* Security warning */}
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong>Keep this link private.</strong> Anyone with this link can
                      access and edit your application. Do not share it with others.
                      {expiresIn && <> This link expires in <strong>{expiresIn}</strong>.</>}
                    </p>
                  </div>

                  {/* Email me */}
                  {emailSent ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <Check size={15} className="text-green-600 flex-shrink-0" />
                      <p className="text-sm text-green-800 font-medium">
                        Resume link sent to your email!
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEmailMe}
                      disabled={isSendingEmail}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 min-h-[44px]"
                    >
                      {isSendingEmail ? (
                        <><Loader2 size={15} className="animate-spin" /> Sending…</>
                      ) : (
                        <><Mail size={15} /> Email me this link</>
                      )}
                    </button>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 rounded-xl text-gray-500 font-semibold text-sm hover:bg-gray-50 transition-all min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
