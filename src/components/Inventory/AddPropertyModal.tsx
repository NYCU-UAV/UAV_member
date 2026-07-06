"use client";

import { useState, useEffect } from "react";
import { X, Upload, Plus, MapPin } from "lucide-react";
import { InventoryItem, StorageLocation } from "@/types/inventory";
import LocationSelector from "./LocationSelector";

interface AddPropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: InventoryItem) => void;
    editingItem?: InventoryItem | null;
    existingTags: string[];
    existingLocations: StorageLocation[];
    initialLocationId?: string;
}

// Helper to resize images
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
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to JPEG 70%
                } else {
                    resolve(e.target?.result as string);
                }
            };
            img.onerror = () => resolve("");
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};

export default function AddPropertyModal({ isOpen, onClose, onSave, editingItem, existingTags, existingLocations, initialLocationId }: AddPropertyModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [status, setStatus] = useState<InventoryItem['status']>('available');
    const [borrower, setBorrower] = useState("");
    const [locationId, setLocationId] = useState("");
    const [locationName, setLocationName] = useState(""); // Display name
    const [imagePreview, setImagePreview] = useState<string>("");

    const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);

    // Reset or populate form when opening/changing editingItem
    useEffect(() => {
        if (isOpen) {
            if (editingItem) {
                setName(editingItem.name);
                setDescription(editingItem.description);
                setTags(editingItem.tags);
                setQuantity(editingItem.quantity);
                setStatus(editingItem.status);
                setBorrower(editingItem.borrower || "");
                setLocationId(editingItem.location || "");
                // Find name from ID, or fallback to the stored string if it was just a string
                const loc = existingLocations.find(l => l.id === editingItem.location);
                setLocationName(loc ? loc.name : (editingItem.location || ""));
                setImagePreview(editingItem.imageUrl || "");
            } else {
                // Default new item state
                setName("");
                setDescription("");
                setTags([]);
                setQuantity(1);
                setStatus('available');
                setBorrower("");

                // Use initialLocationId if provided
                if (initialLocationId) {
                    setLocationId(initialLocationId);
                    const loc = existingLocations.find(l => l.id === initialLocationId);
                    setLocationName(loc ? loc.name : "");
                } else {
                    setLocationId("");
                    setLocationName("");
                }

                setImagePreview("");
            }
        }
    }, [isOpen, editingItem, existingLocations, initialLocationId]);

    if (!isOpen) return null;

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // 1. Resize locally first to save bandwidth
                const resizedBase64 = await resizeImage(file, 800);
                if (!resizedBase64) return; // 圖片解析失敗（例如不支援的格式）

                // 2. Convert base64 back to Blob/File for upload
                const res = await fetch(resizedBase64);
                const blob = await res.blob();
                const uploadFile = new File([blob], file.name, { type: "image/jpeg" });

                // 3. Upload to Server
                const formData = new FormData();
                formData.append('file', uploadFile);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                const data = await uploadRes.json();
                if (data.url) {
                    setImagePreview(data.url); // Use the server URL!
                }
            } catch (err) {
                console.error("Error uploading image", err);
                alert("圖片上傳失敗");
            }
        }
    };

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent | string) => {
        const tagToAdd = typeof e === 'string' ? e : currentTag;

        if (tagToAdd.trim()) {
            if (!tags.includes(tagToAdd.trim())) {
                setTags([...tags, tagToAdd.trim()]);
            }
            setCurrentTag("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newItem: InventoryItem = {
            id: editingItem ? editingItem.id : Date.now().toString(),
            name,
            description,
            tags,
            quantity,
            status,
            borrower: status === 'borrowed' ? borrower : undefined,
            location: locationId || locationName, // Prefer ID, fallback to name string
            imageUrl: imagePreview,
            // 保留外借分割紀錄的關聯欄位，否則編輯後無法歸還合併回原物品
            borrowedFrom: editingItem?.borrowedFrom,
            originalLocation: editingItem?.originalLocation,
            lastUpdated: new Date().toISOString(),
        };

        onSave(newItem);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in text-gray-900">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {editingItem ? "編輯財產" : "新增財產"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Image Upload */}
                    <div className="flex justify-center">
                        <div className="relative group w-full max-w-md h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center overflow-hidden transition-colors hover:border-blue-500 hover:bg-blue-50/50">
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <p className="text-white font-medium">更換圖片</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500 font-medium">點擊上傳圖片</p>
                                    <p className="text-xs text-gray-400 mt-1">支援 PNG, JPG</p>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">名稱</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder="例如: DJI Mavic 3"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">數量</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">狀態</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as InventoryItem['status'])}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                    >
                                        <option value="available">在庫 (Available)</option>
                                        <option value="borrowed">外借 (Borrowed)</option>
                                    </select>
                                </div>
                            </div>

                            {status === 'borrowed' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-sm font-semibold text-blue-600 mb-1">借用對象</label>
                                    <input
                                        type="text"
                                        required
                                        value={borrower}
                                        onChange={e => setBorrower(e.target.value)}
                                        className="w-full px-4 py-2 border border-blue-200 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder:text-blue-300"
                                        placeholder="輸入借用人姓名或單位"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">存放位置</label>
                                <button
                                    type="button"
                                    onClick={() => setIsLocationSelectorOpen(true)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 text-left bg-gray-50 hover:bg-white transition-colors flex items-center justify-between"
                                >
                                    <span className={locationName ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                                        {locationName || "選擇位置..."}
                                    </span>
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">描述</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-[200px] resize-none text-gray-900 placeholder:text-gray-400"
                                    placeholder="詳細規格、配件說明..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tags Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">標籤 (Tags)</label>

                        {/* Existing Tags Cloud */}
                        {existingTags.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-xs text-gray-500 w-full mb-1">點擊新增常用標籤:</span>
                                {existingTags.filter(t => !tags.includes(t)).map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleAddTag(tag)}
                                        className="px-2 py-1 bg-white border border-gray-200 text-gray-600 text-xs rounded-md hover:border-blue-300 hover:text-blue-600 transition-colors"
                                    >
                                        + {tag}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map(tag => (
                                <span key={tag} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-800">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={currentTag}
                                onChange={e => setCurrentTag(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag(currentTag))}
                                placeholder="輸入標籤後按 Enter (例: A箱, 貴重品)"
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder:text-gray-400"
                            />
                            <button
                                type="button"
                                onClick={() => handleAddTag(currentTag)}
                                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:translate-y-[-1px]"
                        >
                            {editingItem ? "儲存變更" : "新增物品"}
                        </button>
                    </div>
                </form>

                <LocationSelector
                    isOpen={isLocationSelectorOpen}
                    onClose={() => setIsLocationSelectorOpen(false)}
                    onSelect={(id, name) => {
                        setLocationId(id);
                        setLocationName(name);
                        setIsLocationSelectorOpen(false);
                    }}
                    locations={existingLocations}
                />
            </div>
        </div>
    );
}
