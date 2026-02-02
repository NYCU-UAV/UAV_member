"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Wallet, Package, LayoutGrid, Award, ArrowUpRight, ChevronRight, Activity, Cpu, Mail, CreditCard, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
    const containerRef = useRef<HTMLDivElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const planeRef = useRef<HTMLDivElement>(null);

    // Animation logic
    const flyToButton = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
        if (!containerRef.current || !pathRef.current || !planeRef.current) return;

        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const endX = rect.left + rect.width / 2;
        const endY = rect.top + rect.height / 2;

        const startX = -60;
        const startY = window.innerHeight / 2 + 100;

        const deltaX = endX - startX;

        const cp1X = startX + (deltaX * 1.5);
        const cp1Y = startY - 400;

        const cp2X = startX - (deltaX * 0.6);
        const cp2Y = endY - 100;

        const pathString = `M ${startX},${startY} C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${endX},${endY}`;

        pathRef.current.setAttribute('d', pathString);
        // @ts-ignore - offsetPath is not yet in all TS definitions
        planeRef.current.style.offsetPath = `path('${pathString}')`;

        const length = pathRef.current.getTotalLength();
        containerRef.current.style.setProperty('--path-length', length.toString());

        containerRef.current.classList.remove('active');
        containerRef.current.classList.remove('landed');
        void containerRef.current.offsetWidth; // Trigger reflow
        containerRef.current.classList.add('active');
    };

    const leaveButton = () => {
        if (!containerRef.current) return;
        containerRef.current.classList.remove('active');
        containerRef.current.classList.remove('landed');
    };

    const [gmail, setGmail] = useState("");
    const [clubAccount, setClubAccount] = useState("");
    const [allData, setAllData] = useState<any>(null);
    const [isEditingGmail, setIsEditingGmail] = useState(false);
    const [isEditingAccount, setIsEditingAccount] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/data");
                const data = await res.json();
                setAllData(data);
                setGmail(data.gmail || "");
                setClubAccount(data.clubAccount || "");
            } catch (err) {
                console.error("Failed to fetch data");
            }
        };
        fetchData();
    }, []);

    const saveData = async (field: 'gmail' | 'clubAccount', value: string) => {
        if (!allData) return;
        const updatedData = { ...allData, [field]: value };
        try {
            await fetch("/api/data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData)
            });
            setAllData(updatedData);
        } catch (err) {
            console.error("Failed to save data");
        }
    };

    useEffect(() => {
        const plane = planeRef.current;
        const container = containerRef.current;
        if (!plane || !container) return;

        const handleAnimationEnd = () => {
            if (container.classList.contains('active')) {
                container.classList.add('landed');
            }
        };

        plane.addEventListener('animationend', handleAnimationEnd);
        return () => plane.removeEventListener('animationend', handleAnimationEnd);
    }, []);

    return (
        <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center bg-[#050b18] text-white">
            <style jsx global>{`
                .animation-container {
                    --path-length: 0;
                }
                
                path#flight-path {
                    stroke-dasharray: 8 8 var(--path-length); 
                    stroke-dashoffset: var(--path-length);
                    transition: opacity 0.3s ease;
                }

                .active path#flight-path {
                     opacity: 0.3;
                     animation: drawPath 1.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }

                .active #plane {
                    opacity: 1;
                    animation: flyPlane 1.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }

                .landed #plane {
                    opacity: 1;
                    offset-distance: 100%;
                    animation: float 2s ease-in-out infinite;
                }

                @keyframes drawPath {
                    to { stroke-dashoffset: 0; }
                }

                @keyframes flyPlane {
                    0% { offset-distance: 0%; transform: scale(0.5) rotate(0deg); }
                    100% { offset-distance: 100%; transform: scale(1) rotate(0deg); }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }

                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.05); }
                }

                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
            `}</style>

            {/* Background Decorative Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
            </div>

            {/* Background Logo */}
            <div
                className="absolute inset-0 z-0 opacity-[0.07] pointer-events-none bg-center bg-no-repeat bg-[scale:60%] mix-blend-screen"
                style={{ backgroundImage: "url('/logo.jpg')" }}
            />

            {/* Animation Container */}
            <div ref={containerRef} className="animation-container absolute inset-0 pointer-events-none z-20">
                <svg className="w-full h-full absolute overflow-visible">
                    <path
                        ref={pathRef}
                        id="flight-path"
                        className="fill-none stroke-blue-500 stroke-[3] opacity-0"
                        d=""
                    />
                </svg>
                <div ref={planeRef} id="plane" className="w-12 h-12 absolute top-0 left-0 opacity-0 origin-center" style={{ offsetRotate: 'auto' }}>
                    <div className="relative w-full h-full">
                        <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full animate-pulse" />
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-white rotate-45 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                            <path d="M22 2L11 13" />
                            <path d="M22 2l-7 20-4-9-9-4 20-7z" fill="white" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Central Hero Section */}
            <div className="z-10 text-center space-y-2 md:space-y-4 max-w-2xl px-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-2 md:mb-4">
                    <Cpu className="h-3 w-3 md:h-4 md:w-4 text-blue-400 animate-spin-slow" />
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-blue-400">NYCU UAV Center • System V2.0</span>
                </div>
                <h1 className="text-4xl md:text-8xl font-black italic tracking-tighter leading-none">
                    NYCU <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-white">UAV</span>
                </h1>
                <p className="text-slate-400 font-bold uppercase tracking-[0.3em] md:tracking-[0.5em] text-[10px] md:text-sm">
                    Autonomous Aerial Systems Control
                </p>
                <div className="pt-4 md:pt-8 flex justify-center gap-6 md:gap-12 text-slate-600">
                    <div className="flex flex-col items-center">
                        <div className="h-0.5 w-8 md:w-12 bg-white/10 mb-2" />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Protocol</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="h-0.5 w-8 md:w-12 bg-white/10 mb-2" />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Efficiency</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="h-0.5 w-8 md:w-12 bg-white/10 mb-2" />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Innovation</span>
                    </div>
                </div>

                {/* Editable HUD Fields */}
                <div className="pt-8 md:pt-12 flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
                    {/* GMAIL Field */}
                    <div className="w-full relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500/50" />
                        <div className="absolute left-10 top-1/2 -translate-y-1/2 h-4 w-[1px] bg-white/10" />
                        <input
                            type="text"
                            value={gmail}
                            onChange={(e) => setGmail(e.target.value)}
                            readOnly={!isEditingGmail}
                            className={cn(
                                "w-full bg-white/[0.03] border border-white/5 rounded-xl pl-14 pr-12 py-3 text-xs font-mono tracking-wider transition-all text-center outline-none",
                                isEditingGmail
                                    ? "bg-white/[0.08] border-blue-500/40 text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                    : "text-blue-200/70 select-none cursor-default"
                            )}
                        />
                        <button
                            onClick={() => {
                                if (isEditingGmail) saveData('gmail', gmail);
                                setIsEditingGmail(!isEditingGmail);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all pointer-events-auto"
                        >
                            {isEditingGmail ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Pencil className="h-3.5 w-3.5" />}
                        </button>
                        <span className="absolute -top-2 left-6 px-2 bg-[#050b18] text-[8px] font-black uppercase tracking-[0.2em] text-slate-600 pointer-events-none">聯絡信箱 Gmail</span>
                    </div>

                    {/* ACCOUNT Field */}
                    <div className="w-full relative group">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500/50" />
                        <div className="absolute left-10 top-1/2 -translate-y-1/2 h-4 w-[1px] bg-white/10" />
                        <input
                            type="text"
                            value={clubAccount}
                            onChange={(e) => setClubAccount(e.target.value)}
                            readOnly={!isEditingAccount}
                            className={cn(
                                "w-full bg-white/[0.03] border border-white/5 rounded-xl pl-14 pr-12 py-3 text-xs font-mono tracking-wider transition-all text-center outline-none",
                                isEditingAccount
                                    ? "bg-white/[0.08] border-orange-500/40 text-orange-100 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
                                    : "text-orange-200/70 select-none cursor-default"
                            )}
                        />
                        <button
                            onClick={() => {
                                if (isEditingAccount) saveData('clubAccount', clubAccount);
                                setIsEditingAccount(!isEditingAccount);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all pointer-events-auto"
                        >
                            {isEditingAccount ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Pencil className="h-3.5 w-3.5" />}
                        </button>
                        <span className="absolute -top-2 left-6 px-2 bg-[#050b18] text-[8px] font-black uppercase tracking-[0.2em] text-slate-600 pointer-events-none">社團帳戶 Account</span>
                    </div>
                </div>
            </div>

            {/* Corner Navigation Module Grid */}
            <div className="absolute inset-0 z-30 pointer-events-none p-4 md:p-20 flex flex-col justify-between">
                {/* Top Row */}
                <div className="flex justify-between items-start gap-2">
                    {/* Top Left: Finance */}
                    <NavCard
                        href="/finance"
                        title="社團金流表"
                        subtitle="Financial Center"
                        icon={<Wallet className="h-5 w-5 md:h-6 md:w-6" />}
                        color="green"
                        onMouseEnter={flyToButton}
                        onMouseLeave={leaveButton}
                        align="left"
                    />

                    {/* Top Right: Inventory */}
                    <NavCard
                        href="/inventory"
                        title="財產清冊"
                        subtitle="Asset Control"
                        icon={<Package className="h-5 w-5 md:h-6 md:w-6" />}
                        color="blue"
                        onMouseEnter={flyToButton}
                        onMouseLeave={leaveButton}
                        align="right"
                    />
                </div>

                {/* Bottom Row */}
                <div className="flex justify-between items-end gap-2">
                    {/* Bottom Left: Dashboard */}
                    <NavCard
                        href="/dashboard"
                        title="成員任務表"
                        subtitle="Mission Control"
                        icon={<LayoutGrid className="h-5 w-5 md:h-6 md:w-6" />}
                        color="purple"
                        onMouseEnter={flyToButton}
                        onMouseLeave={leaveButton}
                        align="left"
                    />

                    {/* Bottom Right: Member Info */}
                    <NavCard
                        href="/member-info"
                        title="成員積分表"
                        subtitle="Member Index"
                        icon={<Award className="h-5 w-5 md:h-6 md:w-6" />}
                        color="orange"
                        onMouseEnter={flyToButton}
                        onMouseLeave={leaveButton}
                        align="right"
                    />
                </div>
            </div>

            {/* Corner HUD Decorations */}
            <HUDElement />
        </div>
    );
}

function NavCard({ href, title, subtitle, icon, color, onMouseEnter, onMouseLeave, align }: any) {
    const colorClasses = {
        green: "hover:border-green-500/50 hover:bg-green-500/5 text-green-400 bg-green-500/10",
        blue: "hover:border-blue-500/50 hover:bg-blue-500/5 text-blue-400 bg-blue-500/10",
        purple: "hover:border-purple-500/50 hover:bg-purple-500/5 text-purple-400 bg-purple-500/10",
        orange: "hover:border-orange-500/50 hover:bg-orange-500/5 text-orange-400 bg-orange-500/10",
    }[color as 'green' | 'blue' | 'purple' | 'orange'];

    const textAlign = align === 'right' ? 'text-right' : 'text-left';
    const flexAlign = align === 'right' ? 'items-end' : 'items-start';
    const iconSide = align === 'right' ? 'flex-row-reverse' : 'flex-row';

    return (
        <Link
            href={href}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={cn(
                "group pointer-events-auto block w-[calc(50%-0.75rem)] md:w-64 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
                color === 'green' && "hover:border-green-500/30",
                color === 'blue' && "hover:border-blue-500/30",
                color === 'purple' && "hover:border-purple-500/30",
                color === 'orange' && "hover:border-orange-500/30"
            )}
        >
            <div className={cn("flex flex-col gap-3 md:gap-6", flexAlign)}>
                <div className={cn("flex items-center gap-2 md:gap-4 w-full", iconSide)}>
                    <div className={cn("h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", colorClasses)}>
                        {icon}
                    </div>
                    <div className="h-[1px] flex-1 bg-white/5 group-hover:bg-white/10 transition-colors hidden sm:block" />
                    <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>

                <div className={textAlign}>
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-slate-500 mb-0.5 md:mb-1">{subtitle}</p>
                    <h3 className="text-sm md:text-2xl font-black tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all leading-tight">{title}</h3>
                </div>

                <div className={cn("hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0", align === 'right' && "flex-row-reverse")}>
                    <span className="text-[10px] font-bold text-slate-400">進入系統</span>
                    <ChevronRight className="h-3 w-3 text-slate-500" />
                </div>
            </div>
        </Link>
    );
}

function HUDElement() {
    return (
        <div className="absolute inset-x-20 bottom-10 z-10 pointer-events-none hidden md:flex justify-between items-end opacity-20">
            <div className="space-y-4">
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="w-1 h-4 bg-blue-500/50 rounded-full" />
                    ))}
                </div>
                <div className="text-[10px] font-mono whitespace-pre">
                    LAT: 24.7961° N{"\n"}
                    LON: 120.9967° E{"\n"}
                    ALT: 45.2m
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Status</div>
                    <div className="text-xs font-mono text-green-500 tracking-tighter">● OPERATIONAL</div>
                </div>
                <div className="h-12 w-12 rounded-full border-2 border-dashed border-white/10 animate-spin-slow flex items-center justify-center">
                    <Activity className="h-5 w-5 text-blue-500/50" />
                </div>
            </div>
        </div>
    );
}
