import React from "react";
import { CheckCircle2 } from "lucide-react";

const STEPS = [
  { id: 1, label: "Intro" },
  { id: 2, label: "Account" },
  { id: 3, label: "Personal" },
  { id: 4, label: "Employment" },
  { id: 5, label: "Emergency" },
  { id: 6, label: "General" },
  { id: 7, label: "Agreement" },
];

interface AppLayoutProps {
  children: React.ReactNode;
  currentStep?: number;
  showProgress?: boolean;
}

export function AppLayout({ children, currentStep = 1, showProgress = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* KCO Logo */}
            <img
              src="/kco-logo.a3f9b2e4.png"
              alt="KCO Properties Logo"
              width={40}
              height={40}
              className="object-contain flex-shrink-0"
            />
            <div>
              <div className="font-bold text-sm leading-tight" style={{ color: "#1a5276" }}>
                KCO PROPERTIES
              </div>
              <div className="text-xs text-gray-500 leading-tight">Online Rental Application</div>
            </div>
          </div>
          <div className="text-xs text-gray-400 hidden sm:block">
            Powered by <span style={{ color: "#0099CC" }} className="font-semibold">Omia</span>
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="bg-gray-50 border-t border-gray-100">
            <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2">
              <div className="flex items-center justify-between">
                {STEPS.map((step, index) => {
                  const isCompleted = currentStep > step.id;
                  const isActive = currentStep === step.id;

                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                        <div
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                            isCompleted
                              ? "text-white"
                              : isActive
                              ? "text-white ring-2 ring-offset-1"
                              : "text-gray-400 bg-gray-200"
                          }`}
                          style={
                            isCompleted || isActive
                              ? { backgroundColor: "#0099CC" }
                              : {}
                          }
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            step.id
                          )}
                        </div>
                        <span
                          className={`text-xs hidden sm:block ${
                            isActive ? "font-semibold" : "text-gray-400"
                          }`}
                          style={isActive ? { color: "#0099CC" } : {}}
                        >
                          {step.label}
                        </span>
                      </div>
                      {index < STEPS.length - 1 && (
                        <div
                          className="h-0.5 flex-1 mx-0.5 sm:mx-1 transition-all duration-300 mb-3 sm:mb-4"
                          style={{
                            backgroundColor: currentStep > step.id ? "#0099CC" : "#e5e7eb",
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} KCO Properties, LLC. All rights reserved. &nbsp;|&nbsp;
          <a href="#" className="hover:underline" style={{ color: "#0099CC" }}>
            Terms of Use
          </a>{" "}
          &amp;{" "}
          <a href="#" className="hover:underline" style={{ color: "#0099CC" }}>
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
}
