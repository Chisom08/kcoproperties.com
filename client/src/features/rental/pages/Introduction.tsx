import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/features/rental/components/AppLayout";
import { BotMessage } from "@/features/rental/components/OmiaBot";
import { Shield, FileText, ChevronRight, IdCard, UserSearch, Receipt } from "lucide-react";

export default function Introduction() {
  const [, navigate] = useLocation();

  return (
    <AppLayout currentStep={1} showProgress={true}>
      {/* Page Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          KCO Online Rental Application
        </h1>
        <p className="text-gray-500 text-sm">
          Your guided application experience — powered by Omia
        </p>
      </div>

      {/* Omia Greeting */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 animate-slide-in">
        <BotMessage>
          Hi! I'm Omia, your interactive Assistant! I'll guide you through your rental application.
        </BotMessage>

        {/* What You'll Need Section */}
        <div className="mt-2 mb-1">
          <p className="text-gray-600 text-sm italic mb-4">
            Before we begin, please make sure you have the following ready:
          </p>

          <div className="space-y-5">
            {/* Photo ID */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(0,153,204,0.1)" }}>
                <IdCard size={28} style={{ color: "#0099CC" }} />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  First, do you have your <strong>Photo ID</strong>
                </p>
                <p className="text-gray-500 text-sm mt-0.5">
                  A photo copy of your driver's license, Passport, or Military ID, etc.
                </p>
              </div>
            </div>

            {/* Landlord Contact */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(0,153,204,0.1)" }}>
                <UserSearch size={28} style={{ color: "#0099CC" }} />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  <strong>Landlord</strong> <em>Contact Information,</em>
                </p>
                <p className="text-gray-500 text-sm mt-0.5">
                  Phone number or email address of your previous landlords for references
                </p>
              </div>
            </div>

            {/* Proof of Income */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(0,153,204,0.1)" }}>
                <Receipt size={28} style={{ color: "#0099CC" }} />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  And <strong>Proof of Income</strong> handy?
                </p>
                <p className="text-gray-500 text-sm mt-0.5">
                  Proof employment or income like a <strong>W2 or Paystub</strong> or <strong>bank statements</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclosures Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 animate-slide-in" style={{ animationDelay: "0.1s" }}>
        <BotMessage>
          Just so you know, your information is secured and if we run a background check on you, there's no impact to your credit score because:
        </BotMessage>

        <div className="mt-2">
          <h3 className="font-bold text-gray-800 text-center text-base mb-4">Disclosures</h3>

          <div className="space-y-5">
            {/* TransUnion */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(0,153,204,0.1)" }}>
                <Shield size={28} style={{ color: "#0099CC" }} />
              </div>
              <div>
                <p className="text-gray-700 text-sm">
                  We use <strong>TransUnion</strong> to run a background and soft inquiry report of credit but it will{" "}
                  <strong>never affect your credit score.</strong>
                </p>
              </div>
            </div>

            {/* Information Secured */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(0,153,204,0.1)" }}>
                <FileText size={28} style={{ color: "#0099CC" }} />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm mb-1">Your information is secured</p>
                <p className="text-gray-500 text-sm">
                  We never share your information in the application with any organization or person. Your information is secure and destroyed if you choose not to proceed with us or you were not rented to.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => navigate("/rental/signup")}
          className="flex items-center gap-2 text-white font-bold py-3 px-8 rounded-lg text-base transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-95 min-h-[44px]"
          style={{ backgroundColor: "#CC0000", minWidth: 220 }}
          aria-label="Proceed to sign up"
        >
          Get Started
          <ChevronRight size={18} />
        </button>
      </div>
    </AppLayout>
  );
}
