"use client";

import { useState } from "react";
import { StorageLocation } from "@/types/inventory";
import { ArrowLeft, Folder, Map as MapIcon, ChevronRight, Box } from "lucide-react";

interface LocationSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (locationId: string, locationName: string) => void;
    locations: StorageLocation[];
    mapImage?: string;
}

export default function LocationSelector({ isOpen, onClose, onSelect, locations, mapImage }: LocationSelectorProps) {
    const [currentParentId, setCurrentParentId] = useState<string | undefined>(undefined);

    if (!isOpen) return null;

    // Filter locations for current level
    const currentLocations = locations.filter(l => l.parentId === currentParentId);

    const handleBack = () => {
        if (!currentParentId) return; // At root
        const currentLoc = locations.find(l => l.id === currentParentId);
        setCurrentParentId(currentLoc?.parentId);
    };

    const breadcrumb = [];
    let tempId = currentParentId;
    while (tempId) {
        const loc = locations.find(l => l.id === tempId);
        if (loc) {
            breadcrumb.unshift(loc);
            tempId = loc.parentId;
        } else {
            break;
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl animate-fade-in text-gray-900 overflow-hidden">
                {/* Header with Breadcrumb */}
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setCurrentParentId(undefined)}
                            className={`flex items-center gap-1 text-sm font-medium whitespace-nowrap px-2 py-1 rounded hover:bg-gray-200 transition-colors ${!currentParentId ? 'text-gray-900 bg-white shadow-sm' : 'text-gray-500'}`}
                        >
                            <MapIcon className="w-4 h-4" /> 總覽
                        </button>
                        {breadcrumb.map((loc, idx) => (
                            <div key={loc.id} className="flex items-center gap-1 shrink-0">
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                <button
                                    onClick={() => setCurrentParentId(loc.id)}
                                    className={`text-sm font-medium whitespace-nowrap px-2 py-1 rounded hover:bg-gray-200 transition-colors ${idx === breadcrumb.length - 1 ? 'text-gray-900 bg-white shadow-sm' : 'text-gray-500'}`}
                                >
                                    {loc.name}
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                        <span className="sr-only">Close</span>
                        <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {currentLocations.map(loc => (
                            <div
                                key={loc.id}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col"
                            >
                                {/* Image Area */}
                                <div
                                    className="h-32 bg-gray-100 flex items-center justify-center relative overflow-hidden"
                                    onClick={() => setCurrentParentId(loc.id)} // Drill down on image click
                                >
                                    {loc.imageUrl ? (
                                        <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    ) : (
                                        <Folder className="w-12 h-12 text-blue-200" />
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full text-xs backdrop-blur-sm">
                                            進入下一層
                                        </span>
                                    </div>
                                </div>

                                {/* Info / Select Area */}
                                <div className="p-3 bg-white flex flex-col gap-2 flex-1">
                                    <div className="font-bold text-gray-800 text-center">{loc.name}</div>
                                    <button
                                        onClick={() => onSelect(loc.id, loc.name)}
                                        className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-600 hover:text-white transition-colors"
                                    >
                                        選擇此位置
                                    </button>
                                </div>
                            </div>
                        ))}

                        {currentLocations.length === 0 && (
                            <div className="col-span-full py-20 text-center text-gray-400 flex flex-col items-center">
                                <Box className="w-12 h-12 mb-3 opacity-30" />
                                <p>此處沒有子位置</p>
                                {currentParentId && (
                                    <button
                                        onClick={() => {
                                            const loc = locations.find(l => l.id === currentParentId);
                                            if (loc) onSelect(loc.id, loc.name);
                                        }}
                                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                    >
                                        選擇當前位置 ({locations.find(l => l.id === currentParentId)?.name})
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
