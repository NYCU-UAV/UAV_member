"use client";

import MemberInfoTable from "@/components/MemberInfoTable";
import Link from "next/link";
import { ArrowLeft, Smartphone } from "lucide-react";

export default function MemberInfoPage() {
    return (
        <main className="min-h-screen bg-[#0f1115] text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-4 mb-2">
                            <Link
                                href="/"
                                className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Link>
                            <h1 className="text-3xl font-bold tracking-tight text-white glow-text">
                                成員資訊積分表
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 ml-14">
                            <p className="text-muted-foreground">管理成員資訊與積分紀錄 (由高到低排名)</p>
                            <div className="flex items-center gap-1 text-red-500 font-bold" title="請橫屏使用">
                                <Smartphone className="h-5 w-5 rotate-90 animate-pulse" />
                                <span>手機版請橫屏使用</span>
                            </div>
                        </div>
                    </div>
                </header>

                <MemberInfoTable />
            </div>
        </main>
    );
}
