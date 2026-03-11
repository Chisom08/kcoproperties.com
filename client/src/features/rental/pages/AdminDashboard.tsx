import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  FileText, Users, CheckCircle2, Clock, XCircle, Eye, Download,
  Building2, LogOut, BarChart3, Search, Filter, ChevronDown, ChevronRight,
  CreditCard
} from "lucide-react";
import { toast } from "sonner";

type ApplicationStatus = "pending" | "under_review" | "approved" | "denied" | "incomplete";

interface Application {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  propertyAddress: string | null;
  status: ApplicationStatus;
  currentStep: number;
  paymentStatus?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "#F59E0B", icon: <Clock size={14} /> },
  under_review: { label: "Under Review", color: "#0099CC", icon: <Eye size={14} /> },
  approved: { label: "Approved", color: "#10B981", icon: <CheckCircle2 size={14} /> },
  denied: { label: "Denied", color: "#CC0000", icon: <XCircle size={14} /> },
  incomplete: { label: "Incomplete", color: "#9CA3AF", icon: <Clock size={14} /> },
};

export default function AdminDashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [selectedApp, setSelectedApp] = useState<number | null>(null);
  const [expandedApp, setExpandedApp] = useState<number | null>(null);

  const { data: applicationsData, isLoading, refetch } = trpc.rental.application.listApplications.useQuery(
    { search: searchQuery, status: statusFilter === "all" ? undefined : statusFilter },
    { enabled: isAuthenticated }
  );

  const { data: detailData } = trpc.rental.application.getApplicationDetail.useQuery(
    { applicationId: selectedApp! },
    { enabled: selectedApp !== null }
  );

  const updateStatusMutation = trpc.rental.application.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Application status updated.");
      refetch();
    },
    onError: () => toast.error("Failed to update status."),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "#0099CC" }} />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Building2 size={48} style={{ color: "#0099CC" }} />
        <h2 className="text-xl font-bold text-gray-800">Admin Access Required</h2>
        <p className="text-gray-500 text-sm">You must be an admin to view this page.</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 text-white rounded-lg text-sm font-semibold"
          style={{ backgroundColor: "#0099CC" }}
        >
          Go to Application
        </button>
      </div>
    );
  }

  const applications: Application[] = applicationsData?.applications ?? [];
  const stats = applicationsData?.stats ?? { total: 0, pending: 0, underReview: 0, approved: 0, denied: 0 };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(0,153,204,0.1)" }}>
              <Building2 size={20} style={{ color: "#0099CC" }} />
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: "#0099CC" }}>KCO PROPERTIES</div>
              <div className="text-xs text-gray-500">Admin Dashboard</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              Welcome, <strong>{user?.name || "Admin"}</strong>
            </span>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total", value: stats.total, color: "#0099CC", icon: <FileText size={18} /> },
            { label: "Pending", value: stats.pending, color: "#F59E0B", icon: <Clock size={18} /> },
            { label: "Under Review", value: stats.underReview, color: "#0099CC", icon: <Eye size={18} /> },
            { label: "Approved", value: stats.approved, color: "#10B981", icon: <CheckCircle2 size={18} /> },
            { label: "Denied", value: stats.denied, color: "#CC0000", icon: <XCircle size={18} /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0099CC]"
              />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "all")}
                className="pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0099CC] bg-white appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
                <option value="incomplete">Incomplete</option>
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <Users size={16} style={{ color: "#0099CC" }} />
              Applications ({applications.length})
            </h2>
            <button
              onClick={() => refetch()}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#0099CC" }} />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No applications found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {applications.map((app) => {
                const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                const isExpanded = expandedApp === app.id;

                return (
                  <div key={app.id} className="hover:bg-gray-50 transition-colors">
                    <div
                      className="px-4 py-3 flex items-center gap-3 cursor-pointer"
                      onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                    >
                      {/* Expand icon */}
                      <ChevronRight
                        size={14}
                        className={`text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`}
                      />

                      {/* Applicant info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-800 truncate">
                            {app.firstName && app.lastName
                              ? `${app.firstName} ${app.lastName}`
                              : app.email}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: `${statusCfg.color}15`, color: statusCfg.color }}
                          >
                            {statusCfg.icon}
                            {statusCfg.label}
                          </span>
                          {app.paymentStatus === "paid" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 bg-green-50 text-green-700">
                              <CreditCard size={11} /> Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 bg-amber-50 text-amber-700">
                              <CreditCard size={11} /> Unpaid
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-400 truncate">{app.email}</span>
                          {app.propertyAddress && (
                            <span className="text-xs text-gray-400 hidden sm:block truncate">
                              · {app.propertyAddress}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Step progress */}
                      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                        <div className="text-xs text-gray-400">Step {app.currentStep}/6</div>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${(app.currentStep / 6) * 100}%`, backgroundColor: "#0099CC" }}
                          />
                        </div>
                      </div>

                      {/* Date */}
                      <div className="text-xs text-gray-400 flex-shrink-0 hidden md:block">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedApp(app.id)}
                          className="text-xs px-2 py-1 rounded border border-gray-200 hover:border-[#0099CC] hover:text-[#0099CC] transition-all text-gray-500"
                        >
                          View
                        </button>
                        <select
                          value={app.status}
                          onChange={(e) =>
                            updateStatusMutation.mutate({
                              applicationId: app.id,
                              status: e.target.value as ApplicationStatus,
                            })
                          }
                          className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white focus:outline-none focus:border-[#0099CC]"
                        >
                          <option value="pending">Pending</option>
                          <option value="under_review">Under Review</option>
                          <option value="approved">Approved</option>
                          <option value="denied">Denied</option>
                          <option value="incomplete">Incomplete</option>
                        </select>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-10 pb-4 bg-gray-50 border-t border-gray-100">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                          <div>
                            <div className="text-xs text-gray-400 mb-0.5">Application ID</div>
                            <div className="text-sm font-medium text-gray-700">#{app.id}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 mb-0.5">Property</div>
                            <div className="text-sm font-medium text-gray-700">{app.propertyAddress || "—"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 mb-0.5">Submitted</div>
                            <div className="text-sm font-medium text-gray-700">
                              {new Date(app.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 mb-0.5">Last Updated</div>
                            <div className="text-sm font-medium text-gray-700">
                              {new Date(app.updatedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => setSelectedApp(app.id)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-white font-medium transition-all hover:opacity-90"
                            style={{ backgroundColor: "#0099CC" }}
                          >
                            <Eye size={12} /> Full Details
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Application Detail Modal */}
      {selectedApp !== null && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedApp(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-gray-800">Application Details #{selectedApp}</h3>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {detailData ? (
                <div className="space-y-6">
                  {/* Personal Info */}
                  <section>
                    <h4 className="text-sm font-bold text-red-600 mb-3 uppercase tracking-wide">Personal Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailField label="First Name" value={detailData.application.firstName} />
                      <DetailField label="Last Name" value={detailData.application.lastName} />
                      <DetailField label="Email" value={detailData.application.email} />
                      <DetailField label="Cell Phone" value={detailData.application.cellPhone} />
                      <DetailField label="Date of Birth" value={detailData.application.dateOfBirth} />
                      <DetailField label="Marital Status" value={detailData.application.maritalStatus} />
                      <DetailField label="SSN (masked)" value={detailData.application.ssn ? "***-**-" + detailData.application.ssn.slice(-4) : null} />
                      <DetailField label="Property" value={detailData.application.propertyAddress} />
                    </div>
                  </section>

                  {/* Address */}
                  <section>
                    <h4 className="text-sm font-bold text-red-600 mb-3 uppercase tracking-wide">Current Address</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailField label="Street" value={detailData.application.currentStreet} className="col-span-2" />
                      <DetailField label="City" value={detailData.application.currentCity} />
                      <DetailField label="State" value={detailData.application.currentState} />
                      <DetailField label="Zip" value={detailData.application.currentZip} />
                    </div>
                  </section>

                  {/* Employment */}
                  <section>
                    <h4 className="text-sm font-bold text-red-600 mb-3 uppercase tracking-wide">Employment</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailField label="Employer" value={detailData.application.employerName} />
                      <DetailField label="Position" value={detailData.application.position} />
                      <DetailField label="Monthly Gross Pay" value={detailData.application.monthlyGrossPay ? `$${detailData.application.monthlyGrossPay}` : null} />
                      <DetailField label="Supervisor" value={detailData.application.supervisorName} />
                    </div>
                  </section>

                  {/* Emergency Contacts */}
                  {detailData.emergencyContacts && detailData.emergencyContacts.length > 0 && (
                    <section>
                      <h4 className="text-sm font-bold text-red-600 mb-3 uppercase tracking-wide">Emergency Contacts</h4>
                      {detailData.emergencyContacts.map((ec: { name: string | null; relationship: string | null; phone: string | null }, idx: number) => (
                        <div key={idx} className="grid grid-cols-3 gap-3 mb-2">
                          <DetailField label="Name" value={ec.name} />
                          <DetailField label="Relationship" value={ec.relationship} />
                          <DetailField label="Phone" value={ec.phone} />
                        </div>
                      ))}
                    </section>
                  )}

                  {/* Co-Applicants */}
                  {detailData.coApplicants && detailData.coApplicants.length > 0 && (
                    <section>
                      <h4 className="text-sm font-bold text-red-600 mb-3 uppercase tracking-wide">Co-Applicants</h4>
                      {detailData.coApplicants.map((ca: { firstName: string | null; lastName: string | null; email: string | null; cellPhone: string | null }, idx: number) => (
                        <div key={idx} className="grid grid-cols-2 gap-3 mb-2">
                          <DetailField label="Name" value={ca.firstName && ca.lastName ? `${ca.firstName} ${ca.lastName}` : null} />
                          <DetailField label="Email" value={ca.email} />
                          <DetailField label="Phone" value={ca.cellPhone} />
                        </div>
                      ))}
                    </section>
                  )}

                  {/* Payment Status */}
                  <section>
                    <h4 className="text-sm font-bold text-red-600 mb-3 uppercase tracking-wide">Payment</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">Payment Status</div>
                        <div className="flex items-center gap-1.5">
                          {detailData.application.paymentStatus === "paid" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">
                              <CheckCircle2 size={12} /> Paid — $50.00
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                              <Clock size={12} /> Unpaid
                            </span>
                          )}
                        </div>
                      </div>
                      {detailData.application.stripePaymentIntentId && (
                        <DetailField label="Stripe Payment ID" value={detailData.application.stripePaymentIntentId} />
                      )}
                    </div>
                  </section>

                  {/* Status Update */}
                  <section>
                    <h4 className="text-sm font-bold text-red-600 mb-3 uppercase tracking-wide">Update Status</h4>
                    <div className="flex gap-2 flex-wrap">
                      {(["pending", "under_review", "approved", "denied"] as ApplicationStatus[]).map((s) => {
                        const cfg = STATUS_CONFIG[s];
                        return (
                          <button
                            key={s}
                            onClick={() => updateStatusMutation.mutate({ applicationId: selectedApp, status: s })}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border-2 transition-all"
                            style={{ borderColor: cfg.color, color: cfg.color }}
                          >
                            {cfg.icon} {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#0099CC" }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm text-gray-800 font-medium">{value || <span className="text-gray-300">—</span>}</div>
    </div>
  );
}
