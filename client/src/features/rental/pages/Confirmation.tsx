import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/features/rental/components/AppLayout";
import { BotMessage } from "@/features/rental/components/OmiaBot";
import { CheckCircle2, Home, Mail, Phone } from "lucide-react";

export default function Confirmation() {
  const [, navigate] = useLocation();
  const applicationId = localStorage.getItem("kco_app_id");
  const applicantName = localStorage.getItem("kco_app_name") || "Applicant";

  useEffect(() => {
    if (!applicationId) navigate("/");
  }, [applicationId]);

  return (
    <AppLayout currentStep={7} showProgress={false}>
      <div className="max-w-lg mx-auto text-center py-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0, 153, 204, 0.1)" }}
          >
            <CheckCircle2 size={48} style={{ color: "#0099CC" }} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h1>
        <p className="text-gray-500 text-sm mb-6">Application #{applicationId}</p>

        {/* Bot message */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 text-left animate-slide-in">
          <BotMessage>
            Congratulations, {applicantName.split(" ")[0]}! Your rental application has been successfully submitted to KCO Properties. You'll hear from us soon!
          </BotMessage>
        </div>

        {/* What happens next */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 text-left animate-slide-in" style={{ animationDelay: "0.1s" }}>
          <h3 className="font-bold text-gray-800 mb-4">What Happens Next?</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0099CC" }}>1</div>
              <div>
                <p className="font-semibold text-sm text-gray-700">Application Review</p>
                <p className="text-xs text-gray-500 mt-0.5">Our team will review your application within 1-3 business days.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0099CC" }}>2</div>
              <div>
                <p className="font-semibold text-sm text-gray-700">Background & Credit Check</p>
                <p className="text-xs text-gray-500 mt-0.5">We'll run a soft credit inquiry through TransUnion (no impact to your score).</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0099CC" }}>3</div>
              <div>
                <p className="font-semibold text-sm text-gray-700">Decision Notification</p>
                <p className="text-xs text-gray-500 mt-0.5">You'll receive an email with our decision and next steps.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 text-left animate-slide-in" style={{ animationDelay: "0.2s" }}>
          <h3 className="font-bold text-gray-800 mb-3">Questions? Contact Us</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail size={14} style={{ color: "#0099CC" }} />
              <a href="mailto:info@kcoproperties.com" className="hover:underline" style={{ color: "#0099CC" }}>
                info@kcoproperties.com
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={14} style={{ color: "#0099CC" }} />
              <span>(555) 000-0000</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Home size={14} style={{ color: "#0099CC" }} />
              <a href="https://plaxweb.com/apply/application/" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "#0099CC" }}>
                KCO Properties Website
              </a>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("kco_app_id");
            localStorage.removeItem("kco_app_email");
            localStorage.removeItem("kco_app_name");
            navigate("/");
          }}
          className="text-white font-bold py-3 px-8 rounded-lg text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: "#0099CC" }}
        >
          Return to Home
        </button>
      </div>
    </AppLayout>
  );
}
