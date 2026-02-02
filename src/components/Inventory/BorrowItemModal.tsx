"use client";

import { useState, useMemo } from "react";
import { X, Search, Plus, Trash2, ArrowRight, User, Package, History, CheckCircle, RotateCcw } from "lucide-react";
import { InventoryItem, StorageLocation } from "@/types/inventory";

interface BorrowItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: InventoryItem[];
    locations: StorageLocation[];
    onConfirmBorrow: (borrowData: { items: { itemId: string, quantity: number }[], borrower: string }) => void;
    onConfirmReturn: (itemId: string) => void;
}

export default function BorrowItemModal({ isOpen, onClose, items, locations, onConfirmBorrow, onConfirmReturn }: BorrowItemModalProps) {
    const [view, setView] = useState<'manage' | 'new'>('manage');
    const [searchTerm, setSearchTerm] = useState("");
    const [borrowerName, setBorrowerName] = useState("");
    const [selectedItems, setSelectedItems] = useState<{ [itemId: string]: number }>({});

    // Filtering available items for new borrow
    const availableItems = useMemo(() => {
        return items.filter(item => {
            if (item.status !== 'available' || item.quantity <= 0) return false;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesSearch;
        });
    }, [items, searchTerm]);

    // Filtering currently borrowed items
    const borrowedItems = useMemo(() => {
        return items.filter(item => item.status === 'borrowed');
    }, [items]);

    const handleToggleSelect = (item: InventoryItem) => {
        setSelectedItems(prev => {
            const newSelect = { ...prev };
            if (newSelect[item.id]) {
                delete newSelect[item.id];
            } else {
                newSelect[item.id] = 1;
            }
            return newSelect;
        });
    };

    const handleUpdateQuantity = (itemId: string, delta: number, max: number) => {
        setSelectedItems(prev => {
            const current = prev[itemId] || 1;
            const next = Math.max(1, Math.min(max, current + delta));
            return { ...prev, [itemId]: next };
        });
    };

    const handleBorrowSubmit = () => {
        if (!borrowerName.trim()) {
            alert("請輸入借用人姓名");
            return;
        }
        const selections = Object.entries(selectedItems).map(([itemId, quantity]) => ({ itemId, quantity }));
        if (selections.length === 0) {
            alert("請選擇至少一項物品");
            return;
        }
        onConfirmBorrow({ items: selections, borrower: borrowerName });
        // Reset and close
        setBorrowerName("");
        setSelectedItems({});
        setView('manage');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 rounded-2xl">
                            <History className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">借用管理系統</h2>
                            <p className="text-sm text-gray-500">追蹤與更新物品外借狀態</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="px-6 pt-2 pb-0 flex gap-4 border-b border-gray-100">
                    <button
                        onClick={() => setView('manage')}
                        className={`pb-3 text-sm font-semibold transition-all border-b-2 ${view === 'manage' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent'}`}
                    >
                        目前借出 ({borrowedItems.length})
                    </button>
                    <button
                        onClick={() => setView('new')}
                        className={`pb-3 text-sm font-semibold transition-all border-b-2 ${view === 'new' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent'}`}
                    >
                        辦理借用
                    </button>
                </div>

                {/* Content View */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    {view === 'manage' ? (
                        <div className="space-y-4">
                            {borrowedItems.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                                    <Package className="w-16 h-16 mb-4 opacity-20" />
                                    <p>目前沒有任何外借物品</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {borrowedItems.map(item => (
                                        <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
                                            <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-full h-full p-4 text-gray-300" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <User className="w-3 h-3 text-blue-500" />
                                                    <span className="text-sm font-medium text-blue-600">借用人: {item.borrower}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">數量: {item.quantity} / 更新於: {new Date(item.lastUpdated).toLocaleDateString()}</p>
                                            </div>
                                            <button
                                                onClick={() => onConfirmReturn(item.id)}
                                                className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                                                title="歸還物品"
                                            >
                                                <RotateCcw className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Search & Borrower Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="搜尋欲借用物品..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-gray-900 placeholder:text-gray-400"
                                    />
                                </div>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="請輸入借用人姓名..."
                                        value={borrowerName}
                                        onChange={(e) => setBorrowerName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-gray-900 placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            {/* Multi-Selection List */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pl-1">可用物品清單</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {availableItems.map(item => {
                                        const isSelected = !!selectedItems[item.id];
                                        return (
                                            <div
                                                key={item.id}
                                                className={`p-3 rounded-2xl border transition-all flex items-center gap-4 ${isSelected ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-gray-100 hover:border-blue-200'}`}
                                            >
                                                <button
                                                    onClick={() => handleToggleSelect(item)}
                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-200'}`}
                                                >
                                                    {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                                </button>

                                                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-full h-full p-3 text-gray-300" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0" onClick={() => handleToggleSelect(item)}>
                                                    <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                                                    <p className="text-xs text-gray-400">目前庫存: {item.quantity}</p>
                                                </div>

                                                {isSelected && (
                                                    <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-blue-100 shadow-sm">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(item.id, -1, item.quantity); }}
                                                            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center font-bold text-gray-900"
                                                        >-</button>
                                                        <span className="text-sm font-black w-6 text-center text-gray-900">{selectedItems[item.id]}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(item.id, 1, item.quantity); }}
                                                            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center font-bold text-gray-900"
                                                        >+</button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {availableItems.length === 0 && (
                                        <div className="py-10 text-center text-gray-400 italic">找不到符合的物品</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0">
                    <div className="flex items-center justify-between gap-4">
                        <div className="text-sm text-gray-500">
                            {view === 'new' && (
                                <>已選擇 <span className="font-bold text-blue-600">{Object.keys(selectedItems).length}</span> 項物品</>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                                取消
                            </button>
                            {view === 'new' ? (
                                <button
                                    onClick={handleBorrowSubmit}
                                    disabled={Object.keys(selectedItems).length === 0 || !borrowerName.trim()}
                                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                                >
                                    確認借出 <ArrowRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setView('new')}
                                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
                                >
                                    辦理新借用 <Plus className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
