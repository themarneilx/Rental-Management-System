"use client";

import { useState } from "react";
import ModalPortal from "@/components/ui/ModalPortal";
import { RotateCcw, HelpCircle } from "lucide-react";

interface UnarchiveModalProps {
  tenantName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function UnarchiveModal({ tenantName, onClose, onConfirm }: UnarchiveModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
          
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <RotateCcw className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Unarchive Tenant?</h3>
            <p className="text-sm text-slate-500 mb-4">
              Are you sure you want to restore <span className="font-bold text-slate-700">{tenantName}</span> to Active status?
            </p>
            <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3 text-left">
               <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
               <p className="text-xs text-blue-700">
                  The tenant will be restored without an assigned unit. You will need to manually assign them to a room in the Tenants page.
               </p>
            </div>
          </div>

          <div className="bg-slate-50 px-4 py-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                  <>Restoring...</>
              ) : (
                  <>
                    <RotateCcw className="w-4 h-4" /> Confirm Restore
                  </>
              )}
            </button>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
}
