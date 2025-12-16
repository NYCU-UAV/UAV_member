"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

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
        <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center bg-[#eef2f5]">
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
             opacity: 0.5;
             animation: drawPath 1.8s ease-in-out forwards;
        }

        .active #plane {
            opacity: 1;
            animation: flyPlane 1.8s ease-in-out forwards;
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
            0% { offset-distance: 0%; transform: scale(0.5); }
            100% { offset-distance: 100%; transform: scale(1); }
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
      `}</style>

            {/* Background Logo */}
            <div
                className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-center bg-no-repeat bg-contain"
                style={{ backgroundImage: "url('/logo.jpg')" }}
            />

            {/* Animation Container */}
            <div ref={containerRef} className="animation-container absolute inset-0 pointer-events-none z-20">
                <svg className="w-full h-full absolute overflow-visible">
                    <path
                        ref={pathRef}
                        id="flight-path"
                        className="fill-none stroke-[#A0522D] stroke-2 opacity-0"
                        d=""
                    />
                </svg>
                <div ref={planeRef} id="plane" className="w-10 h-10 absolute top-0 left-0 opacity-0 origin-center" style={{ offsetRotate: 'auto' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinejoin="round" className="w-full h-full rotate-45 drop-shadow-md">
                        <path d="M2 12l20-10-10 20-2-8-8-2z" fill="#fff" />
                        <path d="M12 22v-8" stroke="#ff4757" strokeWidth="2" />
                        <path d="M2 12l10 2" stroke="#2ed573" strokeWidth="2" />
                    </svg>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-[150px] z-30 relative">
                <button
                    className="px-12 py-[18px] text-lg bg-white border border-gray-200 rounded-xl cursor-pointer transition-all duration-300 font-semibold text-gray-600 shadow-sm hover:bg-gray-800 hover:text-white hover:-translate-y-0.5"
                    onMouseEnter={flyToButton}
                    onMouseLeave={leaveButton}
                >
                    近期活動
                </button>

                <Link
                    href="/dashboard"
                    className="px-12 py-[18px] text-lg bg-white border border-gray-200 rounded-xl cursor-pointer transition-all duration-300 font-semibold text-gray-600 shadow-sm hover:bg-gray-800 hover:text-white hover:-translate-y-0.5 inline-block"
                    onMouseEnter={flyToButton}
                    onMouseLeave={leaveButton}
                >
                    成員任務表
                </Link>

                <Link
                    href="/member-info"
                    className="px-12 py-[18px] text-lg bg-white border border-gray-200 rounded-xl cursor-pointer transition-all duration-300 font-semibold text-gray-600 shadow-sm hover:bg-gray-800 hover:text-white hover:-translate-y-0.5 inline-block"
                    onMouseEnter={flyToButton}
                    onMouseLeave={leaveButton}
                >
                    成員積分表
                </Link>
            </div>

        </div>
    );
}
