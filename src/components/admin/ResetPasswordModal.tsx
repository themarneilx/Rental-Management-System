"use client";

import { useState } from "react";
import ModalPortal from "@/components/ui/ModalPortal";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface ResetPasswordModalProps {
  tenantId: string;
  tenantName: string;
  onClose: () => void;
}

export default function ResetPasswordModal({ tenantId, tenantName, onClose }: ResetPasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    setNewPassword(null);

    try {
      const res = await fetch(`/api/tenants/${tenantId}/reset-password`, {
        method: "PUT",
      });

      if (res.ok) {
        const data = await res.json();
        setNewPassword(data.password);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to reset password.");
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
          
          <div className="p-6 text-center">
            {newPassword ? (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Password Reset Successful!</h3>
                <p className="text-sm text-slate-500 mb-4">
                  The password for <span className="font-bold text-slate-700">{tenantName}</span> has been reset.
                </p>
                <div className="bg-slate-100 p-3 rounded-lg flex items-center justify-between font-mono text-sm text-slate-800">
                  <span>{newPassword}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(newPassword)}
                    className="ml-2 px-2 py-1 bg-slate-200 rounded-md text-xs hover:bg-slate-300 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Please provide this new password to the tenant. They will be prompted to change it upon their next login.
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Reset Password for {tenantName}?</h3>
                <p className="text-sm text-slate-500">
                  This will generate a new random password for <span className="font-bold text-slate-700">{tenantName}</span>. The tenant will be required to change it upon their next login.
                </p>
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 mt-4">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bg-slate-50 px-4 py-3 flex justify-end gap-3 border-t border-slate-100">
            {newPassword ? (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                Done
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm"
                  disabled={loading}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </ModalPortal>
  );
}
