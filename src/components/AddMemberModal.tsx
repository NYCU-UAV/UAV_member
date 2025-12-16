"use client";

import { useState, useRef, useEffect } from "react";
import { Member } from "@/types";
import { X, Upload, FileSpreadsheet, Loader2 } from "lucide-react";

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (members: Member[]) => void; // Pass an array to support bulk add
    existingMembers: Member[];
    editMember?: Member | null;
}

export default function AddMemberModal({ isOpen, onClose, onAdd, existingMembers, editMember }: AddMemberModalProps) {
    const [activeTab, setActiveTab] = useState<'manual' | 'csv'>('manual');
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        studentId: "",
        phone: "",
        email: "",
        account: "",
        group: "結構設計", // Default
        remarks: ""
    });

    useEffect(() => {
        if (editMember) {
            setFormData({
                name: editMember.name,
                studentId: editMember.studentId || "",
                phone: editMember.phone || "",
                email: editMember.email || "",
                account: editMember.account || "",
                group: editMember.group || "結構設計",
                remarks: editMember.remarks || ""
            });
            setActiveTab('manual');
        } else {
            setFormData({
                name: "",
                studentId: "",
                phone: "",
                email: "",
                account: "",
                group: "結構設計",
                remarks: ""
            });
        }
    }, [editMember]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Create new member object
        const newMember: Member = {
            id: editMember ? editMember.id : Date.now().toString(),
            name: formData.name,
            studentId: formData.studentId,
            phone: formData.phone,
            email: formData.email,
            account: formData.account,
            group: formData.group,
            remarks: formData.remarks,
            score: editMember ? editMember.score : 0,
            scoreHistory: editMember ? editMember.scoreHistory : [],
            // Initialize required fields for compliance with Task system
            currentTask: editMember ? editMember.currentTask : {
                title: "New Task", // Default task
                deadline: new Date().toISOString().split('T')[0],
                group: formData.group,
                progress: 0
            },
            stats: editMember ? editMember.stats : { success: 0, failed: 0 },
            history: editMember ? editMember.history : []
        };

        // Logic to check if updating existing member (UPSERT)
        // For manual entry, we usually assume new, but let's check name
        // If editing, we skip this check or just confirm if name changed and conflicts?
        if (!editMember) {
            const existing = existingMembers.find(m => m.name === newMember.name);
            if (existing) {
                if (!confirm(`Member "${newMember.name}" already exists. Update their info?`)) {
                    return;
                }
                newMember.id = existing.id;
                newMember.currentTask = existing.currentTask;
                newMember.stats = existing.stats;
                newMember.history = existing.history;
                newMember.score = existing.score;
                newMember.scoreHistory = existing.scoreHistory;
            }
        }


        onAdd([newMember]);

        // Reset form
        setFormData({
            name: "",
            studentId: "",
            phone: "",
            email: "",
            account: "",
            group: "結構設計",
            remarks: ""
        });

        onClose();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const rows = text.split('\n').filter(row => row.trim() !== '');

                // Expect CSV header or just order? Let's assume order or header.
                // Requirement: Name, Phone, Gmail, Account, Group, Remarks
                // Let's assume Header exists, but we'll try to detect.
                // Simple parser: Name,Phone,Email,Account,Group,Remarks

                const parsedMembers: Member[] = [];
                let startIndex = 0;

                // Skip header if first row has "name" or "姓名"
                if (rows.length > 0 && (rows[0].toLowerCase().includes('name') || rows[0].includes('姓名'))) {
                    startIndex = 1;
                }

                for (let i = startIndex; i < rows.length; i++) {
                    const cols = rows[i].split(',').map(c => c.trim());
                    if (cols.length < 1) continue;

                    const name = cols[0];
                    if (!name) continue;

                    const phone = cols[1] || "";
                    const email = cols[2] || "";
                    const account = cols[3] || "";
                    const group = cols[4] || "結構設計";
                    const remarks = cols[5] || "";
                    const studentId = cols[6] || "";

                    // Check duplicate in processed list

                    // Prepare Member object
                    // We need to check against existingMembers to preserve ID if exists
                    const existing = existingMembers.find(m => m.name === name);

                    const member: Member = {
                        id: existing ? existing.id : Date.now().toString() + i, // unique suffix
                        name,
                        studentId,
                        phone,
                        email,
                        account,
                        group,
                        remarks,
                        score: existing ? existing.score : 0,
                        scoreHistory: existing ? existing.scoreHistory : [],
                        currentTask: existing ? existing.currentTask : {
                            title: "New Task",
                            deadline: new Date().toISOString().split('T')[0],
                            group: group,
                            progress: 0
                        },
                        stats: existing ? existing.stats : { success: 0, failed: 0 },
                        history: existing ? existing.history : []
                    };
                    parsedMembers.push(member);
                }

                if (parsedMembers.length > 0) {
                    if (confirm(`Parsed ${parsedMembers.length} members. Import?`)) {
                        onAdd(parsedMembers);
                        onClose();
                    }
                } else {
                    alert("No valid members found in CSV.");
                }

            } catch (err) {
                console.error(err);
                alert("Failed to parse CSV.");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-[#1e2329] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">{editMember ? "編輯成員" : "新增成員"}</h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'manual' ? 'bg-white/5 text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        手動輸入
                    </button>
                    <button
                        onClick={() => setActiveTab('csv')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'csv' ? 'bg-white/5 text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        匯入 SCV
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'manual' ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">姓名 *</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    placeholder="輸入姓名"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">學號</label>
                                <input
                                    type="text"
                                    value={formData.studentId}
                                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    placeholder="輸入學號"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">電話</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                        placeholder="0912345678"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Gmail</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                        placeholder="example@gmail.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">帳戶</label>
                                    <input
                                        type="text"
                                        value={formData.account}
                                        onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                        placeholder="郵局/銀行帳號"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">組別</label>
                                    <select
                                        value={formData.group}
                                        onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    >
                                        <option value="結構設計">結構設計</option>
                                        <option value="電裝控制">電裝控制</option>
                                        <option value="系工相關">系工相關</option>
                                        <option value="公關相關">公關相關</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">備註</label>
                                <textarea
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none min-h-[80px]"
                                    placeholder="備註..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                            >
                                {editMember ? "儲存更改" : "新增成員"}
                            </button>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center">
                                {loading ? <Loader2 className="h-8 w-8 animate-spin text-blue-400" /> : <FileSpreadsheet className="h-8 w-8 text-green-400" />}
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="text-lg font-medium text-white">上傳 CSV 檔案</h3>
                                <p className="text-sm text-muted-foreground">格式: 姓名, 電話, Gmail, 帳戶, 組別, 備註, 學號</p>
                            </div>

                            <input
                                type="file"
                                accept=".csv"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileUpload}
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                            >
                                <Upload className="h-4 w-4" /> 選擇檔案
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
