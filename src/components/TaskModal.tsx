"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, CheckCircle, XCircle, Save } from "lucide-react";
import { Member, Task } from "@/types";

interface TaskModalProps {
    member: Member;
    onClose: () => void;
    onUpdate: (updatedMember: Member) => void;
}

export default function TaskModal({ member, onClose, onUpdate }: TaskModalProps) {
    const [task, setTask] = useState<Task>({ ...member.currentTask });
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'edit' | 'history'>('edit');

    // Helper to save changes
    const handleSave = async (newStats?: { success: number; failed: number }, addToHistory = false) => {
        setLoading(true);

        let updatedMember = { ...member, currentTask: task };

        if (newStats) {
            updatedMember.stats = newStats;
        }

        if (addToHistory) {
            // Add current task to history
            updatedMember.history = [
                { ...member.currentTask, outcome: newStats?.success ? 'Success' : 'Failed' },
                ...member.history
            ];
            // Reset current task
            updatedMember.currentTask = {
                title: "New Task",
                deadline: new Date().toISOString().split('T')[0],
                group: task.group, // Keep same group by default
                progress: 0
            };
        }

        try {
            const res = await fetch('/api/data');
            const data = await res.json();
            const updatedMembers = data.members.map((m: Member) =>
                m.id === member.id ? updatedMember : m
            );

            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ members: updatedMembers })
            });

            onUpdate(updatedMember);
            setTask(updatedMember.currentTask); // Update local state if reset
            if (addToHistory) {
                onClose();
            }
        } catch (e) {
            console.error(e);
            alert("Failed to save");
        } finally {
            setLoading(false);
        }
    };

    const markComplete = () => {
        if (!confirm("Confirm task completion?")) return;
        handleSave(
            { ...member.stats, success: member.stats.success + 1 },
            true
        );
    };

    const markFailed = () => {
        if (!confirm("Confirm task failure?")) return;
        handleSave(
            { ...member.stats, failed: member.stats.failed + 1 },
            true
        );
    };

    const updateMemberDirectly = async (updatedMember: Member) => {
        setLoading(true);
        try {
            const res = await fetch('/api/data');
            const data = await res.json();
            const updatedMembers = data.members.map((m: Member) =>
                m.id === member.id ? updatedMember : m
            );

            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ members: updatedMembers })
            });

            onUpdate(updatedMember);
        } catch (e) {
            console.error(e);
            alert("Failed to delete history");
        } finally {
            setLoading(false);
        }
    };

    const deleteHistory = (index: number) => {
        const historyItem = member.history[index];
        const isSuccess = historyItem.outcome === 'Success' || (historyItem as any).status === 'Success';
        const action = isSuccess ? 'Success' : 'Failed';

        if (!confirm(`Delete this "${action}" record? This will decrement the member's ${action} count.`)) return;

        const newStats = {
            success: isSuccess ? Math.max(0, member.stats.success - 1) : member.stats.success,
            failed: !isSuccess ? Math.max(0, member.stats.failed - 1) : member.stats.failed
        };

        const newHistory = member.history.filter((_, i) => i !== index);

        const updatedMember: Member = {
            ...member,
            currentTask: task,
            stats: newStats,
            history: newHistory
        };

        updateMemberDirectly(updatedMember);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: 'none' }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl relative flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Fixed at top */}
                <div className="flex items-center justify-between p-6 pb-2 shrink-0">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        {member.name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 z-50"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar">
                    {/* Tabs */}
                    <div className="flex gap-4 mb-6 border-b border-white/10 pb-2 sticky top-0 bg-[#0f172a] z-10 pt-2">
                        <button
                            onClick={() => setView('edit')}
                            className={`text-sm font-medium pb-2 relative transition-colors ${view === 'edit' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-muted-foreground hover:text-white/80'}`}
                        >
                            進行中任務
                        </button>
                        <button
                            onClick={() => setView('history')}
                            className={`text-sm font-medium pb-2 relative transition-colors ${view === 'history' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-muted-foreground hover:text-white/80'}`}
                        >
                            歷史任務 ({member.history.length})
                        </button>
                    </div>

                    {view === 'edit' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">任務描述</label>
                                <input
                                    value={task.title}
                                    onChange={(e) => setTask({ ...task, title: e.target.value })}
                                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none placeholder:text-muted-foreground/50"
                                    placeholder="Enter task description"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="mb-1 text-xs font-medium text-muted-foreground">
                                        Deadline
                                    </label>
                                    <input
                                        type="date"
                                        value={task.deadline}
                                        onChange={(e) => setTask({ ...task, deadline: e.target.value })}
                                        className="
                                        box-border
                                        h-10 w-full
                                        rounded-md
                                        border border-white/10
                                        bg-white/5
                                        px-3
                                        text-white
                                        focus:border-blue-500
                                        focus:outline-none
                                        "
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="mb-1 text-xs font-medium text-muted-foreground">
                                        Group
                                    </label>
                                    <select
                                        value={task.group}
                                        onChange={(e) => setTask({ ...task, group: e.target.value })}
                                        className="
                                        box-border
                                        h-10 w-full
                                        rounded-md
                                        border border-white/10
                                        bg-white/5
                                        px-3
                                        text-white
                                        focus:border-blue-500
                                        focus:outline-none
                                        [&>option]:bg-[#0f172a]
                                        "
                                    >
                                        <option value="電裝控制">電裝控制</option>
                                        <option value="結構設計">結構設計</option>
                                        <option value="公關相關">公關相關</option>
                                        <option value="教學相關">教學相關</option>
                                    </select>
                                </div>

                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">Progress ({task.progress}%)</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={task.progress}
                                    onChange={(e) => setTask({ ...task, progress: Number(e.target.value) })}
                                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-blue-500"
                                />
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={() => handleSave()}
                                    disabled={loading}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
                                >
                                    <Save className="h-4 w-4" /> 儲存更改
                                </button>
                            </div>

                            <div className="mt-4 border-t border-white/10 pt-4">
                                <p className="text-xs text-muted-foreground mb-3 text-center">任務結果(歸檔任務)</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={markComplete}
                                        disabled={loading}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 font-medium text-green-400 hover:bg-green-500/20 disabled:opacity-50 border border-green-500/20 transition-colors"
                                    >
                                        <CheckCircle className="h-4 w-4" /> Success
                                    </button>
                                    <button
                                        onClick={markFailed}
                                        disabled={loading}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 border border-red-500/20 transition-colors"
                                    >
                                        <XCircle className="h-4 w-4" /> Failed
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {member.history.length === 0 && (
                                <div className="text-center text-muted-foreground py-8">No history found.</div>
                            )}
                            {member.history.map((h, i) => {
                                const isSuccess = h.outcome === 'Success' || (h as any).status === 'Success';
                                const ColorIcon = isSuccess ? CheckCircle : XCircle;
                                const colorClass = isSuccess ? 'text-green-400' : 'text-red-400';

                                return (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <ColorIcon className={`h-5 w-5 ${colorClass}`} />
                                            <div>
                                                <div className="font-medium text-white/90">{h.title}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <span className="opacity-70">{h.deadline}</span>
                                                    <span className="opacity-50">| {h.group}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteHistory(i)}
                                            className="text-muted-foreground hover:text-red-400 p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete Record"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
