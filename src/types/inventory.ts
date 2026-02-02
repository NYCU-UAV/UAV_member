export interface StorageLocation {
    id: string;
    name: string; // e.g. "A箱", "2桌"
    parentId?: string; // If null/undefined, it's a top-level location (on the map)
    imageUrl?: string; // Optional image for this specific location (e.g. view of the shelf)

    // Coordinates are only relevant if the parent is the Map (i.e. parentId is undefined)
    // OR if we want to place it on the parent location's image later. 
    // For now, let's keep x,y for top-level map placement.
    x?: number;
    y?: number;
}

export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    tags: string[];
    imageUrl?: string;

    quantity: number;
    status: 'available' | 'borrowed';
    borrower?: string;
    location?: string; // Current location ID
    originalLocation?: string; // Location ID to return to
    borrowedFrom?: string; // ID of the original item if this is a split
    lastUpdated: string;
}
