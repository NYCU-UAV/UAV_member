"use client";

import { InventoryItem, StorageLocation } from "@/types/inventory";
import { useState, useRef } from "react";
import { ZoomIn, MapPin, Trash2, Box, ChevronRight, Upload, Folder, Pencil, Layers, Plus } from "lucide-react";
import { DndContext, useDraggable, useDroppable, DragEndEvent, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';

interface InventoryMapProps {
    items: InventoryItem[];
    locations: StorageLocation[];
    onUpdateLocation: (id: string, x?: number, y?: number, parentId?: string) => void;
    onAddLocation: (name: string, parentId?: string, imageUrl?: string) => void;
    onDeleteLocation: (id: string) => void;
    onRenameLocation: (id: string, newName: string) => void;
    onUpdateLocationImage: (id: string, imageUrl: string) => void;
    mapImage?: string;
    onUploadMap: (url: string) => void;
    onAddItem: (locationId: string) => void;
    onEditItem: (item: InventoryItem) => void;
    onDeleteItem: (itemId: string) => void;
}
// Draggable Location Marker (Only for Map View)
function LocationMarker({ loc, isSelected, onClick, onDelete, onRename, scale = 1 }: {
    loc: StorageLocation;
    isSelected: boolean;
    onClick: () => void;
    onDelete: () => void;
    onRename: () => void;
    scale?: number;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: loc.id,
    });

    // Only use x/y if they exist (top level usually)
    const left = loc.x !== undefined ? `${loc.x}%` : '50%';
    const top = loc.y !== undefined ? `${loc.y}%` : '50%';

    // 置中位移要寫進 inline transform：inline style 會整個覆蓋 Tailwind 的 transform class，
    // 分開寫的話標記會以左上角對齊座標，且縮放越大偏移越多
    const style: React.CSSProperties = {
        position: 'absolute',
        left,
        top,
        transform: transform
            ? `translate(-50%, -50%) translate3d(${transform.x}px, ${transform.y}px, 0) scale(${scale})`
            : `translate(-50%, -50%) scale(${scale})`,
        zIndex: isDragging ? 100 : (isSelected ? 20 : 10),
        transformOrigin: 'center center'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="group cursor-grab active:cursor-grabbing flex flex-col items-center justify-center"
        >

            <div className={`
                flex items-center justify-center px-4 py-2 md:px-6 md:py-3 rounded-xl border-4 shadow-xl backdrop-blur-sm transition-all duration-200
                ${isSelected
                    ? 'bg-blue-600 border-white text-white scale-110 z-20 ring-4 ring-blue-300'
                    : 'bg-white/95 border-blue-600 text-blue-800 hover:scale-110 hover:bg-blue-50'}
            `}>
                <span className="font-bold whitespace-nowrap text-xl md:text-3xl shadow-sm">{loc.name}</span>
            </div>

            <div className={`w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] mt-[-1px]
                 ${isSelected ? 'border-t-blue-600' : 'border-t-blue-600'}`}>
            </div>

            {/* Hover Actions Menu */}
            <div className="absolute top-0 right-0 translate-x-full -translate-y-1/4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-3 pointer-events-none group-hover:pointer-events-auto">
                <button
                    onClick={(e) => { e.stopPropagation(); onRename(); }}
                    className="p-2.5 bg-white rounded-full shadow-lg text-gray-500 hover:text-blue-600 hover:scale-110 transition-all border border-gray-100"
                    title="重新命名"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <Pencil className="w-5 h-5" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-2.5 bg-white rounded-full shadow-lg text-gray-500 hover:text-red-600 hover:scale-110 transition-all border border-gray-100"
                    title="刪除"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

// Recursive Tree Item
function LocationTreeItem({ loc, allLocations, onNavigate, depth = 0 }: { loc: StorageLocation, allLocations: StorageLocation[], onNavigate: (id: string) => void, depth?: number }) {
    const children = allLocations.filter(l => l.parentId === loc.id);

    return (
        <div className="flex flex-col select-none">
            <div
                className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 hover:text-blue-600 cursor-pointer rounded text-sm text-gray-700 border-l-2 border-gray-200 ml-2 transition-colors"
                style={{ marginLeft: `${depth * 1.5}rem` }}
                onClick={(e) => { e.stopPropagation(); onNavigate(loc.id); }}
            >
                <Folder className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-medium">{loc.name}</span>
            </div>
            {children.map(child => (
                <LocationTreeItem key={child.id} loc={child} allLocations={allLocations} onNavigate={onNavigate} depth={depth + 1} />
            ))}
        </div>
    );
}

// Tree View Container
function LocationTreeView({ locations, onNavigate }: { locations: StorageLocation[], onNavigate: (id: string) => void }) {
    const roots = locations.filter(l => !l.parentId);

    if (locations.length === 0) return null;

    return (
        <div className="border-t-4 border-gray-200 bg-white p-6 max-h-[40vh] overflow-y-auto">
            <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-gray-500" />
                位置結構樹 (點擊可跳轉)
            </h3>
            <div className="pl-2 border-l border-gray-100 ml-1">
                {roots.map(root => (
                    <LocationTreeItem key={root.id} loc={root} allLocations={locations} onNavigate={onNavigate} />
                ))}
            </div>
        </div>
    );
}

// Helper to resize images before storing
const resizeImage = async (file: File, maxWidth: number = 1000): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // Fill white background for JPEGs (transparency becomes black otherwise)
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, width, height);

                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to JPEG 70%
                } else {
                    resolve(e.target?.result as string); // Fallback
                }
            };
            img.onerror = () => {
                console.error("Image load error");
                alert("圖片載入失敗！\n您的瀏覽器可能不支援此圖片格式 (" + file.type + ")。\n請嘗試將圖片轉檔為 JPG 後再上傳。");
                resolve("");
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};

export default function InventoryMap({ items, locations, onUpdateLocation, onAddLocation, onDeleteLocation, onRenameLocation, onUpdateLocationImage, mapImage, onUploadMap, onAddItem, onEditItem, onDeleteItem }: InventoryMapProps) {
    const [currentParentId, setCurrentParentId] = useState<string | undefined>(undefined);
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null); // For popup/sidebar
    const [newLocationName, setNewLocationName] = useState("");
    const [newLocationImage, setNewLocationImage] = useState<string>("");
    const [markerScale, setMarkerScale] = useState<number>(0.5); // Scale for markers

    const mapRef = useRef<HTMLDivElement>(null);

    // Sensors to detect drag vs click
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    // --- Data Derivation ---
    // Breadcrumb path（depth 上限防止資料異常成環時無限迴圈）
    const breadcrumb = [];
    let tempId = currentParentId;
    let breadcrumbDepth = 0;
    while (tempId && breadcrumbDepth < 10) {
        const loc = locations.find(l => l.id === tempId);
        if (loc) {
            breadcrumb.unshift(loc);
            tempId = loc.parentId;
        } else {
            break;
        }
        breadcrumbDepth++;
    }

    // Locations visible at current level
    const visibleLocations = locations.filter(l => l.parentId === currentParentId);

    // Items at current level (directly inside this location)
    // Note: Items store location ID (or Name - we try ID match first)
    // If currentParentId is undefined (Map), we show nothing? Or unassigned items?
    // "桌1" items should be inside "桌1".
    const currentLocObj = locations.find(l => l.id === currentParentId);
    const itemsHere = currentParentId
        ? items.filter(i => i.location === currentParentId || i.location === currentLocObj?.name)
        : [];

    // --- Handlers ---

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event;
        if (!mapRef.current) return;
        if (currentParentId) return; // No dragging in drill-down grid view (for now), only on Map

        const rect = mapRef.current.getBoundingClientRect();
        const loc = locations.find(l => l.id === active.id);
        if (!loc) return;

        const currentLeftPx = ((loc.x || 50) / 100) * rect.width;
        const currentTopPx = ((loc.y || 50) / 100) * rect.height;

        const newLeftPx = currentLeftPx + delta.x;
        const newTopPx = currentTopPx + delta.y;

        // Allow wider range for labels (-50% to 150%)
        const newX = Math.max(-50, Math.min(150, (newLeftPx / rect.width) * 100));
        const newY = Math.max(-50, Math.min(150, (newTopPx / rect.height) * 100));

        onUpdateLocation(active.id as string, newX, newY, undefined);
    };

    const handleMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const resizedBase64 = await resizeImage(file, 2000); // Maps can be larger
                if (!resizedBase64) return;
                const res = await fetch(resizedBase64);
                const blob = await res.blob();
                const uploadFile = new File([blob], file.name, { type: "image/jpeg" });

                const formData = new FormData();
                formData.append('file', uploadFile);

                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await uploadRes.json();
                if (data.url) onUploadMap(data.url);
            } catch (err) {
                console.error("Map upload failed", err);
            }
        }
    };

    const handleSubLocationImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const resizedBase64 = await resizeImage(file, 500);
                if (!resizedBase64) return;
                const res = await fetch(resizedBase64);
                const blob = await res.blob();
                const uploadFile = new File([blob], file.name, { type: "image/jpeg" });

                const formData = new FormData();
                formData.append('file', uploadFile);

                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await uploadRes.json();
                if (data.url) setNewLocationImage(data.url);
            } catch (err) {
                console.error("Sub-location image upload failed", err);
            }
        }
    };

    const handleEditLocationImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && currentParentId) {
            try {
                const resizedBase64 = await resizeImage(file, 1500);
                if (!resizedBase64) return;
                const res = await fetch(resizedBase64);
                const blob = await res.blob();
                const uploadFile = new File([blob], file.name, { type: "image/jpeg" });

                const formData = new FormData();
                formData.append('file', uploadFile);

                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await uploadRes.json();
                if (data.url) onUpdateLocationImage(currentParentId, data.url);
            } catch (err) {
                console.error("Location image edit failed", err);
            }
        }
    };

    const handleAddLocationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newLocationName.trim()) {
            onAddLocation(newLocationName.trim(), currentParentId, newLocationImage);
            setNewLocationName("");
            setNewLocationImage("");
        }
    };

    const handleRename = (id: string, currentName: string) => {
        const newName = window.prompt("請輸入新的名稱:", currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
            onRenameLocation(id, newName.trim());
        }
    };

    // If at root, dragging is possible on the map.
    // If deeper, we show a grid view.
    const isRoot = !currentParentId;

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm relative">
            {/* Toolbar / Breadcrumb */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-3">

                {/* Top Row: Navigation & Main Actions */}
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setCurrentParentId(undefined)}
                            className={`flex items-center gap-1 text-sm font-medium whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${isRoot ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            <MapPin className="w-4 h-4" /> 地圖總覽
                        </button>
                        {breadcrumb.map((loc, idx) => (
                            <div key={loc.id} className="flex items-center gap-1 shrink-0">
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                <button
                                    onClick={() => setCurrentParentId(loc.id)}
                                    className={`flex items-center gap-1 text-sm font-medium whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${idx === breadcrumb.length - 1 ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                                >
                                    {loc.name}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Scale Slider */}
                        {isRoot && (
                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                                <span className="text-xs font-medium text-gray-500">標籤大小</span>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="3"
                                    step="0.1"
                                    value={markerScale}
                                    onChange={(e) => setMarkerScale(parseFloat(e.target.value))}
                                    className="w-24 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                        )}

                        {isRoot && (
                            <label className="cursor-pointer text-sm bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-200 transition-colors">
                                {mapImage ? "更換地圖" : "上傳地圖"}
                                <input type="file" accept="image/*" className="hidden" onChange={handleMapUpload} />
                            </label>
                        )}
                    </div>
                </div>

                {/* Second Row: Add Sub-location Form */}
                <form onSubmit={handleAddLocationSubmit} className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 max-w-2xl">
                    <div className="relative flex-1">
                        <Box className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder={isRoot ? "在地圖上新增區域 (例: 桌1)" : `在 ${currentLocObj?.name} 內新增 (例: 抽屜A)`}
                            value={newLocationName}
                            onChange={(e) => setNewLocationName(e.target.value)}
                            className="pl-9 pr-4 py-1.5 w-full text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Image Upload for new location (Important for sub-levels) */}
                    <label className={`cursor-pointer p-1.5 rounded hover:bg-gray-100 ${newLocationImage ? 'text-blue-600' : 'text-gray-400'}`} title="上傳此位置的縮圖">
                        <Upload className="w-4 h-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleSubLocationImageUpload} />
                    </label>

                    <button
                        type="submit"
                        disabled={!newLocationName.trim()}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        新增
                    </button>
                </form>
            </div>

            {/* Main Content View */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* 
                    VIEW 1: MAP VIEW (Root Level) 
                    Only shows if we are at root.
                */}
                {isRoot && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {/* Map Scroll Area */}

                        <div className="flex-1 bg-gray-200 overflow-auto relative group flex items-center justify-center px-4 md:px-[15vw] py-8 text-center" onClick={() => setSelectedLocationId(null)}>
                            {mapImage ? (
                                <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
                                    <div ref={mapRef} className="relative inline-block overflow-visible border-4 border-white rounded-3xl shadow-2xl bg-white">
                                        <img
                                            src={mapImage}
                                            alt="Floor Plan"
                                            className="block w-auto h-auto max-w-[90vw] max-h-[70vh] pointer-events-none rounded-2xl"
                                        />

                                        {visibleLocations.map(loc => (
                                            <LocationMarker
                                                key={loc.id}
                                                loc={loc}
                                                isSelected={selectedLocationId === loc.id}
                                                onClick={() => setCurrentParentId(loc.id)} // Click drills down!
                                                onDelete={() => onDeleteLocation(loc.id)}
                                                onRename={() => handleRename(loc.id, loc.name)}
                                                scale={markerScale}
                                            />
                                        ))}

                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs pointer-events-none">
                                            長按拖曳可移動位置
                                        </div>
                                    </div>
                                </DndContext>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                    <ZoomIn className="w-16 h-16 mb-4 opacity-50" />
                                    <p>尚未上傳室內配置圖</p>
                                </div>
                            )}
                        </div>

                        {/* Tree View Footer */}
                        <LocationTreeView locations={locations} onNavigate={setCurrentParentId} />
                    </div>
                )}

                {/* 
                    VIEW 2: GRID VIEW (Drill-down Level)
                    Shows sub-locations as tiles and items below.
                */}
                {!isRoot && (
                    <div className="flex-1 bg-gray-50 overflow-y-auto p-6">
                        {/* Parent Location Image if available */}
                        {currentLocObj && (
                            <div className="w-full h-auto min-h-[200px] max-h-[600px] bg-gray-900 rounded-xl overflow-hidden mb-6 border border-gray-200 shadow-sm relative group flex items-center justify-center">
                                {currentLocObj.imageUrl ? (
                                    <>
                                        <img src={currentLocObj.imageUrl} className="max-w-full max-h-[600px] object-contain" />
                                        <label className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full cursor-pointer transition-colors backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100" title="更換照片">
                                            <Pencil className="w-5 h-5" />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleEditLocationImage} />
                                        </label>
                                    </>
                                ) : (
                                    <label className="flex flex-col items-center justify-center gap-3 cursor-pointer text-gray-400 hover:text-gray-200 transition-colors w-full h-[300px] hover:bg-gray-800">
                                        <Upload className="w-12 h-12" />
                                        <span className="text-lg font-medium">點擊上傳此區域的照片</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleEditLocationImage} />
                                    </label>
                                )}

                                {currentLocObj.imageUrl && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-none">
                                        <h2 className="text-3xl font-bold text-white shadow-sm">{currentLocObj.name}</h2>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Sub-Locations Grid */}
                        <div className="mb-8">
                            <h3 className="section-title mb-4 text-gray-700 font-bold flex items-center gap-2">
                                <Folder className="w-5 h-5 text-blue-500" />
                                子區域 ({visibleLocations.length})
                            </h3>
                            {visibleLocations.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {visibleLocations.map(loc => (
                                        <div
                                            key={loc.id}
                                            onClick={() => setCurrentParentId(loc.id)}
                                            className="bg-white rounded-xl border border-gray-200 p-2 cursor-pointer hover:shadow-lg transition-all group hover:-translate-y-1 relative"
                                        >
                                            <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden flex items-center justify-center text-gray-300">
                                                {loc.imageUrl ? (
                                                    <img src={loc.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                ) : (
                                                    <Folder className="w-12 h-12" />
                                                )}
                                            </div>
                                            <div className="font-bold text-gray-800 text-center truncate px-1">{loc.name}</div>

                                            {/* Delete button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteLocation(loc.id); }}
                                                className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-400 text-sm italic py-4">此處沒有子區域，請在上方新增</div>
                            )}
                        </div>

                        {/* Items Here */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="section-title text-gray-700 font-bold flex items-center gap-2">
                                    <Box className="w-5 h-5 text-blue-500" />
                                    存放物品 ({itemsHere.length})
                                </h3>
                                <button
                                    onClick={() => onAddItem(currentParentId!)}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />
                                    在此新增物品
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {itemsHere.map(item => (
                                    <div key={item.id} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                            {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <Box className="w-8 h-8 text-gray-300 m-auto mt-4" />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">{item.name}</h4>
                                            <div className="flex gap-2 mt-1">
                                                <span className={`text-xs px-2 py-0.5 rounded ${item.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {item.status === 'available' ? '在庫' : `借: ${item.borrower}`}
                                                </span>
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">Quantity: {item.quantity}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 ml-auto">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEditItem(item); }}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                title="編輯"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                title="刪除"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {itemsHere.length === 0 && (
                                    <div className="col-span-full text-gray-400 text-center py-8 bg-dashed border-2 border-gray-100 rounded-xl">
                                        尚無物品存放在此
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
