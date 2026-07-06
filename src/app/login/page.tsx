"use client";

import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || loading) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const json = await res.json();
            if (json.ok) {
                // 登入成功，回到原本要去的頁面
                const from = new URLSearchParams(window.location.search).get("from");
                window.location.href = from && from.startsWith("/") ? from : "/";
            } else {
                setError("密碼錯誤");
                setPassword("");
            }
        } catch {
            setError("連線失敗，請再試一次");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-[#050b18] text-white p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl p-8 space-y-6">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                        <Lock className="h-7 w-7 text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">NYCU UAV 社團系統</h1>
                    <p className="text-sm text-slate-400">請輸入社團通行密碼</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="通行密碼"
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-widest focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-slate-600"
                    />
                    {error && (
                        <div className="text-red-400 text-sm text-center font-bold">{error}</div>
                    )}
                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "進入系統"}
                    </button>
                </form>
            </div>
        </div>
    );
}
