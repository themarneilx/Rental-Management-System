"use client";

import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'; // Import new icons
import Button from '@/components/ui/Button';
import ModalPortal from '@/components/ui/ModalPortal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void; // Make onConfirm optional for info/success modals
    title: string;
    message: string;
    variant?: 'info' | 'success' | 'warning' | 'error'; // Add variant prop
    confirmButtonText?: string; // Optional text for confirm button
    cancelButtonText?: string; // Optional text for cancel button
    showCancelButton?: boolean; // Optional to hide cancel button
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    variant = 'info', // Default variant
    confirmButtonText = 'Confirm',
    cancelButtonText = 'Cancel',
    showCancelButton = true
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    let icon, iconBgColor, iconColor, confirmColor;
    switch (variant) {
        case 'success':
            icon = <CheckCircle className="h-6 w-6" />;
            iconBgColor = 'bg-emerald-100';
            iconColor = 'text-emerald-600';
            confirmColor = 'bg-emerald-600 hover:bg-emerald-700';
            break;
        case 'warning':
            icon = <AlertTriangle className="h-6 w-6" />;
            iconBgColor = 'bg-amber-100';
            iconColor = 'text-amber-600';
            confirmColor = 'bg-amber-600 hover:bg-amber-700';
            break;
        case 'error':
            icon = <XCircle className="h-6 w-6" />;
            iconBgColor = 'bg-rose-100';
            iconColor = 'text-rose-600';
            confirmColor = 'bg-rose-600 hover:bg-rose-700';
            break;
        case 'info':
        default:
            icon = <Info className="h-6 w-6" />;
            iconBgColor = 'bg-blue-100';
            iconColor = 'text-blue-600';
            confirmColor = 'bg-blue-600 hover:bg-blue-700';
            break;
    }

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-6 text-center">
                        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${iconBgColor} mb-4`}>
                            <span className={iconColor}>{icon}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                        <p className="text-sm text-slate-500 whitespace-pre-line">{message}</p>
                    </div>
                    <div className="bg-slate-50 px-4 py-3 flex justify-center gap-3">
                        {showCancelButton && (
                            <Button variant="ghost" onClick={onClose}>{cancelButtonText}</Button>
                        )}
                        {onConfirm && ( // Only show confirm button if onConfirm is provided
                            <Button onClick={onConfirm} className={confirmColor}>{confirmButtonText}</Button>
                        )}
                        {!onConfirm && !showCancelButton && ( // If no confirm and no cancel, show an OK button
                            <Button onClick={onClose} className={confirmColor}>OK</Button>
                        )}
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
}
