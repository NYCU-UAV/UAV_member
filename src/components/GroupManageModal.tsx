"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Trash2, Pencil, Check, Tag } from "lucide-react";
import { Group } from "@/types";

const COLOR_OPTIONS = [
    { key: "cyan", label: "青藍", bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30", preview: "bg-cyan-500" },
    { key: "orange", label: "橙色", bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30", preview: "bg-orange-500" },
    { key: "pink", label: "粉紅", bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30", preview: "bg-pink-500" },
    { key: "green", label: "綠色", bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30", preview: "bg-green-500" },
    { key: "purple", label: "紫色", bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", preview: "bg-purple-500" },
    { key: "blue", label: "藍色", bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", preview: "bg-blue-500" },
    { key: "red", label: "紅色", bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", preview: "bg-red-500" },
    { key: "yellow", label: "黃色", bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30", preview: "bg-yellow-500" },
];

export function getGroupStyle(color: string) {
    return COLOR_OPTIONS.find(c => c.key === color) || COLOR_OPTIONS[0];
}

interface GroupManageModalProps {
    isOpen: boolean;
    onClose: () => void;
    groups: Group[];
    onSave: (groups: Group[]) => void;
}

export default function GroupManageModal({ isOpen, onClose, groups, onSave }: GroupManageModalProps) {
    const [localGroups, setLocalGroups] = useState<Group[]>(groups);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editColor, setEditColor] = useState("cyan");
    const [newName, setNewName] = useState("");
    const [newColor, setNewColor] = useState("cyan");
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const startEdit = (g: Group) => {
        setEditingId(g.id);
        setEditName(g.name);
        setEditColor(g.color);
    };

    const confirmEdit = () => {
        if (!editName.trim()) return;
        setLocalGroups(prev => prev.map(g => g.id === editingId
            ? { ...g, name: editName.trim(), color: editColor }
            : g
        ));
        setEditingId(null);
    };

    const deleteGroup = (id: string) => {
        if (!confirm("確定要刪除這個 Group 嗎？（現有成員任務中的 Group 標籤不會自動清除）")) return;
        setLocalGroups(prev => prev.filter(g => g.id !== id));
    };

    const addGroup = () => {
        if (!newName.trim()) return;
        const id = `group_${Date.now()}`;
        setLocalGroups(prev => [...prev, { id, name: newName.trim(), color: newColor }]);
        setNewName("");
        setNewColor("cyan");
    };

    const handleSave = async () => {
        setSaving(true);
        await onSave(localGroups);
        setSaving(false);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl flex flex-col max-h-[85vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Tag className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">管理 Group</h2>
                            <p className="text-xs text-slate-400">新增、修改、刪除任務分組</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Group List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {localGroups.length === 0 && (
                        <div className="text-center py-8 text-slate-500">尚無任何 Group</div>
                    )}
                    {localGroups.map(g => {
                        const style = getGroupStyle(g.color);
                        const isEditing = editingId === g.id;
                        return (
                            <div
                                key={g.id}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                            >
                                {isEditing ? (
                                    <>
                                        <input
                                            autoFocus
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && confirmEdit()}
                                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-400"
                                        />
                                        {/* Color picker */}
                                        <div className="flex gap-1">
                                            {COLOR_OPTIONS.map(c => (
                                                <button
                                                    key={c.key}
                                                    onClick={() => setEditColor(c.key)}
                                                    className={`w-5 h-5 rounded-full ${c.preview} transition-all ${editColor === c.key ? "ring-2 ring-white ring-offset-1 ring-offset-[#0f172a] scale-110" : "opacity-60 hover:opacity-100"}`}
                                                    title={c.label}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={confirmEdit}
                                            className="p-1.5 bg-green-500/20 hover:bg-green-500/40 rounded-lg text-green-400 transition-colors"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}>
                                            {g.name}
                                        </span>
                                        <span className="flex-1" />
                                        <button
                                            onClick={() => startEdit(g)}
                                            className="p-1.5 hover:bg-blue-500/20 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteGroup(g.id)}
                                            className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Add New Group */}
                <div className="p-5 border-t border-white/10 space-y-3 shrink-0">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">新增 Group</p>
                    <div className="flex gap-2">
                        <input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addGroup()}
                            placeholder="Group 名稱..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 placeholder:text-slate-500"
                        />
                        <button
                            onClick={addGroup}
                            disabled={!newName.trim()}
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                            <Plus className="h-4 w-4" />新增
                        </button>
                    </div>
                    {/* Color select */}
                    <div className="flex gap-1.5 flex-wrap">
                        {COLOR_OPTIONS.map(c => (
                            <button
                                key={c.key}
                                onClick={() => setNewColor(c.key)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all ${newColor === c.key ? `${c.bg} ${c.text} ${c.border}` : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"}`}
                            >
                                <span className={`w-2.5 h-2.5 rounded-full ${c.preview}`} />
                                {c.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 pt-0 shrink-0">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                        {saving ? "儲存中..." : "✓ 儲存變更"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
