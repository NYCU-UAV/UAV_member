
import InventoryDashboard from "@/components/Inventory/InventoryDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "財產清冊 | UAV Club",
    description: "Manage club property inventory",
};

export default function InventoryPage() {
    return <InventoryDashboard />;
}
