"use client";

import { X } from "lucide-react";
import ModalPortal from "@/components/ui/ModalPortal";

interface ContractModalProps {
    url: string;
    onClose: () => void;
}

export default function ContractModal({ url, onClose }: ContractModalProps) {
    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 bg-black hover:bg-gray-800 rounded-full text-white transition-colors z-50 backdrop-blur-md"
                >
                    <X className="w-6 h-6" />
                </button>
                
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    <img 
                        src={url} 
                        alt="Contract Full View" 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                    />
                </div>
                
                <div className="absolute inset-0 -z-10" onClick={onClose}></div>
            </div>
        </ModalPortal>
    );
}