"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, Coins, HelpCircle } from "lucide-react";

interface InstructionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InstructionModal({ isOpen, onClose }: InstructionModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    {/* Backdrop click to close */}
                    <div className="absolute inset-0" onClick={onClose} />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-md bg-[#1a1f2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div className="flex items-center gap-2 text-xl font-bold text-white">
                                <HelpCircle className="h-6 w-6 text-yellow-400" />
                                使用說明
                            </div>
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Section 1: Points Acquisition */}
                            <div className="flex gap-4">
                                <div className="mt-1 h-10 w-10 shrink-0 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">積分獲得</h3>
                                    <ul className="text-slate-400 space-y-1 text-sm">
                                        <li>1. 任務完成可獲得積分</li>
                                        <li>2. 特殊貢獻可獲得積分</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 2: Notes */}
                            <div className="flex gap-4">
                                <div className="mt-1 h-10 w-10 shrink-0 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                    <AlertTriangle className="h-6 w-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">注意事項</h3>
                                    <ul className="text-slate-400 space-y-1 text-sm">
                                        <li>3. 勿自行亂加會有紀錄</li>
                                        <li>4. 特殊情況會扣除積分</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 3: Usage */}
                            <div className="flex gap-4">
                                <div className="mt-1 h-10 w-10 shrink-0 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                                    <Coins className="h-6 w-6 text-yellow-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">積分用途</h3>
                                    <ul className="text-slate-400 space-y-2 text-sm">
                                        <li>5. 積分用於社團活動花費</li>
                                        <li>
                                            <span className="inline-block px-3 py-1 rounded-lg bg-yellow-400/10 text-yellow-400 font-bold border border-yellow-400/20">
                                                1積分 = 3元
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-0">
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors border border-white/10"
                            >
                                了解
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
