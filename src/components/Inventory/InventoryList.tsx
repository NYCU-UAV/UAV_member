"use client";

import { InventoryItem, StorageLocation } from "@/types/inventory";
import { Search, Tag, MapPin, Box, AlertCircle, User, History as HistoryIcon } from "lucide-react";

interface InventoryListProps {
    items: InventoryItem[];
    // We can pass locations map or just let parent pass enriched items, but passing locations is easier
    // Actually, to avoid breaking changes, let's keep it simple. 
    // Wait, the parent `InventoryDashboard` already filtered items. 
    // But for DISPLAY, we need to show the Name.
    // Let's assume the items passed here might have ID in `location`, we need to resolve it?
    // Or we can update the props to accept locations as well.
    locations?: StorageLocation[];
    onEdit: (item: InventoryItem) => void;
    onDelete: (id: string) => void;
}

export default function InventoryList({ items, locations = [], onEdit, onDelete }: InventoryListProps) {

    const getLocationPath = (idOrName?: string) => {
        if (!idOrName) return null;

        let currentLoc = locations.find(l => l.id === idOrName);
        if (!currentLoc) return idOrName; // Fallback if it's just a raw string name

        const path = [currentLoc.name];
        let parentId = currentLoc.parentId;

        // Traverse up up to 5 levels to avoid infinite loops
        let depth = 0;
        while (parentId && depth < 5) {
            const parent = locations.find(l => l.id === parentId);
            if (parent) {
                path.unshift(parent.name);
                parentId = parent.parentId;
            } else {
                break;
            }
            depth++;
        }

        return path.join(" > ");
    };

    // --- Consolidation Logic ---
    // 1. Identify items that are "splits" (borrowed from someone else)
    const childrenMap = items.reduce((acc, item) => {
        if (item.borrowedFrom) {
            if (!acc[item.borrowedFrom]) acc[item.borrowedFrom] = [];
            acc[item.borrowedFrom].push(item);
        }
        return acc;
    }, {} as Record<string, InventoryItem[]>);

    // 2. Filter out split items from the main display
    const topLevelItems = items.filter(item => !item.borrowedFrom);

    if (topLevelItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Box className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">目前沒有符合的物品</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-1">
            {topLevelItems.map(item => {
                const subLoans = childrenMap[item.id] || [];
                const borrowedQty = item.status === 'borrowed'
                    ? item.quantity
                    : subLoans.reduce((sum, l) => sum + l.quantity, 0);

                const inStockQty = item.status === 'available' ? item.quantity : 0;
                const totalQty = inStockQty + borrowedQty;

                return (
                    <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col"
                    >
                        {/* Image Area */}
                        <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <Box className="w-12 h-12 text-gray-300" />
                            )}

                            <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                                <span className={`
                                    px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm
                                    ${inStockQty > 0
                                        ? 'bg-green-100 text-green-700 border-green-200'
                                        : 'bg-red-100 text-red-700 border-red-200'}
                                `}>
                                    {inStockQty > 0 ? '在庫' : '缺貨'}
                                </span>
                                {borrowedQty > 0 && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm bg-blue-600 text-white border-blue-700">
                                        借用: {borrowedQty}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{item.name}</h3>

                            {/* Status Details */}
                            <div className="space-y-1 mb-3 text-sm">
                                {item.location && (
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{getLocationPath(item.location)}</span>
                                    </div>
                                )}
                                {item.status === 'borrowed' && item.borrower && (
                                    <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                                        <User className="w-3.5 h-3.5" />
                                        <span>借: {item.borrower}</span>
                                    </div>
                                )}
                                {subLoans.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-blue-500 text-xs mt-1">
                                        <HistoryIcon className="w-3 h-3" />
                                        <span>共 {subLoans.length} 人借用中</span>
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px] whitespace-pre-wrap">{item.description || "無詳細描述"}</p>

                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {item.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                                        #{tag}
                                    </span>
                                ))}
                                {item.tags.length > 3 && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-400 rounded-md">
                                        +{item.tags.length - 3}
                                    </span>
                                )}
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                                        總量: {totalQty}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        在庫: {inStockQty}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onEdit(item)}
                                        className="text-sm px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors font-medium"
                                    >
                                        編輯
                                    </button>
                                    <button
                                        onClick={() => onDelete(item.id)}
                                        className="text-sm px-3 py-1.5 hover:bg-red-50 text-red-400 hover:text-red-500 rounded-lg transition-colors"
                                    >
                                        刪除
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
