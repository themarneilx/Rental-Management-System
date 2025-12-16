"use client";

import { useState } from "react";
import ModalPortal from "@/components/ui/ModalPortal";
import { Lock } from "lucide-react";

export default function ForceChangePasswordModal({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/tenant/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to change password");
      }
    } catch (err) {
        console.error("Error changing password:", err);
        setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
             <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                <Lock className="w-5 h-5" />
             </div>
             <div>
                <h3 className="text-lg font-bold text-slate-900">Security Update Required</h3>
                <p className="text-xs text-slate-500">You must change your password to continue.</p>
             </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Current Password (Temporary)
              </label>
              <input
                type="password"
                required
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
              />
            </div>

            <div className="pt-2 border-t border-slate-100"></div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? "Updating Password..." : "Update Password & Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
