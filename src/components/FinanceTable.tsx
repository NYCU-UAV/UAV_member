"use client";

import { useEffect, useState } from "react";
import { AppData, FinancialRecord } from "@/types";
import { Plus, Trash2, ArrowLeft, DollarSign, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function FinanceTable() {
    const [data, setData] = useState<AppData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [password, setPassword] = useState("");
    const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);

    const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
    const [newUnitName, setNewUnitName] = useState("");
    const [newUnitLimit, setNewUnitLimit] = useState("");
    const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
    const [newSourceName, setNewSourceName] = useState("");
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [showClearDataModal, setShowClearDataModal] = useState(false);
    const [clearPassword, setClearPassword] = useState("");

    const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'loan'>('expense');
    const [searchQuery, setSearchQuery] = useState("");
    const [showUnsettledOnly, setShowUnsettledOnly] = useState(false);
    const [showPendingReimbursementOnly, setShowPendingReimbursementOnly] = useState(false);

    // Form state
    const [newItem, setNewItem] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [newType, setNewType] = useState<'income' | 'expense' | 'loan'>('expense');
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [newUnit, setNewUnit] = useState("");
    const [newPayer, setNewPayer] = useState("NYCU-UAV");
    const [newRecipient, setNewRecipient] = useState("");
    const [newSource, setNewSource] = useState("");
    const [newCategory, setNewCategory] = useState<1 | 2 | 3 | 4>(1);
    const [isReimbursable, setIsReimbursable] = useState(false);
    const [isAdvanced, setIsAdvanced] = useState(false);
    const [isMagic, setIsMagic] = useState(false);
    const [reimbursementAmount, setReimbursementAmount] = useState("");
    const [newRemarks, setNewRemarks] = useState("");
    const [loanType, setLoanType] = useState<'borrow' | 'lend'>('borrow');
    const [counterparty, setCounterparty] = useState("");
    const [invoiceType, setInvoiceType] = useState<'physical' | 'digital'>('physical');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [editingUnit, setEditingUnit] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!isAdvanced && newType === 'expense') {
            setNewPayer("NYCU-UAV");
        }
    }, [isAdvanced, newType]);

    // Sync category based on toggles
    useEffect(() => {
        if (!isReimbursable && !isAdvanced) setNewCategory(1);
        if (isReimbursable && !isAdvanced) setNewCategory(2);
        if (!isReimbursable && isAdvanced) setNewCategory(3);
        if (isReimbursable && isAdvanced) setNewCategory(4);
    }, [isReimbursable, isAdvanced]);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/data");
            const json = await res.json();
            if (!json.finance) json.finance = [];
            if (!json.reimbursementUnits) json.reimbursementUnits = [];
            if (!json.incomeSources) json.incomeSources = [];
            if (!json.auditLog) json.auditLog = [];
            setData(json);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearData = async () => {
        try {
            const res = await fetch("/api/secret");
            const { secret } = await res.json();
            if (clearPassword === secret) {
                if (confirm("🚨 警告：這將會直接清空所有財務帳目、報帳單位、收入來源以及異動紀錄。此操作無法撤銷！確定要繼續嗎？")) {
                    const clearLog = [{
                        id: Date.now().toString(),
                        timestamp: new Date().toLocaleString(),
                        action: 'delete',
                        targetId: 'system',
                        targetName: '全系統資料',
                        details: '執行了全系統資料清除作業'
                    }];
                    await saveData([], [], [], clearLog);
                    setShowClearDataModal(false);
                    setClearPassword("");
                    alert("✅ 所有資料已成功清除！");
                }
            } else {
                alert("❌ 密碼錯誤，清除失敗");
            }
        } catch (error) {
            alert("❌ 驗證失敗");
        }
    };

    const handleLogin = async () => {
        try {
            const res = await fetch("/api/secret");
            const { secret } = await res.json();
            if (password === secret) {
                setIsAuthorized(true);
                setShowAuthModal(false);
                setPassword("");
            } else {
                alert("密碼錯誤");
            }
        } catch (error) {
            alert("驗證失敗");
        }
    };

    const saveData = async (updatedFinance: FinancialRecord[], updatedUnits?: any[], updatedSources?: string[], updatedAuditLog?: any[]) => {
        if (!data) return;
        try {
            const newData = {
                ...data,
                finance: updatedFinance,
                reimbursementUnits: updatedUnits || data.reimbursementUnits || [],
                incomeSources: updatedSources || data.incomeSources || [],
                auditLog: updatedAuditLog || data.auditLog || []
            };
            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newData)
            });
            setData(newData);
        } catch (error) {
            console.error("Failed to save data", error);
            alert("Failed to save changes");
        }
    };

    const addLog = (action: any, targetId: string, targetName: string, details: string) => {
        if (!data) return [];
        const newEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleString(),
            action,
            targetId,
            targetName,
            details
        };
        return [newEntry, ...(data.auditLog || [])].slice(0, 100);
    };

    const handleAddRecord = () => {
        if (!newItem || !newAmount) {
            alert("請填寫項目和金額");
            return;
        }

        const amount = parseFloat(newAmount);
        if (isNaN(amount)) {
            alert("金額格式錯誤");
            return;
        }

        const newRecord: FinancialRecord = {
            id: Date.now().toString(),
            date: newDate,
            item: newItem,
            type: newType,
            amount: amount,
            balance: 0,
            unit: newType === 'expense' ? (isReimbursable ? newUnit : undefined) : undefined,
            payer: newType === 'expense' ? newPayer : undefined,
            recipient: newType === 'income' ? newRecipient : undefined,
            source: newType === 'income' ? newSource : undefined,
            expenseCategory: newType === 'expense' ? newCategory : undefined,
            isMagic: newType === 'expense' ? (isReimbursable ? isMagic : false) : undefined,
            reimbursementAmount: newType === 'expense' ? (isReimbursable ? (isMagic ? parseFloat(reimbursementAmount) || amount : amount) : undefined) : undefined,
            reimbursementStatus: (newType === 'expense' && (newCategory === 2 || newCategory === 4)) ? 'pending' : 'none',
            repaymentStatus: (newType === 'expense' && (newCategory === 3 || newCategory === 4)) || (newType === 'income' && newRecipient !== 'NYCU-UAV') ? 'pending' : 'none',
            loanType: newType === 'loan' ? loanType : undefined,
            counterparty: newType === 'loan' ? counterparty : undefined,
            loanStatus: newType === 'loan' ? 'pending' : undefined,
            invoiceType: isReimbursable ? invoiceType : undefined,
            invoiceDate: isReimbursable ? invoiceDate : undefined,
            invoiceNumber: isReimbursable ? invoiceNumber : undefined,
            remarks: newRemarks
        };

        const updatedFinance = editingRecord
            ? (data?.finance || []).map(f => f.id === editingRecord.id ? { ...newRecord, id: f.id } : f)
            : [...(data?.finance || []), newRecord];

        const details = editingRecord
            ? `修改帳目: ${editingRecord.item} -> ${newItem}, 金額: ${editingRecord.amount} -> ${newAmount}`
            : `新增帳目: ${newItem}, 金額: ${newAmount}`;

        const updatedLog = addLog(editingRecord ? 'update' : 'create', newRecord.id, newItem, details);
        saveData(updatedFinance, undefined, undefined, updatedLog);

        // Reset form
        handleCloseModal();
    };

    const handleEdit = (record: FinancialRecord) => {
        setEditingRecord(record);
        setNewItem(record.item);
        setNewAmount(record.amount.toString());
        setNewDate(record.date);
        setNewType(record.type);
        setNewUnit(record.unit || "");
        setNewPayer(record.payer || "NYCU-UAV");
        setNewRecipient(record.recipient || "");
        setNewSource(record.source || "");
        setNewCategory(record.expenseCategory || 1);
        setIsReimbursable(record.expenseCategory === 2 || record.expenseCategory === 4);
        setIsAdvanced(record.expenseCategory === 3 || record.expenseCategory === 4);
        setIsMagic(record.isMagic || false);
        setReimbursementAmount(record.reimbursementAmount?.toString() || "");
        setNewRemarks(record.remarks || "");
        setLoanType(record.loanType || 'borrow');
        setCounterparty(record.counterparty || "");
        setInvoiceType(record.invoiceType || 'physical');
        setInvoiceDate(record.invoiceDate || record.date);
        setInvoiceNumber(record.invoiceNumber || "");
        setIsAddModalOpen(true);
    };

    const handleUpdateLoanStatus = (id: string, status: 'pending' | 'settled') => {
        if (!data) return;
        const updatedFinance = data.finance.map(f =>
            f.id === id ? { ...f, loanStatus: status } : f
        );
        const record = data.finance.find(f => f.id === id);
        const details = `變更借款狀態: ${status === 'settled' ? '✅ 已歸還' : '⏳ 借款中'}`;
        const updatedLog = addLog('status_change', id, record?.item || '未知項目', details);
        saveData(updatedFinance, undefined, undefined, updatedLog);
    };

    const handleCloseModal = () => {
        setEditingRecord(null);
        setNewItem("");
        setNewAmount("");
        setNewUnit("");
        setNewPayer("NYCU-UAV");
        setNewRecipient("");
        setNewSource("");
        setIsReimbursable(false);
        setIsAdvanced(false);
        setIsMagic(false);
        setReimbursementAmount("");
        setNewRemarks("");
        setLoanType('borrow');
        setCounterparty("");
        setInvoiceType('physical');
        setInvoiceDate(new Date().toISOString().split('T')[0]);
        setInvoiceNumber("");
        setIsAddModalOpen(false);
    };

    const handleUpdateReimbStatus = (id: string, status: 'none' | 'pending' | 'received') => {
        if (!data) return;
        const updatedFinance = data.finance.map(f =>
            f.id === id ? { ...f, reimbursementStatus: status } : f
        );
        const record = data.finance.find(f => f.id === id);
        const details = `變更報帳狀態: ${status === 'received' ? '✅ 已入帳' : '⏳ 待報中'}`;
        const updatedLog = addLog('status_change', id, record?.item || '未知項目', details);
        saveData(updatedFinance, undefined, undefined, updatedLog);
    };

    const handleUpdateRepayStatus = (id: string, status: 'none' | 'pending' | 'completed') => {
        if (!data) return;
        const updatedFinance = data.finance.map(f =>
            f.id === id ? { ...f, repaymentStatus: status } : f
        );
        const record = data.finance.find(f => f.id === id);
        const details = `變更還款狀態: ${status === 'completed' ? '🤝 已還款' : '💸 待還款'}`;
        const updatedLog = addLog('status_change', id, record?.item || '未知項目', details);
        saveData(updatedFinance, undefined, undefined, updatedLog);
    };

    const handleAddUnit = () => {
        if (!newUnitName || !data) return;
        const limit = parseFloat(newUnitLimit) || 0;
        const updatedUnits = [...(data.reimbursementUnits || []), { name: newUnitName, limit }];
        const updatedLog = addLog('create', 'system', '報帳單位', `新增報帳單位: ${newUnitName}, 上限: ${limit}`);
        saveData(data.finance, updatedUnits, undefined, updatedLog);
        setNewUnitName("");
        setNewUnitLimit("");
        setIsAddUnitModalOpen(false);
    };

    const handleAddSource = () => {
        if (!newSourceName || !data) return;
        const updatedSources = [...(data.incomeSources || []), newSourceName];
        const updatedLog = addLog('create', 'system', '收入來源', `新增收入來源: ${newSourceName}`);
        saveData(data.finance, undefined, updatedSources, updatedLog);
        setNewSourceName("");
    };

    const handleDeleteSource = (name: string) => {
        if (!data) return;
        if (!confirm(`確定要刪除「${name}」這個來源嗎？已掛勾的帳目將不受影響。`)) return;
        const updatedSources = data.incomeSources?.filter(s => s !== name) || [];
        const updatedLog = addLog('delete', 'system', '收入來源', `刪除收入來源: ${name}`);
        saveData(data.finance, undefined, updatedSources, updatedLog);
    };

    const handleDelete = (id: string) => {
        if (!data) return;
        const record = data.finance.find(f => f.id === id);
        if (!confirm(`確定要刪除「${record?.item}」這筆紀錄嗎？`)) return;
        const updatedFinance = data.finance.filter(f => f.id !== id);
        const updatedLog = addLog('delete', id, record?.item || '未知項目', `刪除帳目: ${record?.item}, 金額: ${record?.amount}`);
        saveData(updatedFinance, undefined, undefined, updatedLog);
    };

    const processedRecords = [...(data?.finance || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentBalance = 0;
    const recordsWithBalance = processedRecords.map(record => {
        if (record.type === 'income') {
            if (record.recipient === 'NYCU-UAV' || record.repaymentStatus === 'completed') {
                currentBalance += record.amount;
            }
        } else if (record.type === 'expense') {
            const cat = record.expenseCategory || 1;
            if (cat === 1 || cat === 2) {
                currentBalance -= record.amount;
            }
            if ((cat === 2 || cat === 4) && record.reimbursementStatus === 'received') {
                currentBalance += record.reimbursementAmount || 0;
            }
            if ((cat === 3 || cat === 4) && record.repaymentStatus === 'completed') {
                currentBalance -= record.amount;
            }
        } else if (record.type === 'loan') {
            if (record.loanType === 'borrow') {
                currentBalance += record.amount;
                if (record.loanStatus === 'settled') currentBalance -= record.amount;
            } else if (record.loanType === 'lend') {
                currentBalance -= record.amount;
                if (record.loanStatus === 'settled') currentBalance += record.amount;
            }
        }
        return { ...record, balance: currentBalance };
    });

    const displayRecords = [...recordsWithBalance].reverse();

    // Filter and Search Logic
    const filteredRecords = displayRecords.filter(record => {
        // 1. Global Search
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            record.item.toLowerCase().includes(searchLower) ||
            record.amount.toString().includes(searchLower) ||
            (record.unit?.toLowerCase().includes(searchLower)) ||
            (record.payer?.toLowerCase().includes(searchLower)) ||
            (record.recipient?.toLowerCase().includes(searchLower)) ||
            (record.counterparty?.toLowerCase().includes(searchLower)) ||
            (record.invoiceNumber?.toLowerCase().includes(searchLower)) ||
            (record.remarks?.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;

        // 2. Unsettled Debt Filter (Club owes people)
        if (showUnsettledOnly) {
            const isUnpaidExpense = record.type === 'expense' && (record.expenseCategory === 3 || record.expenseCategory === 4) && record.repaymentStatus === 'pending';
            const isUnsettledLoan = record.type === 'loan' && record.loanStatus === 'pending';
            const isUnpaidIncome = record.type === 'income' && record.recipient !== 'NYCU-UAV' && record.repaymentStatus !== 'completed';
            return isUnpaidExpense || isUnsettledLoan || isUnpaidIncome;
        }

        // 3. Pending Reimbursement Filter (Units owe Club)
        if (showPendingReimbursementOnly) {
            return record.type === 'expense' &&
                (record.expenseCategory === 2 || record.expenseCategory === 4) &&
                record.reimbursementStatus === 'pending';
        }

        // 4. Tab Filter
        return record.type === activeTab;
    });

    // Calculate Unsettled Totals for the "Debt Tracker" mode
    const debtSummary = showUnsettledOnly ? filteredRecords.reduce((acc: any, record) => {
        const person = record.type === 'expense' ? record.payer :
            record.type === 'income' ? record.recipient : record.counterparty;
        if (!person) return acc;

        if (!acc[person]) acc[person] = { owe: 0, lend: 0 };

        if (record.type === 'expense') {
            acc[person].owe += record.amount;
        } else if (record.type === 'income') {
            acc[person].lend += record.amount;
        } else if (record.type === 'loan') {
            if (record.loanType === 'borrow') acc[person].owe += record.amount;
            else acc[person].lend += record.amount;
        }
        return acc;
    }, {}) : null;

    // Calculate Pending Reimbursement Totals for the "Unit Tracker" mode
    const unitSummary = (showPendingReimbursementOnly || true) ? data?.reimbursementUnits?.reduce((acc: any, unit: any) => {
        const matchingRecords = recordsWithBalance.filter(f => f.unit === unit.name);
        const pending = matchingRecords
            .filter(f => (f.expenseCategory === 2 || f.expenseCategory === 4) && f.reimbursementStatus === 'pending')
            .reduce((sum, f) => sum + (f.reimbursementAmount || f.amount), 0);
        const received = matchingRecords
            .filter(f => (f.expenseCategory === 2 || f.expenseCategory === 4) && f.reimbursementStatus === 'received')
            .reduce((sum, f) => sum + (f.reimbursementAmount || f.amount), 0);

        acc[unit.name] = { pending, received, limit: unit.limit || 0 };
        return acc;
    }, {}) : null;

    if (loading) return <div className="text-white text-center p-8 text-xl font-bold animate-pulse">正在載入金流系統...</div>;

    const handleUpdateUnit = (oldName: string) => {
        if (!newUnitName || !data) return;
        const limit = parseFloat(newUnitLimit) || 0;
        const updatedUnits = data.reimbursementUnits?.map(u => u.name === oldName ? { ...u, name: newUnitName, limit } : u) || [];
        const updatedFinance = data.finance.map(f => f.unit === oldName ? { ...f, unit: newUnitName } : f);
        const updatedLog = addLog('update', 'system', '報帳單位', `修改報帳單位: ${oldName} -> ${newUnitName}, 上限: ${limit}`);
        saveData(updatedFinance, updatedUnits, undefined, updatedLog);
        setNewUnitName("");
        setNewUnitLimit("");
        setEditingUnit(null);
    };

    const handleDeleteUnit = (name: string) => {
        if (!data) return;
        if (!confirm(`確定要刪除「${name}」這個單位嗎？已掛勾的帳目將不受影響。`)) return;
        const updatedUnits = data.reimbursementUnits?.filter(u => u.name !== name) || [];
        const updatedLog = addLog('delete', 'system', '報帳單位', `刪除報帳單位: ${name}`);
        saveData(data.finance, updatedUnits, undefined, updatedLog);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-3 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all ring-1 ring-white/10">
                            <ArrowLeft className="h-6 w-6" />
                        </Link>
                        <h1 className="text-4xl font-black tracking-tight text-white glow-text uppercase">
                            金流 <span className="text-blue-500">管理控制台</span>
                        </h1>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
                        <div className="h-10 w-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">目前總餘額</div>
                            <div className={cn("text-2xl font-mono font-black", currentBalance >= 0 ? "text-green-400" : "text-red-400")}>
                                ${currentBalance.toLocaleString()}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        {isAuthorized ? (
                            <>
                                {activeTab === 'expense' ? (
                                    <button onClick={() => setIsAddUnitModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-bold text-xs border border-white/10 shadow-lg">
                                        <Plus className="h-4 w-4" /> 新增報帳單位
                                    </button>
                                ) : (
                                    <button onClick={() => setIsAddSourceModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-bold text-xs border border-white/10 shadow-lg">
                                        <Plus className="h-4 w-4" /> 新增收入來源
                                    </button>
                                )}
                                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-black text-sm shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                                    <Plus className="h-5 w-5" /> 新增帳目
                                </button>
                                <button onClick={() => setIsAuthorized(false)} className="text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest text-right pr-1 italic">
                                    登出管理員身分
                                </button>
                                <button onClick={() => setShowAuditModal(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 rounded-xl transition-all font-bold text-xs border border-purple-600/20 shadow-lg">
                                    📜 查看異動紀錄
                                </button>
                                <button onClick={() => setShowClearDataModal(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl transition-all font-bold text-xs border border-red-600/20 shadow-lg">
                                    🗑️ 資料清除
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setShowAuthModal(true)} className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-black text-sm border border-white/10 shadow-xl">
                                🔑 管理員登入
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl w-fit shadow-2xl">
                    {['expense', 'income', 'loan'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab as any);
                                setShowUnsettledOnly(false);
                                setShowPendingReimbursementOnly(false);
                            }}
                            className={cn(
                                "px-10 py-3 rounded-xl text-sm font-black transition-all uppercase tracking-widest",
                                !showUnsettledOnly && !showPendingReimbursementOnly && activeTab === tab
                                    ? (tab === 'expense' ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" :
                                        tab === 'income' ? "bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]" :
                                            "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]")
                                    : "text-slate-500 hover:text-white"
                            )}
                        >
                            {tab === 'expense' ? '支出列表' : tab === 'income' ? '收入列表' : '借款紀錄'}
                        </button>
                    ))}
                    <button
                        onClick={() => {
                            setShowUnsettledOnly(!showUnsettledOnly);
                            setShowPendingReimbursementOnly(false);
                        }}
                        className={cn(
                            "px-10 py-3 rounded-xl text-sm font-black transition-all uppercase tracking-widest border border-white/10",
                            showUnsettledOnly
                                ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] border-orange-400"
                                : "text-slate-500 hover:text-white hover:bg-white/5"
                        )}
                    >
                        ⚖️ 債務追蹤
                    </button>
                    <button
                        onClick={() => {
                            setShowPendingReimbursementOnly(!showPendingReimbursementOnly);
                            setShowUnsettledOnly(false);
                        }}
                        className={cn(
                            "px-10 py-3 rounded-xl text-sm font-black transition-all uppercase tracking-widest border border-white/10",
                            showPendingReimbursementOnly
                                ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] border-blue-400"
                                : "text-slate-500 hover:text-white hover:bg-white/5"
                        )}
                    >
                        🏢 當期報帳追蹤
                    </button>
                </div>

                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Plus className="h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors rotate-45" />
                    </div>
                    <input
                        type="text"
                        placeholder="搜尋全域: 項目、金額、姓名、單位..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500/50 outline-none hover:bg-black/60 transition-all placeholder:text-slate-600 shadow-xl"
                    />
                </div>
            </div>

            {showUnsettledOnly && debtSummary && Object.keys(debtSummary).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300">
                    {Object.entries(debtSummary).map(([person, totals]: [string, any]) => (
                        <div key={person} className="bg-slate-900/50 border border-orange-500/20 rounded-3xl p-5 space-y-3">
                            <div className="text-xs font-black text-orange-400 uppercase tracking-widest">欠款對象</div>
                            <div className="text-xl font-black text-white">{person}</div>
                            <div className="flex justify-between items-end border-t border-white/5 pt-3">
                                <div className="space-y-1">
                                    <div className="text-xs font-black text-slate-500 uppercase">社團應付</div>
                                    <div className="text-lg font-mono font-black text-red-400">-${totals.owe.toLocaleString()}</div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <div className="text-xs font-black text-slate-500 uppercase">社團應收</div>
                                    <div className="text-lg font-mono font-black text-green-400">+${totals.lend.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showPendingReimbursementOnly && unitSummary && Object.keys(unitSummary).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300">
                    {Object.entries(unitSummary).map(([unit, stats]: [string, any]) => (
                        <div key={unit} className="bg-slate-900/50 border border-blue-500/20 rounded-3xl p-5 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs font-black text-blue-400 uppercase tracking-widest">報帳單位</div>
                                    <div className="text-xl font-black text-white italic">{unit}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest">年度額度</div>
                                    <div className="text-sm font-mono font-black text-slate-400">${stats.limit.toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center transition-all bg-white/5 rounded-lg px-2 py-1">
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">已核銷進度</span>
                                    <span className={cn("text-[10px] font-mono font-black", stats.received + stats.pending > stats.limit ? "text-red-400" : "text-blue-400")}>
                                        {Math.round((stats.received / stats.limit) * 100 || 0)}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                        style={{ width: `${Math.min(100, (stats.received / stats.limit) * 100 || 0)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="pt-3 flex items-end justify-between">
                                <div className="space-y-1">
                                    <div className="text-xs font-black text-blue-500 uppercase tracking-widest">當期應報</div>
                                    <div className="text-2xl font-mono font-black text-blue-400 leading-none">${stats.pending.toLocaleString()}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-black text-slate-600 uppercase tracking-widest">剩餘可用</div>
                                    <div className="text-xs font-mono font-bold text-slate-400">${(stats.limit - stats.received - stats.pending).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl overflow-hidden shadow-2xl">
                <div className="grid grid-cols-12 gap-4 bg-white/5 p-5 text-xs font-black text-slate-400 uppercase tracking-[2px] border-b border-white/10">
                    <div className="col-span-2">{showPendingReimbursementOnly ? '📄 發票日期' : '📅 交易日期'}</div>
                    <div className="col-span-2">🧾 消費品名 / 摘要</div>
                    <div className="col-span-2 text-center">
                        {showPendingReimbursementOnly ? '🔢 發票號碼' :
                            showUnsettledOnly ? '👤 往來對象' :
                                (activeTab === 'expense' ? '🏢 報帳單位' : activeTab === 'loan' ? '👤 往來對象' : '👤 收款成員')}
                    </div>
                    <div className="col-span-1 text-center">
                        {showPendingReimbursementOnly ? '📋 類別' :
                            showUnsettledOnly ? '↕️ 欠款性質' :
                                (activeTab === 'expense' ? '💳 支付者' : activeTab === 'loan' ? '↔️ 借貸性質' : '📥 來源')}
                    </div>
                    <div className="col-span-2 text-center">{activeTab === 'loan' ? '狀態/歸還' : '報帳/還款'}</div>
                    <div className="col-span-1 text-right">金額</div>
                    <div className="col-span-1 text-right">當下餘額</div>
                    <div className="col-span-1 text-right pr-2">操作項目</div>
                </div>

                <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {filteredRecords.map((record) => (
                        <div key={record.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-white/5 transition-all group border-l-4 border-transparent hover:border-blue-500">
                            <div className="col-span-2 text-slate-400 font-mono text-xs">{showPendingReimbursementOnly ? (record.invoiceDate || record.date) : record.date}</div>
                            <div className="col-span-2 font-bold text-white tracking-wide">{record.item}</div>
                            <div className="col-span-2 text-center">
                                {showPendingReimbursementOnly ? (
                                    <span className="font-mono text-blue-400 font-black">{record.invoiceNumber || "---"}</span>
                                ) : showUnsettledOnly ? (
                                    <span className="font-bold text-white">{record.type === 'expense' ? record.payer : record.counterparty}</span>
                                ) : (
                                    activeTab === 'expense' ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-xs font-black border border-blue-500/20 truncate max-w-[150px] shadow-sm">
                                                {record.unit || "未分類"}
                                            </span>
                                        </div>
                                    ) : activeTab === 'loan' ? (
                                        <span className="font-bold text-white">{record.counterparty}</span>
                                    ) : (
                                        <span className="font-bold text-white">{record.recipient}</span>
                                    )
                                )}
                            </div>
                            <div className="col-span-1 text-center">
                                {showPendingReimbursementOnly ? (
                                    <span className={cn("px-2 py-0.5 rounded text-xs font-black uppercase", record.invoiceType === 'physical' ? "bg-amber-500/10 text-amber-500" : "bg-cyan-500/10 text-cyan-500")}>
                                        {record.invoiceType === 'physical' ? '紙本' : '網路'}
                                    </span>
                                ) : showUnsettledOnly ? (
                                    <span className={cn(
                                        "px-2 py-1 rounded text-xs font-black",
                                        (record.type === 'expense' || (record.type === 'loan' && record.loanType === 'borrow')) ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                                    )}>
                                        {(record.type === 'expense' || (record.type === 'loan' && record.loanType === 'borrow')) ? '社團應付' : '社團應收'}
                                    </span>
                                ) : (
                                    activeTab === 'expense' ? (
                                        <span className="text-slate-400 font-bold">{record.payer}</span>
                                    ) : activeTab === 'loan' ? (
                                        <span className={cn("px-2 py-1 rounded text-xs font-black uppercase", record.loanType === 'borrow' ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500")}>
                                            {record.loanType === 'borrow' ? '借入' : '借出'}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 font-bold">{record.source}</span>
                                    )
                                )}
                            </div>

                            <div className="col-span-2 flex flex-col gap-1.5 items-center">
                                {record.type === 'loan' && (
                                    <button
                                        onClick={() => isAuthorized && handleUpdateLoanStatus(record.id, record.loanStatus === 'settled' ? 'pending' : 'settled')}
                                        disabled={!isAuthorized}
                                        className={cn(
                                            "text-xs font-black px-4 py-2.5 rounded-xl border transition-all w-full uppercase shadow-sm whitespace-nowrap",
                                            !isAuthorized ? "bg-slate-800/50 text-slate-600 border-white/5 cursor-default" :
                                                record.loanStatus === 'settled'
                                                    ? "bg-purple-500/20 text-purple-400 border-purple-400/30"
                                                    : "bg-slate-800 text-slate-400 border-white/10 hover:bg-slate-700 hover:text-white"
                                        )}
                                    >
                                        {record.loanStatus === 'settled' ? '🤝 已歸還' : (record.loanType === 'borrow' ? '💸 待還款' : '💰 待收款')}
                                    </button>
                                )}
                                {record.type === 'expense' && (
                                    <>
                                        {(record.expenseCategory === 2 || record.expenseCategory === 4) && (
                                            <button
                                                onClick={() => isAuthorized && handleUpdateReimbStatus(record.id, record.reimbursementStatus === 'received' ? 'pending' : 'received')}
                                                disabled={!isAuthorized}
                                                className={cn(
                                                    "text-xs font-black px-4 py-2.5 rounded-xl border transition-all w-full uppercase shadow-sm whitespace-nowrap",
                                                    !isAuthorized ? "bg-slate-800/50 text-slate-600 border-white/5 cursor-default" :
                                                        record.reimbursementStatus === 'received'
                                                            ? "bg-green-500/20 text-green-400 border-green-400/30"
                                                            : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20"
                                                )}
                                            >
                                                {record.reimbursementStatus === 'received' ? '✅ 入帳' : '⏳ 待報'}
                                            </button>
                                        )}
                                        {(record.expenseCategory === 3 || record.expenseCategory === 4) && (
                                            <button
                                                onClick={() => isAuthorized && handleUpdateRepayStatus(record.id, record.repaymentStatus === 'completed' ? 'pending' : 'completed')}
                                                disabled={!isAuthorized}
                                                className={cn(
                                                    "text-xs font-black px-4 py-2.5 rounded-xl border transition-all w-full uppercase shadow-sm whitespace-nowrap",
                                                    !isAuthorized ? "bg-slate-800/50 text-slate-600 border-white/5 cursor-default" :
                                                        record.repaymentStatus === 'completed'
                                                            ? "bg-blue-500/20 text-blue-400 border-blue-400/30"
                                                            : "bg-slate-800 text-slate-400 border-white/10 hover:bg-slate-700 hover:text-white"
                                                )}
                                            >
                                                {record.repaymentStatus === 'completed' ? '🤝 已還' : '💸 待還'}
                                            </button>
                                        )}
                                        {record.expenseCategory === 1 && <span className="text-xs font-black text-slate-600 tracking-widest italic opacity-50">一般支出</span>}
                                    </>
                                )}
                                {record.type === 'income' && (
                                    <>
                                        {record.recipient !== 'NYCU-UAV' ? (
                                            <button
                                                onClick={() => isAuthorized && handleUpdateRepayStatus(record.id, record.repaymentStatus === 'completed' ? 'pending' : 'completed')}
                                                disabled={!isAuthorized}
                                                className={cn(
                                                    "text-xs font-black px-4 py-2.5 rounded-xl border transition-all w-full uppercase shadow-sm whitespace-nowrap",
                                                    !isAuthorized ? "bg-slate-800/50 text-slate-600 border-white/5 cursor-default" :
                                                        record.repaymentStatus === 'completed'
                                                            ? "bg-blue-500/20 text-blue-400 border-blue-400/30"
                                                            : "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20 shadow-lg shadow-orange-500/5"
                                                )}
                                            >
                                                {record.repaymentStatus === 'completed' ? '🤝 已入庫' : '📥 待繳回'}
                                            </button>
                                        ) : (
                                            <span className="text-xs font-black text-slate-600 tracking-widest italic opacity-50">直入社庫</span>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="col-span-1 text-right">
                                <span className={cn(
                                    "font-mono font-black text-xl",
                                    record.type === 'income' ? "text-green-400" :
                                        (record.type === 'loan' && record.loanType === 'borrow') ? "text-green-400" : "text-red-400"
                                )}>
                                    {(record.type === 'income' || (record.type === 'loan' && record.loanType === 'borrow')) ? '+' : '-'}{record.amount.toLocaleString()}
                                </span>
                                {record.isMagic && (
                                    <div className="text-[10px] text-purple-400 font-black animate-pulse">
                                        🪄 報 ${record.reimbursementAmount?.toLocaleString()}
                                    </div>
                                )}
                            </div>
                            <div className="col-span-1 text-right font-mono text-slate-500 text-sm font-bold">
                                {record.balance.toLocaleString()}
                            </div>
                            <div className="col-span-1 text-right flex justify-end gap-1.5">
                                {isAuthorized && (
                                    <>
                                        <button
                                            onClick={() => handleEdit(record)}
                                            className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl text-blue-400 transition-all opacity-0 group-hover:opacity-100"
                                            title="編輯"
                                        >
                                            <FileText className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(record.id)}
                                            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                            title="刪除"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredRecords.length === 0 && (
                        <div className="p-32 text-center">
                            <div className="text-slate-600 text-lg font-bold mb-4 uppercase tracking-[4px]">尚無帳目資料</div>
                            {isAuthorized && (
                                <button onClick={() => setIsAddModalOpen(true)} className="px-8 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-full font-black text-sm transition-all border border-blue-600/20 tracking-widest uppercase">
                                    + 開始記錄帳目
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Record Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(37,99,235,0.1)] overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 space-y-6 flex-1 flex flex-col min-h-0">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                                    {editingRecord ? '編輯帳目' : '新增帳目'} <span className="text-blue-500">Record</span>
                                </h2>
                                <button onClick={handleCloseModal} className="h-10 w-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 rounded-full transition-all ring-1 ring-white/10 font-bold">✕</button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 min-h-0">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300 mb-1 pl-1 block">💰 資金系統性質</label>
                                    <div className="flex p-1.5 bg-black/40 border border-white/5 rounded-2xl">
                                        {(['income', 'expense', 'loan'] as const).map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => {
                                                    setNewType(type);
                                                    if (type === 'expense') setNewPayer("NYCU-UAV");
                                                }}
                                                className={cn(
                                                    "flex-1 py-3.5 rounded-xl text-xs font-black transition-all uppercase tracking-tighter",
                                                    newType === type
                                                        ? (type === 'income' ? "bg-green-600 text-white shadow-lg shadow-green-600/20" :
                                                            type === 'expense' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" :
                                                                "bg-purple-600 text-white shadow-lg shadow-purple-600/20")
                                                        : "text-slate-500 hover:text-white"
                                                )}
                                            >
                                                {type === 'income' ? '➕ 收入' : type === 'expense' ? '➖ 支出' : '🔄 借貸'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-300 mb-1 pl-1 block">📅 交易 / 購買日期</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm font-bold focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none hover:bg-black/60 transition-all appearance-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-300 mb-1 pl-1 block">🍔 品名 / 摘要</label>
                                        <div className="relative group">
                                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                            <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="例：創創 螺絲、冷氣費..." className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm font-bold focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none hover:bg-black/60 transition-all" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-300 mb-1 pl-1 block">金額</label>
                                        <div className="relative group">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                                            <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0" className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white text-sm font-black focus:ring-2 focus:ring-blue-500/50 outline-none hover:bg-black/60 transition-all font-mono" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-300 mb-1 pl-1 block">備註說明</label>
                                        <input type="text" value={newRemarks} onChange={(e) => setNewRemarks(e.target.value)} placeholder="選填詳細說明..." className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500/50 outline-none hover:bg-black/60 transition-all" />
                                    </div>
                                </div>

                                {newType === 'loan' ? (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-300 mb-1 pl-1 block">借貸方式</label>
                                            <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                                                <button type="button" onClick={() => setLoanType('borrow')} className={cn("py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest", loanType === 'borrow' ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-400")}>跟我借入</button>
                                                <button type="button" onClick={() => setLoanType('lend')} className={cn("py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest", loanType === 'lend' ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-400")}>借給他人</button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-300 mb-1 pl-1 block">借貸對象</label>
                                            <select value={counterparty} onChange={(e) => setCounterparty(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none hover:bg-black/60 transition-all">
                                                <option value="">選擇成員/對象</option>
                                                {data?.members?.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                                <option value="其他外部對象">其他外部對象</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : newType === 'expense' ? (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="grid grid-cols-2 gap-3 p-1.5 bg-black/40 rounded-2xl border border-white/5">
                                            <button
                                                type="button"
                                                onClick={() => setIsReimbursable(!isReimbursable)}
                                                className={cn(
                                                    "py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest flex items-center justify-center gap-2",
                                                    isReimbursable ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "text-slate-500 hover:text-white"
                                                )}
                                            >
                                                <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-all", isReimbursable ? "bg-white border-white" : "border-slate-500")}>
                                                    {isReimbursable && <div className="w-2 h-2 bg-purple-600 rounded-sm" />}
                                                </div>
                                                報帳模式
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsAdvanced(!isAdvanced)}
                                                className={cn(
                                                    "py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest flex items-center justify-center gap-2",
                                                    isAdvanced ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-slate-500 hover:text-white"
                                                )}
                                            >
                                                <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-all", isAdvanced ? "bg-white border-white" : "border-slate-500")}>
                                                    {isAdvanced && <div className="w-2 h-2 bg-orange-600 rounded-sm" />}
                                                </div>
                                                他人代墊
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {isReimbursable ? (
                                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <label className="text-sm font-bold text-slate-300 mb-1 pl-1 block">報帳對象單位</label>
                                                    <div className="flex gap-2">
                                                        <select value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500/50 outline-none hover:bg-black/60 transition-all appearance-none">
                                                            <option value="">選擇單位</option>
                                                            {data?.reimbursementUnits?.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                                                        </select>
                                                        <button type="button" onClick={() => setIsAddUnitModalOpen(true)} className="p-3.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/20 transition-all shadow-lg shadow-blue-500/5">
                                                            <Plus className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : null}
                                            <div className={cn("space-y-2 transition-all duration-200", !isReimbursable && "col-span-2")}>
                                                <label className="text-sm font-bold text-slate-300 mb-1 pl-1 block">🏦 實際支付者 / 帳戶</label>
                                                <select
                                                    value={newPayer}
                                                    onChange={(e) => setNewPayer(e.target.value)}
                                                    disabled={!isAdvanced}
                                                    className={cn(
                                                        "w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none",
                                                        !isAdvanced ? "opacity-30 cursor-not-allowed bg-black/20" : "hover:bg-black/60"
                                                    )}
                                                >
                                                    {!isAdvanced ? (
                                                        <option value="NYCU-UAV">NYCU-UAV</option>
                                                    ) : (
                                                        <>
                                                            <option value="">選擇代墊成員</option>
                                                            {data?.members?.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                        </div>

                                        {isReimbursable && (
                                            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="text-xs font-black text-blue-400 uppercase tracking-[2px] flex items-center gap-2">
                                                    <FileText className="h-3 w-3" /> 發票資訊
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-slate-300 mb-1 pl-1 block">發票類型</label>
                                                        <div className="flex gap-2">
                                                            {['physical', 'digital'].map(t => (
                                                                <button
                                                                    key={t}
                                                                    type="button"
                                                                    onClick={() => setInvoiceType(t as any)}
                                                                    className={cn(
                                                                        "flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all",
                                                                        invoiceType === t ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500 hover:text-white"
                                                                    )}
                                                                >
                                                                    {t === 'physical' ? '紙本' : '網路'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-slate-300 mb-1 pl-1 block">發票日期</label>
                                                        <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-bold focus:ring-2 focus:ring-blue-500/50 outline-none" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-300 mb-1 pl-1 block">發票號碼</label>
                                                    <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="例如：AB-12345678" className="w-full bg-black/40 border border-blue-500/30 rounded-xl pl-12 pr-4 py-3 text-white text-sm font-mono font-black focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-slate-700" />
                                                </div>

                                                <div className="pt-2 border-t border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <input type="checkbox" id="magicCheck" checked={isMagic} onChange={(e) => setIsMagic(e.target.checked)} className="h-5 w-5 rounded-lg bg-black/40 border-white/10 text-blue-600 focus:ring-blue-500" />
                                                        <label htmlFor="magicCheck" className="text-sm font-black text-slate-400 cursor-pointer">🪄 魔法報帳</label>
                                                    </div>
                                                    {isMagic && (
                                                        <div className="space-y-2 mt-3 animate-in slide-in-from-top-2">
                                                            <label className="text-xs font-black text-blue-400/60 uppercase tracking-widest">實際報帳金額</label>
                                                            <div className="relative">
                                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                                                                <input type="number" value={reimbursementAmount} onChange={(e) => setReimbursementAmount(e.target.value)} placeholder="0" className="w-full bg-black/40 border border-blue-500/30 rounded-xl pl-12 pr-4 py-3 text-white text-sm font-black focus:ring-2 focus:ring-blue-500" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : newType === 'income' ? (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-300 mb-1 pl-1 block">入帳成員</label>
                                            <select value={newRecipient} onChange={(e) => setNewRecipient(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none hover:bg-black/60 transition-all">
                                                <option value="">選擇收款成員</option>
                                                {data?.members?.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                                <option value="NYCU-UAV">NYCU-UAV (社團中心)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-300 mb-1 pl-1 block">收入來源</label>
                                            <div className="flex gap-2">
                                                <select value={newSource} onChange={(e) => setNewSource(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none hover:bg-black/60 transition-all">
                                                    <option value="">選擇來源</option>
                                                    {data?.incomeSources?.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <button type="button" onClick={() => setIsAddSourceModalOpen(true)} className="p-3.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-2xl border border-green-500/20 transition-all shadow-lg shadow-green-500/5">
                                                    <Plus className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                            </div>

                            <div className="pt-4 flex gap-4 border-t border-white/5">
                                <button onClick={handleCloseModal} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-[1.5rem] transition-all font-black text-sm uppercase tracking-widest">放棄變更</button>
                                <button onClick={handleAddRecord} className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] transition-all font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                                    {editingRecord ? '更新帳目' : '確認新增'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Other Modals (Password, Unit, Source) */}
            {showAuthModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in zoom-in duration-300">
                    <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[3rem] p-10 space-y-8 shadow-[0_0_100px_rgba(37,99,235,0.2)]">
                        <div className="text-center space-y-3">
                            <div className="h-16 w-16 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Plus className="h-8 w-8 text-blue-500 rotate-45" />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">🔒 身分驗證</h2>
                            <p className="text-slate-500 text-xs font-black uppercase tracking-[3px]">存取受限：需要安全權限密碼</p>
                        </div>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} placeholder="••••••••" autoFocus className="w-full bg-black/40 border-2 border-white/10 rounded-3xl px-6 py-6 text-white text-center text-3xl font-mono tracking-[10px] focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                        <div className="flex gap-4">
                            <button onClick={() => setShowAuthModal(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">取消</button>
                            <button onClick={handleLogin} className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">驗證密碼</button>
                        </div>
                    </div>
                </div>
            )}

            {isAddUnitModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-white uppercase italic">管理 <span className="text-blue-500">報帳單位</span></h2>
                            <button onClick={() => { setIsAddUnitModalOpen(false); setEditingUnit(null); setNewUnitName(""); setNewUnitLimit(""); }} className="h-8 w-8 flex items-center justify-center bg-white/5 rounded-full text-slate-500 hover:text-white">✕</button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">單位名稱 Unit Name</label>
                                <input type="text" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} placeholder="如：創創工坊、學聯會..." className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500/50 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">報帳上限金額 (Quota Limit)</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <input type="number" value={newUnitLimit} onChange={(e) => setNewUnitLimit(e.target.value)} placeholder="100000" className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500/50 outline-none" />
                                    </div>
                                    <button onClick={() => editingUnit ? handleUpdateUnit(editingUnit) : handleAddUnit()} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all">
                                        {editingUnit ? '儲存' : '新增'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pt-2 border-t border-white/5">
                            <div className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">現有單位與額度</div>
                            {data?.reimbursementUnits?.map(u => (
                                <div key={u.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                                    <div>
                                        <div className="text-sm font-bold text-white">{u.name}</div>
                                        <div className="text-[10px] font-mono text-slate-500">限額: ${u.limit?.toLocaleString() || 0}</div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => { setEditingUnit(u.name); setNewUnitName(u.name); setNewUnitLimit(u.limit?.toString() || ""); }} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-xl" title="編輯">
                                            <FileText className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDeleteUnit(u.name)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl" title="刪除">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!data?.reimbursementUnits || data.reimbursementUnits.length === 0) && (
                                <div className="text-center py-8 text-slate-600 text-xs font-black uppercase italic">尚無單位資料</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isAddSourceModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-white uppercase italic">管理 <span className="text-green-500">收入來源</span></h2>
                            <button onClick={() => { setIsAddSourceModalOpen(false); setNewSourceName(""); }} className="h-8 w-8 flex items-center justify-center bg-white/5 rounded-full text-slate-500 hover:text-white">✕</button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">新來源名稱 Source Name</label>
                            <div className="flex gap-2">
                                <input type="text" value={newSourceName} onChange={(e) => setNewSourceName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSource()} placeholder="例如：比賽獎金、社員繳費..." className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm font-bold focus:ring-2 focus:ring-green-500/50 outline-none" />
                                <button onClick={handleAddSource} className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-500/20 transition-all">新增</button>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pt-2 border-t border-white/5">
                            <div className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">現有收入來源</div>
                            {data?.incomeSources?.map(s => (
                                <div key={s} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                                    <span className="text-sm font-bold text-white">{s}</span>
                                    <button onClick={() => handleDeleteSource(s)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all" title="刪除">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {(!data?.incomeSources || data.incomeSources.length === 0) && (
                                <div className="text-center py-8 text-slate-600 text-xs font-black uppercase italic">尚無來源資料</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Log Modal */}
            {showAuditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">系統異動紀錄 <span className="text-purple-500">Audit Log</span></h2>
                                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">追蹤所有新增、修改與刪除操作</p>
                            </div>
                            <button onClick={() => setShowAuditModal(false)} className="h-10 w-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 rounded-full transition-all ring-1 ring-white/10 font-bold">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            {data?.auditLog && data.auditLog.length > 0 ? (
                                data.auditLog.map((log: any) => (
                                    <div key={log.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all flex items-start gap-4">
                                        <div className={cn(
                                            "mt-1 rotate-45 h-2 w-2 rounded-full",
                                            log.action === 'create' ? "bg-green-500" :
                                                log.action === 'update' ? "bg-blue-500" :
                                                    log.action === 'delete' ? "bg-red-500" : "bg-purple-500"
                                        )} />
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{log.timestamp}</span>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-xs font-black uppercase",
                                                    log.action === 'create' ? "bg-green-500/10 text-green-400" :
                                                        log.action === 'update' ? "bg-blue-500/10 text-blue-400" :
                                                            log.action === 'delete' ? "bg-red-500/10 text-red-400" : "bg-purple-500/10 text-purple-400"
                                                )}>
                                                    {log.action}
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold text-white">{log.targetName}</div>
                                            <div className="text-xs text-slate-400 leading-relaxed font-medium">{log.details}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20">
                                    <div className="text-slate-600 font-black uppercase tracking-widest text-sm">尚無相關紀錄</div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-white/5 border-t border-white/5 bg-slate-900">
                            <button onClick={() => setShowAuditModal(false)} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                                關閉紀錄視窗
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear Data Modal */}
            {showClearDataModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={() => setShowClearDataModal(false)} />
                    <div className="relative bg-slate-900 border-4 border-red-500/20 rounded-[40px] p-10 max-w-lg w-full shadow-[0_0_100px_rgba(239,68,68,0.2)] animate-in zoom-in-95 duration-200">
                        <div className="text-center space-y-6 mb-10">
                            <div className="h-24 w-24 bg-red-500/20 rounded-[35px] flex items-center justify-center mx-auto mb-6 border-b-4 border-red-500/30">
                                <Trash2 className="h-10 w-10 text-red-500" />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">🚨 資料清空作業</h2>
                            <div className="space-y-2">
                                <p className="text-red-400 text-sm font-black uppercase tracking-widest">此操作將永久移除所有年度帳目</p>
                                <p className="text-slate-500 text-xs font-bold leading-relaxed">請輸入管理員密碼以確認您的身分。</p>
                            </div>
                        </div>

                        <input
                            type="password"
                            value={clearPassword}
                            onChange={(e) => setClearPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleClearData()}
                            placeholder="請在此輸入管理員密碼"
                            autoFocus
                            className="w-full bg-black/40 border-2 border-red-500/10 rounded-3xl px-6 py-6 text-white text-center text-2xl font-mono tracking-[10px] focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 outline-none transition-all placeholder:text-[10px] placeholder:tracking-normal placeholder:font-black placeholder:uppercase placeholder:text-slate-700"
                        />

                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setShowClearDataModal(false)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-[25px] font-black text-xs uppercase tracking-widest transition-all">取消</button>
                            <button onClick={handleClearData} className="flex-1 py-5 bg-red-600 hover:bg-red-500 text-white rounded-[25px] font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(220,38,38,0.3)] transition-all">確認清除</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
