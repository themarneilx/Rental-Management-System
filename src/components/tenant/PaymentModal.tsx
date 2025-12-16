"use client";

import { useState } from 'react';
import { X, Building2, Check, ArrowRight, Image as ImageIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import ModalPortal from '@/components/ui/ModalPortal';
import ConfirmationModal from './ConfirmationModal'; // Reusing the updated ConfirmationModal
import { TenantUser } from '@/data/mock';

interface PaymentModalProps {
    onClose: () => void;
    user: TenantUser;
    onSuccess: () => void;
}

export default function PaymentModal({ onClose, user, onSuccess }: PaymentModalProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    amount: '',
    message: '',
    receipt: null as File | null
  });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // New state for success modal
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false); // New state for error modal
  const [errorModalMessage, setErrorModalMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, receipt: e.target.files[0] });
    }
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.receipt) {
        setErrorModalMessage("Please enter amount and attach receipt.");
        setIsErrorModalOpen(true);
        return;
    }
    setIsConfirmOpen(true);
  };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9.]/g, '');
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            // Add commas for display
            const parts = value.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            setFormData({ ...formData, amount: parts.join('.') });
        }
    };

    const handleConfirmSubmit = async () => {
    setIsConfirmOpen(false);
    setIsSubmitting(true);

    try {
        const data = new FormData();
        // Remove commas before sending
        data.append('amount', formData.amount.replace(/,/g, ''));
        data.append('message', formData.message);
        if (formData.receipt) {
            data.append('receipt', formData.receipt);
        }

        const res = await fetch('/api/tenant/payments', {
            method: 'POST',
            body: data
        });

        if (res.ok) {
            setIsSuccessModalOpen(true); // Open success modal
        } else {
            const err = await res.json();
            setErrorModalMessage(err.error || "Failed to submit payment proof.");
            setIsErrorModalOpen(true); // Open error modal
        }
    } catch (error) {
        console.error(error);
        setErrorModalMessage("An error occurred. Please try again.");
        setIsErrorModalOpen(true); // Open error modal
    } finally {
        setIsSubmitting(false);
    }
  };


  // Function to close success modal and parent PaymentModal
  const closeSuccessModal = () => {
      setIsSuccessModalOpen(false);
      onSuccess(); // Trigger parent success action
      onClose(); // Close the PaymentModal
  };

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
  };


  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-xl font-bold text-slate-900">Pay Bill & Submit Proof</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">
                {/* Bank Info Card */}
                <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    
                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                       <Building2 className="w-4 h-4" /> Bank Transfer Details
                    </h4>
                    
                    <div className="space-y-3 text-sm text-blue-900 relative z-10">
                        <div className="flex justify-between items-center pb-2 border-b border-blue-100/50">
                            <span className="text-blue-600 font-medium">Bank Name</span>
                            <span className="font-bold">BDO Unibank Inc.</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-blue-100/50">
                            <span className="text-blue-600 font-medium">Account Name</span>
                            <span className="font-bold">Carmelita Cabahug or Melonil Cabahug</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-blue-600 font-medium">Account Number</span>
                            <span className="font-mono font-bold text-xl tracking-wide">0034 4005 9736</span>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <form onSubmit={handleInitialSubmit} className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider pt-2">Payment Confirmation Form</h4>
                    <p className="text-xs text-slate-500 -mt-3 mb-2">Please upload your transfer receipt so we can verify your payment.</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                                value={formData.phone} 
                                onChange={e => setFormData({...formData, phone: e.target.value})} 
                                required 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})} 
                            required 
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Amount Paid</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₱</span>
                            <input 
                                type="text" 
                                className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono" 
                                placeholder="0.00"
                                value={formData.amount} 
                                onChange={handleAmountChange} 
                                required 
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Message & Proof</label>
                        <div className="relative">
                            <textarea 
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none pb-12"
                                placeholder="I have transferred the payment for January Rent..."
                                value={formData.message}
                                onChange={e => setFormData({...formData, message: e.target.value})}
                            ></textarea>
                            
                            {/* Attachment Button inside Textarea */}
                            <div className="absolute bottom-2 left-2 right-2">
                                <input type="file" id="receipt-upload" className="hidden" accept="image/*" onChange={handleFileChange} required />
                                <label 
                                    htmlFor="receipt-upload" 
                                    className={`flex items-center justify-center gap-2 w-full p-2 rounded-md text-xs font-medium cursor-pointer transition-all border ${ 
                                        formData.receipt 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    {formData.receipt ? (
                                        <>
                                            <Check className="w-3.5 h-3.5" /> 
                                            Attached: {formData.receipt.name}
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="w-3.5 h-3.5" /> 
                                            Attach Receipt Image (Required)
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button type="submit" disabled={isSubmitting} className="w-full py-3" icon={ArrowRight}>
                            {isSubmitting ? 'Submitting...' : 'Submit Payment Proof'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
        
        {/* Nested Confirmation Modal */}
        <ConfirmationModal 
            isOpen={isConfirmOpen} 
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={handleConfirmSubmit}
            title="Confirm Submission"
            message={`Are you sure you want to submit this payment proof? You can only do this once.

If you make a mistake, you will need to contact us directly.`}
            variant="warning" // Added variant
        />

        {/* Success Modal */}
        <ConfirmationModal 
            isOpen={isSuccessModalOpen}
            onClose={closeSuccessModal} // Call custom close function
            title="Payment Submitted!"
            message="Your payment proof has been submitted successfully. Please wait for admin verification."
            variant="success"
            confirmButtonText="Got it!"
            showCancelButton={false} // Hide cancel button
            onConfirm={closeSuccessModal} // Ensure onConfirm also calls closeSuccessModal
        />

        {/* Error Modal */}
        <ConfirmationModal 
            isOpen={isErrorModalOpen}
            onClose={closeErrorModal}
            title="Submission Failed"
            message={errorModalMessage}
            variant="error"
            confirmButtonText="OK"
            showCancelButton={false}
            onConfirm={closeErrorModal}
        />
    </div>
    </ModalPortal>
  );
}