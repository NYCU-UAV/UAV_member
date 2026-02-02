"use client";

import FinanceTable from "@/components/FinanceTable";
import { Smartphone } from "lucide-react";

export default function FinancePage() {
    return (
        <main className="min-h-screen bg-[#0f1115] text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header is inside FinanceTable mostly, but we can put the mobile warning here */}

                <div className="md:hidden flex items-center justify-center gap-2 p-4 bg-yellow-500/10 text-yellow-500 rounded-lg mb-4 border border-yellow-500/20">
                    <Smartphone className="h-5 w-5 rotate-90 animate-pulse" />
                    <span className="font-bold">建議使用橫屏瀏覽</span>
                </div>

                <FinanceTable />
            </div>
        </main>
    );
}
