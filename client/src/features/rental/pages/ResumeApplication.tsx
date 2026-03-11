/**
 * ResumeApplication — /resume/:token
 *
 * Looks up the application by the magic resume token, stores the applicationId
 * in localStorage (same key all other steps use), and redirects the user to the
 * correct step. Shows a friendly loading / error state while the lookup is in
 * progress.
 */
import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, AlertTriangle, Home } from "lucide-react";

const STEP_PATHS: Record<number, string> = {
  1: "/rental",
  2: "/rental/signup",
  3: "/rental/apply/personal",
  4: "/rental/apply/employment",
  5: "/rental/apply/emergency",
  6: "/rental/apply/general-info",
  7: "/rental/apply/agreement",
};

export default function ResumeApplication() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "redirecting" | "error" | "submitted" | "expired">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [applicantName, setApplicantName] = useState<string>("");

  const { data, error, isLoading } = trpc.rental.application.resumeByToken.useQuery(
    { token: token ?? "" },
    { enabled: !!token, retry: false }
  );

  useEffect(() => {
    if (isLoading) return;

    if (error) {
      setStatus("error");
      setErrorMsg("This resume link is invalid or has expired. Please start a new application.");
      return;
    }

    if (!data) {
      setStatus("error");
      setErrorMsg("This resume link could not be found. It may have expired or been used already.");
      return;
    }

    if ('expired' in data && data.expired) {
      setStatus("expired");
      return;
    }

    if (data.alreadySubmitted) {
      setStatus("submitted");
      return;
    }

    // Store the applicationId so all form steps can pick it up
    localStorage.setItem("kco_app_id", String(data.applicationId));

    const name = [data.firstName, data.lastName].filter(Boolean).join(" ") || data.email || "";
    setApplicantName(name);
    setStatus("redirecting");

    const step = data.currentStep ?? 3;
    const path = STEP_PATHS[step] ?? STEP_PATHS[3];

    // Short delay so the user sees the "Welcome back" message
    const timer = setTimeout(() => {
      navigate(path);
    }, 1800);

    return () => clearTimeout(timer);
  }, [data, error, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center space-y-5">

        {/* KCO Logo */}
        <div className="mb-2">
          <span style={{ color: "#0099CC" }} className="text-2xl font-black tracking-wide">KCO</span>
          <span className="text-2xl font-light text-gray-700 tracking-wide"> PROPERTIES</span>
          <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mt-0.5">
            Online Rental Application
          </p>
        </div>

        {status === "loading" && (
          <>
            <Loader2 size={40} className="animate-spin mx-auto" style={{ color: "#0099CC" }} />
            <p className="text-gray-600 font-medium">Retrieving your application…</p>
          </>
        )}

        {status === "redirecting" && (
          <>
            <CheckCircle2 size={48} className="mx-auto text-green-500" />
            <h1 className="text-xl font-bold text-gray-800">
              Welcome back{applicantName ? `, ${applicantName.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your progress has been restored. Taking you back to where you left off…
            </p>
            <div className="flex justify-center">
              <Loader2 size={20} className="animate-spin" style={{ color: "#0099CC" }} />
            </div>
          </>
        )}

        {status === "submitted" && (
          <>
            <CheckCircle2 size={48} className="mx-auto text-green-500" />
            <h1 className="text-xl font-bold text-gray-800">Application Already Submitted</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              This application has already been submitted and is under review by KCO Properties.
              You will be contacted within 2–3 business days.
            </p>
              <button
                onClick={() => navigate("/rental")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 min-h-[44px]"
                style={{ backgroundColor: "#0099CC" }}
              >
                <Home size={15} /> Back to Home
              </button>
          </>
        )}

        {status === "expired" && (
          <>
            <AlertTriangle size={48} className="mx-auto text-amber-500" />
            <h1 className="text-xl font-bold text-gray-800">Resume Link Expired</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              This resume link has expired (links are valid for <strong>30 days</strong>).
              Please log in to continue your application, or start a new one.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => navigate("/rental/signup")}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 min-h-[44px]"
                style={{ backgroundColor: "#0099CC" }}
              >
                Log In to Continue
              </button>
              <button
                onClick={() => navigate("/rental")}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all min-h-[44px]"
              >
                <Home size={15} /> Start a New Application
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <AlertTriangle size={48} className="mx-auto text-amber-500" />
            <h1 className="text-xl font-bold text-gray-800">Link Not Found</h1>
            <p className="text-gray-500 text-sm leading-relaxed">{errorMsg}</p>
            <button
              onClick={() => navigate("/rental")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 min-h-[44px]"
              style={{ backgroundColor: "#0099CC" }}
            >
              <Home size={15} /> Start a New Application
            </button>
          </>
        )}
      </div>
    </div>
  );
}
