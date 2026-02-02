"use client";

import { useState, useEffect } from "react";
import InventoryList from "./InventoryList";
import InventoryMap from "./InventoryMap";
import AddPropertyModal from "./AddPropertyModal";
import BorrowItemModal from "./BorrowItemModal";
import { InventoryItem, StorageLocation } from "@/types/inventory";
import { Search, Plus, List, Map as MapIcon, Filter, Layers, History, ArrowLeft } from "lucide-react";
import Link from "next/link";
import data from "@/../data.json";
// Migration helper (still need idb-keyval for migration)
import { get, del } from 'idb-keyval';

export default function InventoryDashboard() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [locations, setLocations] = useState<StorageLocation[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

    // Map persistence
    const [mapImage, setMapImage] = useState<string>("");
    const [initialLocationId, setInitialLocationId] = useState("");

    const handleOpenAddModalWithLocation = (locId?: string) => {
        setEditingItem(null);
        setInitialLocationId(locId || "");
        setIsModalOpen(true);
    };

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Fetch from Server
                const res = await fetch('/api/data');
                const serverData = await res.json();

                // 2. Check for Local Data (Migration)
                const localInv = await get('uav-inventory');
                const localLocs = await get('uav-inventory-locations');
                const localMap = await get('uav-inventory-map');

                // If server is "empty" (for inventory) and local has data, migrate it!
                if ((!serverData.inventory || serverData.inventory.length === 0) && (localInv && localInv.length > 0)) {
                    console.log("Migrating local browser data to server...");
                    const mergedData = {
                        ...serverData,
                        inventory: localInv,
                        locations: localLocs || serverData.locations || [],
                        mapImage: localMap || serverData.mapImage || ""
                    };

                    await fetch('/api/data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(mergedData)
                    });

                    setItems(localInv);
                    setLocations(localLocs || []);
                    setMapImage(localMap || "");

                    // Optional: Clean up local storage after migration
                    // await del('uav-inventory');
                    // await del('uav-inventory-locations');
                    // await del('uav-inventory-map');
                } else {
                    // Normal server-first load
                    setItems(serverData.inventory || []);
                    setLocations(serverData.locations || []);
                    setMapImage(serverData.mapImage || "");
                }
            } catch (error) {
                console.error("Failed to load server data", error);
            } finally {
                setIsDataLoaded(true);
            }
        };

        loadData();
    }, []);

    // Helper for saving all data to server
    const persistToServer = async (newItems: InventoryItem[], newLocs: StorageLocation[], newMap: string) => {
        try {
            // First get the current state of other keys (members, finance)
            const res = await fetch('/api/data');
            const currentData = await res.json();

            const mergedData = {
                ...currentData,
                inventory: newItems,
                locations: newLocs,
                mapImage: newMap
            };

            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mergedData)
            });
        } catch (error) {
            console.error("Failed to save to server", error);
        }
    };

    const filteredItems = items.filter(item => {
        // Resolve FULL location path for search (so searching "Box A" finds items in "Box A > Sub B")
        let fullLocPath = "";
        const startLoc = locations.find(l => l.id === item.location);

        if (startLoc) {
            const parts = [startLoc.name];
            let parentId = startLoc.parentId;
            let depth = 0;
            while (parentId && depth < 5) {
                const parent = locations.find(l => l.id === parentId);
                if (parent) {
                    parts.unshift(parent.name);
                    parentId = parent.parentId;
                } else {
                    break;
                }
                depth++;
            }
            fullLocPath = parts.join(" ");
        } else {
            fullLocPath = item.location || "";
        }

        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.includes(searchTerm) ||
            item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (fullLocPath && fullLocPath.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesTags = selectedTags.length === 0 ||
            selectedTags.every(tag => item.tags.includes(tag));

        return matchesSearch && matchesTags;
    });

    const allTags = Array.from(new Set(items.flatMap(i => i.tags)));

    const handleSaveItem = (newItem: InventoryItem) => {
        const updatedItems = editingItem
            ? items.map(i => i.id === newItem.id ? newItem : i)
            : [...items, newItem];

        setItems(updatedItems);
        persistToServer(updatedItems, locations, mapImage);
        setEditingItem(null);
    };

    const handleDelete = (id: string) => {
        if (confirm("確定要刪除此物品嗎?")) {
            const updatedItems = items.filter(i => i.id !== id);
            setItems(updatedItems);
            persistToServer(updatedItems, locations, mapImage);
        }
    };

    // Borrowing Logic
    const handleConfirmBorrow = (borrowData: { items: { itemId: string, quantity: number }[], borrower: string }) => {
        let updatedItems = [...items];

        borrowData.items.forEach(selection => {
            const originalIndex = updatedItems.findIndex(i => i.id === selection.itemId);
            if (originalIndex === -1) return;

            const original = updatedItems[originalIndex];

            if (selection.quantity < original.quantity) {
                // Split: Reduce original and create new borrowed entry
                const remainingQty = original.quantity - selection.quantity;
                updatedItems[originalIndex] = { ...original, quantity: remainingQty, lastUpdated: new Date().toISOString() };

                const borrowedEntry: InventoryItem = {
                    ...original,
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    quantity: selection.quantity,
                    status: 'borrowed',
                    borrower: borrowData.borrower,
                    borrowedFrom: original.id,
                    originalLocation: original.location,
                    lastUpdated: new Date().toISOString()
                };
                updatedItems.push(borrowedEntry);
            } else {
                // Full Borrow: Just update status and borrower
                updatedItems[originalIndex] = {
                    ...original,
                    status: 'borrowed',
                    borrower: borrowData.borrower,
                    originalLocation: original.location,
                    lastUpdated: new Date().toISOString()
                };
            }
        });

        setItems(updatedItems);
        persistToServer(updatedItems, locations, mapImage);
    };

    const handleConfirmReturn = (itemId: string) => {
        const borrowedItem = items.find(i => i.id === itemId);
        if (!borrowedItem || borrowedItem.status !== 'borrowed') return;

        let updatedItems = items.filter(i => i.id !== itemId);

        if (borrowedItem.borrowedFrom) {
            // Find parent to merge back
            const parentIndex = updatedItems.findIndex(i => i.id === borrowedItem.borrowedFrom);
            if (parentIndex !== -1) {
                updatedItems[parentIndex] = {
                    ...updatedItems[parentIndex],
                    quantity: updatedItems[parentIndex].quantity + borrowedItem.quantity,
                    lastUpdated: new Date().toISOString()
                };
            } else {
                // Parent gone? Revert this item to available
                const reverted = { ...borrowedItem, status: 'available' as const, borrower: undefined, borrowedFrom: undefined, lastUpdated: new Date().toISOString() };
                updatedItems.push(reverted);
            }
        } else {
            // No parent, just revert
            const reverted = { ...borrowedItem, status: 'available' as const, borrower: undefined, lastUpdated: new Date().toISOString() };
            updatedItems.push(reverted);
        }

        setItems(updatedItems);
        persistToServer(updatedItems, locations, mapImage);
    };

    // Location Management
    const handleUpdateLocationPos = (id: string, x?: number, y?: number, parentId?: string) => {
        const newLocs = locations.map(l => l.id === id ? { ...l, x, y, parentId: parentId !== undefined ? parentId : l.parentId } : l);
        setLocations(newLocs);
        persistToServer(items, newLocs, mapImage);
    };

    const handleAddLocation = (name: string, parentId?: string, imageUrl?: string) => {
        if (locations.some(l => l.name === name && l.parentId === parentId)) {
            alert("此區域已存在相同名稱的位置");
            return;
        }
        const newLoc: StorageLocation = {
            id: Date.now().toString(),
            name,
            x: 50,
            y: 50,
            parentId,
            imageUrl
        };
        const newLocs = [...locations, newLoc];
        setLocations(newLocs);
        persistToServer(items, newLocs, mapImage);
    };

    const handleDeleteLocation = (id: string) => {
        if (confirm("確定要刪除此位置嗎? 及其所有子位置?")) {
            const hasChildren = locations.some(l => l.parentId === id);
            if (hasChildren) {
                if (!confirm("此位置包含子區域，確定要全部刪除?")) return;
            }
            const newLocs = locations.filter(l => l.id !== id && l.parentId !== id);
            setLocations(newLocs);
            persistToServer(items, newLocs, mapImage);
        }
    };

    const handleRenameLocation = (id: string, newName: string) => {
        const newLocs = locations.map(l => l.id === id ? { ...l, name: newName } : l);
        setLocations(newLocs);
        persistToServer(items, newLocs, mapImage);
    };

    const handleUpdateLocationImage = (id: string, imageUrl: string) => {
        const newLocs = locations.map(l => l.id === id ? { ...l, imageUrl } : l);
        setLocations(newLocs);
        persistToServer(items, newLocs, mapImage);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Link>
                            <Layers className="w-8 h-8 text-blue-600" />
                            <h1 className="text-2xl font-bold text-gray-900">財產清冊系統</h1>
                        </div>

                        <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-xl w-fit">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <List className="w-4 h-4" /> 清單模式
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <MapIcon className="w-4 h-4" /> 地圖模式
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsBorrowModalOpen(true)}
                                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-medium shadow-sm flex items-center gap-2 transition-all active:scale-95"
                            >
                                <History className="w-5 h-5 text-blue-500" /> 借用物品
                            </button>
                            <button
                                onClick={() => { setEditingItem(null); setInitialLocationId(""); setIsModalOpen(true); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-200 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                            >
                                <Plus className="w-5 h-5" /> 新增物品
                            </button>
                        </div>
                    </div>

                    {/* Filters Toolbar */}
                    {viewMode === 'list' && (
                        <div className="mt-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <div className="relative flex-1 w-full md:min-w-[300px] md:max-w-lg">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="搜尋物品名稱、描述或標籤..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                                />
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full no-scrollbar">
                                <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            selectedTags.includes(tag)
                                                ? setSelectedTags(selectedTags.filter(t => t !== tag))
                                                : setSelectedTags([...selectedTags, tag]);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${selectedTags.includes(tag)
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {viewMode === 'list' ? (
                    <InventoryList
                        items={filteredItems}
                        locations={locations}
                        onEdit={(item) => { setEditingItem(item); setInitialLocationId(""); setIsModalOpen(true); }}
                        onDelete={handleDelete}
                    />
                ) : (
                    <InventoryMap
                        items={items}
                        locations={locations}
                        onUpdateLocation={handleUpdateLocationPos}
                        onAddLocation={handleAddLocation}
                        onDeleteLocation={handleDeleteLocation}
                        onRenameLocation={handleRenameLocation}
                        onUpdateLocationImage={handleUpdateLocationImage}
                        mapImage={mapImage}
                        onUploadMap={setMapImage}
                        onAddItem={handleOpenAddModalWithLocation}
                        onEditItem={(item) => { setEditingItem(item); setInitialLocationId(""); setIsModalOpen(true); }}
                        onDeleteItem={handleDelete}
                    />
                )}
            </main>

            <AddPropertyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveItem}
                editingItem={editingItem}
                existingTags={allTags}
                existingLocations={locations}
                mapImage={mapImage}
                initialLocationId={initialLocationId}
            />

            <BorrowItemModal
                isOpen={isBorrowModalOpen}
                onClose={() => setIsBorrowModalOpen(false)}
                items={items}
                locations={locations}
                onConfirmBorrow={handleConfirmBorrow}
                onConfirmReturn={handleConfirmReturn}
            />
        </div>
    );
}
