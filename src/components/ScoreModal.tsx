"use client";

import { useState, useEffect } from "react";
import { Member, ScoreRecord } from "@/types";
import { X, Plus, Minus, History as HistoryIcon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    member?: Member | null; // If null, we are in "Global Record" mode (select member)
    allMembers: Member[];
    onUpdate: (updatedMember: Member) => void;
    initialMode?: 'record' | 'history';
}

export default function ScoreModal({ isOpen, onClose, member, allMembers, onUpdate, initialMode = 'record' }: ScoreModalProps) {
    const [mode, setMode] = useState<'record' | 'history'>(initialMode);
    const [selectedMemberId, setSelectedMemberId] = useState<string>(member?.id || "");
    const [points, setPoints] = useState<string>("");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setSelectedMemberId(member?.id || "");
            setPoints("");
            setReason("");
        }
    }, [isOpen, member, initialMode]);

    if (!isOpen) return null;

    // Use passed member OR find from allMembers if global mode
    const targetMember = member || allMembers.find(m => m.id === selectedMemberId);

    const handleRecordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetMember) return;

        const pointsNum = parseInt(points);
        if (isNaN(pointsNum) || pointsNum === 0) {
            alert("Please enter a valid non-zero number");
            return;
        }

        setSubmitting(true);

        const newRecord: ScoreRecord = {
            id: Date.now().toString(),
            date: new Date().toISOString(), // Use simple ISO string for now
            change: pointsNum,
            reason: reason || "No reason provided"
        };

        const updatedMember: Member = {
            ...targetMember,
            score: (targetMember.score || 0) + pointsNum,
            scoreHistory: [newRecord, ...(targetMember.scoreHistory || [])]
        };

        onUpdate(updatedMember);
        setSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-[#1e2329] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {mode === 'record' ? <Plus className="h-5 w-5 text-blue-400" /> : <HistoryIcon className="h-5 w-5 text-purple-400" />}
                        {mode === 'record' ? "紀錄積分" : "積分歷史"}
                    </h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">

                    {/* Mode Toggle if member is selected, or if global mode allow switch? */}
                    {/* Requirement: "每個人都會有個叫歷史的按鈕... 可以看到歷史" AND "右上角會有紀錄積分的按鈕" */}

                    {!member && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-400 mb-1">選擇成員</label>
                            <select
                                value={selectedMemberId}
                                onChange={(e) => setSelectedMemberId(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                            >
                                <option value="">-- 請選擇成員 --</option>
                                {allMembers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.group})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {targetMember && mode === 'record' && (
                        <form onSubmit={handleRecordSubmit} className="space-y-4">
                            {!member && <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-sm">
                                正在為: <span className="font-bold text-blue-300">{targetMember.name}</span> 紀錄
                                <div className="text-muted-foreground text-xs mt-1">目前積分: {targetMember.score || 0}</div>
                            </div>}

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">積分變動</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={points}
                                        onChange={(e) => setPoints(e.target.value)}
                                        placeholder="+10 或 -5"
                                        className={cn(
                                            "flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none font-mono text-lg",
                                            parseInt(points) > 0 ? "text-green-400" : parseInt(points) < 0 ? "text-red-400" : ""
                                        )}
                                        autoFocus
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">使用負數來扣除積分。</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">原因</label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="例如: 完成緊急任務、開會遲到"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className={cn(
                                        "w-full py-3 rounded-lg font-bold text-white shadow-lg transition-transform active:scale-95",
                                        parseInt(points) > 0 ? "bg-green-600 hover:bg-green-500 shadow-green-500/20" :
                                            parseInt(points) < 0 ? "bg-red-600 hover:bg-red-500 shadow-red-500/20" :
                                                "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"
                                    )}
                                    disabled={submitting}
                                >
                                    {submitting ? "儲存中..." : "確認更新"}
                                </button>
                            </div>
                        </form>
                    )}

                    {targetMember && mode === 'history' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{targetMember.name}</h3>
                                    <span className="text-sm text-slate-400">總積分: </span>
                                    <span className={cn("font-bold", (targetMember.score || 0) > 0 ? "text-green-400" : "text-white")}>{targetMember.score || 0}</span>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {(targetMember.scoreHistory || []).length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 bg-white/5 rounded-lg border border-white/5 dashed">
                                        尚無歷史紀錄
                                    </div>
                                ) : (
                                    targetMember.scoreHistory.map(record => (
                                        <div key={record.id} className="bg-white/5 p-3 rounded-lg flex justify-between items-center border border-white/5">
                                            <div>
                                                <div className="text-sm font-medium text-white">{record.reason}</div>
                                                <div className="text-xs text-slate-500">{new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString()}</div>
                                            </div>
                                            <div className={cn("font-mono font-bold text-lg", record.change > 0 ? "text-green-400" : "text-red-400")}>
                                                {record.change > 0 ? "+" : ""}{record.change}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {!targetMember && mode === 'history' && (
                        <div className="text-center py-8 text-slate-500">
                            請選擇成員以查看歷史。
                        </div>
                    )}

                </div>

                {/* Footer Switcher */}
                {targetMember && (
                    <div className="p-4 bg-black/20 border-t border-white/10 shrink-0">
                        <button
                            onClick={() => setMode(mode === 'record' ? 'history' : 'record')}
                            className="w-full py-2 border border-white/10 hover:bg-white/5 rounded-lg text-sm text-slate-300 transition-colors flex items-center justify-center gap-2"
                        >
                            {mode === 'record' ? (
                                <>查看歷史 <ArrowRight className="h-4 w-4" /></>
                            ) : (
                                <>返回紀錄 <Plus className="h-4 w-4" /></>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
