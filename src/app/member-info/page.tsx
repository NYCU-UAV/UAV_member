"use client";

import MemberInfoTable from "@/components/MemberInfoTable";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
                        <p className="text-muted-foreground ml-14">
                            管理成員資訊與積分紀錄 (由高到低排名)
                        </p>
                    </div>
                </header>

                <MemberInfoTable />
            </div>
        </main>
    );
}
