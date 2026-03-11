import React, { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/features/rental/components/AppLayout";
import { BotMessage } from "@/features/rental/components/OmiaBot";
import { Eye, EyeOff, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { allowOnlyText } from "@/lib/inputValidation";

export default function SignUp() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const registerMutation = trpc.rental.application.register.useMutation({
    onSuccess: (data) => {
      if (data.applicationId) {
        localStorage.setItem("kco_app_id", String(data.applicationId));
        localStorage.setItem("kco_app_email", email);
        localStorage.setItem("kco_app_name", fullName);
        navigate("/rental/apply/personal");
      }
    },
    onError: (err) => {
      setIsLoading(false);
      if (err.message?.includes("already exists")) {
        setInlineError("An application with this email already exists.");
        setShowLoginPrompt(true);
      } else {
        setInlineError(err.message || "Registration failed. Please try again.");
        setShowLoginPrompt(false);
      }
    },
  });

  const loginMutation = trpc.rental.application.login.useMutation({
    onSuccess: (data) => {
      if (data.applicationId) {
        localStorage.setItem("kco_app_id", String(data.applicationId));
        localStorage.setItem("kco_app_email", email);
        // Map step numbers to route paths
        const stepRoutes: Record<number, string> = {
          3: "/rental/apply/personal",
          4: "/rental/apply/employment",
          5: "/rental/apply/emergency",
          6: "/rental/apply/general-info",
          7: "/rental/apply/agreement",
        };
        const route = stepRoutes[data.currentStep || 3] || "/rental/apply/personal";
        navigate(route);
      }
    },
    onError: (err) => {
      toast.error(err.message || "Login failed. Please check your credentials.");
      setIsLoading(false);
    },
  });

  // Password criteria
  const hasMinLength = password.length >= 10;
  const hasNumber = /\d/.test(password);
  const isPasswordValid = hasMinLength && hasNumber;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    setShowLoginPrompt(false);
    if (mode === "signup") {
      if (!fullName.trim()) { setInlineError("Please enter your full name."); return; }
      if (!email.trim()) { setInlineError("Please enter your email."); return; }
      if (!isPasswordValid) { setInlineError("Password does not meet the criteria."); return; }
      setIsLoading(true);
      registerMutation.mutate({ fullName, email, password });
    } else {
      if (!email.trim() || !password.trim()) { setInlineError("Please enter your email and password."); return; }
      setIsLoading(true);
      loginMutation.mutate({ email, password });
    }
  };

  const switchToLogin = () => {
    setMode("login");
    setInlineError(null);
    setShowLoginPrompt(false);
    setPassword("");
  };

  return (
    <AppLayout currentStep={2} showProgress={true}>
      <div className="max-w-md mx-auto">
        {/* Bot message */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 animate-slide-in">
          <BotMessage>
            {mode === "signup"
              ? "Let's create your account. It needs to be at least 10 characters long and include at least one number. Got it?"
              : "Welcome back! Please enter your email and password to resume your application."}
          </BotMessage>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-slide-in" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-lg font-bold text-gray-800 mb-5 text-center">
            {mode === "signup" ? "Sign Up to Start Your Application" : "Log In to Your Application"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === "signup" && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(allowOnlyText(e.target.value))}
                  placeholder="Full Name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-all"
                  style={{ borderColor: fullName ? "#0099CC" : undefined }}
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-all"
                style={{ borderColor: email ? "#0099CC" : undefined }}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none transition-all"
                  style={{ borderColor: password && isPasswordValid ? "#0099CC" : password && !isPasswordValid ? "#CC0000" : undefined }}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password Criteria (signup only) */}
            {mode === "signup" && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-semibold text-gray-600 mb-1">Password Criteria</p>
                <div className="flex items-center gap-2 text-xs">
                  {hasMinLength ? (
                    <CheckCircle2 size={13} style={{ color: "#0099CC" }} />
                  ) : (
                    <XCircle size={13} className="text-gray-300" />
                  )}
                  <span className={hasMinLength ? "text-gray-700" : "text-gray-400"}>
                    Must contain at least ten characters
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {hasNumber ? (
                    <CheckCircle2 size={13} style={{ color: "#0099CC" }} />
                  ) : (
                    <XCircle size={13} className="text-gray-300" />
                  )}
                  <span className={hasNumber ? "text-gray-700" : "text-gray-400"}>
                    Must at least one number
                  </span>
                </div>
              </div>
            )}

            {/* Toggle mode */}
            <div className="text-right text-sm">
              {mode === "signup" ? (
                <span className="text-gray-500">
                  Have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-semibold hover:underline"
                    style={{ color: "#0099CC" }}
                  >
                    Log in
                  </button>
                </span>
              ) : (
                <span className="text-gray-500">
                  New applicant?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-semibold hover:underline"
                    style={{ color: "#0099CC" }}
                  >
                    Sign up
                  </button>
                </span>
              )}
            </div>

            {/* Inline Error Banner */}
            {inlineError && (
              <div className="rounded-lg border px-4 py-3 text-sm" style={{ backgroundColor: "#FFF0F0", borderColor: "#CC0000" }}>
                <p className="font-medium" style={{ color: "#CC0000" }}>{inlineError}</p>
                {showLoginPrompt && (
                  <p className="mt-1 text-gray-600">
                    Would you like to{" "}
                    <button
                      type="button"
                      onClick={switchToLogin}
                      className="font-semibold underline"
                      style={{ color: "#0099CC" }}
                    >
                      log in instead
                    </button>
                    {" "}to resume your application?
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || (mode === "signup" && !isPasswordValid)}
              className="w-full text-white font-bold py-3 px-6 rounded-lg text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              style={{ backgroundColor: "#CC0000" }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  {mode === "signup" ? "START YOUR APPLICATION" : "LOG IN & CONTINUE"}
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Terms */}
          {mode === "signup" && (
            <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
              By creating an account, you agree to our{" "}
              <a href="#" className="hover:underline" style={{ color: "#0099CC" }}>
                Term of Use and Privacy Policy
              </a>
              . KCO Properties may keep you informed with personalized communication about your account and you will be able to opt-out at any time.
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
