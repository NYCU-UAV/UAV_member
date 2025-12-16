"use client";

import { useEffect, useState } from "react";
import { Member, AppData } from "@/types";
import {
    Trophy,
    History,
    PlusCircle,
    MinusCircle,
    Search,
    UserPlus,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import AddMemberModal from "./AddMemberModal";
import ScoreModal from "./ScoreModal";

export default function MemberInfoTable() {
    const [data, setData] = useState<AppData | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modals state
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

    const [scoreModalOpen, setScoreModalOpen] = useState(false);
    const [selectedMemberForScore, setSelectedMemberForScore] = useState<Member | null>(null);
    const [scoreMode, setScoreMode] = useState<'record' | 'history'>('record');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/data");
            const json = await res.json();
            // Ensure data integrity (defaults for new fields)
            if (json.members) {
                json.members = json.members.map((m: any) => ({
                    ...m,
                    score: m.score || 0,
                    scoreHistory: m.scoreHistory || [],
                    phone: m.phone || "",
                    email: m.email || "",
                    group: m.group || m.currentTask?.group || "Unknown",
                }));
            }
            setData(json);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const saveData = async (newMembers: Member[]) => {
        try {
            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ members: newMembers })
            });
            if (data) {
                setData({ ...data, members: newMembers });
            }
        } catch (error) {
            console.error("Failed to save data", error);
            alert("Failed to save changes");
        }
    };

    const handleAddMembers = (newMembers: Member[]) => {
        if (!data) return;

        const currentMembers = [...data.members];

        newMembers.forEach(newM => {
            const index = currentMembers.findIndex(m => m.id === newM.id || m.name === newM.name);
            if (index !== -1) {
                // Update existing
                // Preserve stats/history if ID matches, or if name matches merge intelligently
                // For simplicity, we replaced the logic in AddMemberModal to pass the correct ID if existing.
                // We just swap it here.
                currentMembers[index] = newM;
            } else {
                currentMembers.push(newM);
            }
        });

        saveData(currentMembers);
    };

    const handleMemberUpdate = (updatedMember: Member) => {
        if (!data) return;
        const updatedMembers = data.members.map(m => m.id === updatedMember.id ? updatedMember : m);
        saveData(updatedMembers);
    };

    const openScoreModal = (member: Member | null, mode: 'record' | 'history') => {
        setSelectedMemberForScore(member);
        setScoreMode(mode);
        setScoreModalOpen(true);
    };

    const handleDeleteMember = (id: string) => {
        if (!data) return;
        if (!confirm("確定要刪除這位成員嗎？此動作無法復原。")) return;

        const newMembers = data.members.filter(m => m.id !== id);
        saveData(newMembers);
    };

    // Sort members by score (descending)
    const sortedMembers = data?.members
        .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => b.score - a.score) || [];

    const getRankColor = (index: number) => {
        switch (index) {
            case 0: return "text-yellow-400";
            case 1: return "text-gray-300";
            case 2: return "text-amber-600";
            default: return "text-slate-500";
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-white">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="搜尋成員..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => openScoreModal(null, 'record')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-indigo-500/20"
                    >
                        <Trophy className="h-4 w-4" /> 紀錄積分
                    </button>
                    <button
                        onClick={() => setIsAddMemberOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20"
                    >
                        <UserPlus className="h-4 w-4" /> 新增成員
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-lg overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 bg-white/5 p-4 text-sm font-medium text-muted-foreground uppercase tracking-wider items-center">
                    <div className="col-span-1 text-center">排名</div>
                    <div className="col-span-2">姓名</div>
                    <div className="col-span-4">詳細資訊</div>
                    <div className="col-span-2">組別</div>
                    <div className="col-span-1 text-right">積分</div>
                    <div className="col-span-2 text-right">操作</div>
                </div>

                {/* List */}
                <div className="divide-y divide-white/5">
                    {sortedMembers.map((member, index) => (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group"
                        >
                            <div className="col-span-1 flex justify-center">
                                <span className={cn("font-bold text-lg", getRankColor(index))}>
                                    #{index + 1}
                                </span>
                            </div>

                            <div className="col-span-2 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center font-bold text-white shadow-lg shrink-0 border border-white/10">
                                    {member.name[0]}
                                </div>
                                <div className="font-semibold text-white">{member.name}</div>
                            </div>

                            <div className="col-span-4 text-sm text-slate-400 space-y-1">
                                {member.phone && <div>📞 {member.phone}</div>}
                                {member.email && <div>📧 {member.email}</div>}
                                {member.account && <div>🏦 {member.account}</div>}
                                {member.remarks && <div className="text-white/50 text-xs italic">📝 {member.remarks}</div>}
                                {!member.phone && !member.email && !member.account && !member.remarks && <span className="text-white/20">-</span>}
                            </div>

                            <div className="col-span-2">
                                <span className="px-2 py-1 rounded-md bg-white/10 text-white/80 text-xs border border-white/5">
                                    {member.group}
                                </span>
                            </div>

                            <div className="col-span-1 text-right">
                                <span className={cn(
                                    "font-mono text-xl font-bold",
                                    member.score > 0 ? "text-green-400" : member.score < 0 ? "text-red-400" : "text-slate-400"
                                )}>
                                    {member.score}
                                </span>
                            </div>

                            <div className="col-span-2 flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openScoreModal(member, 'history')}
                                    className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                    title="查看歷史"
                                >
                                    <History className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => openScoreModal(member, 'record')}
                                    className="p-2 hover:bg-green-500/20 rounded-lg text-slate-400 hover:text-green-400 transition-colors"
                                    title="新增/扣除積分"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteMember(member.id)}
                                    className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                    title="刪除成員"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {sortedMembers.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            未找到成員
                        </div>
                    )}
                </div>
            </div>

            <AddMemberModal
                isOpen={isAddMemberOpen}
                onClose={() => setIsAddMemberOpen(false)}
                onAdd={handleAddMembers}
                existingMembers={data?.members || []}
            />

            <ScoreModal
                isOpen={scoreModalOpen}
                onClose={() => setScoreModalOpen(false)}
                member={selectedMemberForScore}
                allMembers={data?.members || []}
                onUpdate={handleMemberUpdate}
                initialMode={scoreMode}
                key={selectedMemberForScore?.id || 'global'} // force reset when switching member
            />

        </div>
    );
}
