"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { AnimatedLogo, AnimatedLogoRef } from './AnimatedLogo';

const bootSequence = [
    "bios: init memory... [OK]",
    "bios: loading kernel... [OK]",
    "sys: mounting root fs... [OK]",
    "sys: starting core services... [OK]",
    "net: probing interfaces... eth0 [UP]",
    "net: connecting to echlon network...",
    "auth: initializing cryptographic protocols...",
    "warn: undefined behaviour detected in sector 7G",
    "sys: ignoring warnings, full speed ahead.",
    "echlon_sys: loading classified ocular interface...",
    "echlon_sys: READY."
];

interface SplashScreenProps {
    onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
    const container = useRef<HTMLDivElement>(null);
    const logoRef = useRef<AnimatedLogoRef>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [booting, setBooting] = useState(true);

    // Handle the terminal boot typing effect
    useEffect(() => {
        let currentIndex = 0;
        let timeoutId: NodeJS.Timeout;

        const printLog = () => {
            if (currentIndex < bootSequence.length) {
                setLogs(prev => {
                    const nextLog = bootSequence[currentIndex];
                    return nextLog ? [...prev, nextLog] : prev;
                });
                currentIndex++;

                // Add random slight delay to simulate actual loading speeds
                const nextDelay = currentIndex === bootSequence.length ? 800 : Math.random() * 150 + 50;
                timeoutId = setTimeout(printLog, nextDelay);
            } else {
                timeoutId = setTimeout(() => setBooting(false), 500); // Wait a beat before opening eye
            }
        };

        timeoutId = setTimeout(printLog, 500); // Initial delay

        return () => {
            clearTimeout(timeoutId);
        };
    }, []);

    useGSAP(() => {
        if (!booting && logoRef.current) {
            // 1. Play the eye intro sequence (opens, adjust blinks)
            logoRef.current.playIntro(() => {

                // 2. Once intro is done, do the big GSAP zoom into the iris to reveal the site
                const tl = gsap.timeline({
                    onComplete: () => {
                        gsap.to(container.current, {
                            opacity: 0,
                            duration: 0.5,
                            onComplete: onComplete
                        });
                    }
                });

                // Add a slight delay of staring before zooming
                tl.to({}, { duration: 0.5 });

                // Zoom into the center of the eye rapidly
                tl.to(container.current, {
                    scale: 40,
                    opacity: 0,
                    duration: 1.2,
                    ease: "power4.in",
                    transformOrigin: "50% 50%"
                });
            });
        }
    }, { scope: container, dependencies: [booting] });

    return (
        <div
            ref={container}
            className="fixed inset-0 z-[100] bg-[#050608] flex items-center justify-center overflow-hidden h-screen w-screen"
        >
            {/* Terminal Logs (Behind the eye) */}
            <div className="absolute inset-0 p-8 pt-24 pl-12 md:pl-24 z-0 font-mono text-xs md:text-sm text-[#00F0FF]/60 flex flex-col justify-center max-w-2xl opacity-80 pointer-events-none">
                {logs.map((log, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`mt-1 ${log?.includes('warn') ? 'text-[#FF003C]' : log?.includes('READY') ? 'text-white' : ''}`}
                    >
                        <span className="opacity-50 mr-2">{'>'}</span>{log}
                    </motion.div>
                ))}
                {booting && (
                    <div className="mt-1 animate-pulse"><span className="opacity-50 mr-2">{'>'}</span>_</div>
                )}
            </div>

            {/* The Eye */}
            <div className="relative z-10 w-48 h-48 md:w-64 md:h-64 flex items-center justify-center drop-shadow-[0_0_30px_rgba(0,240,255,0.4)]">
                <AnimatedLogo
                    ref={logoRef}
                    startClosed={true}
                    className="w-full h-full text-[#00F0FF] brightness-150 saturate-200"
                    style={{ '--eye-bg': '#050608' } as React.CSSProperties} // Keep the sclera black to hide terminal logs
                />
            </div>

            {/* Global Vignette for the splash */}
            <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]"></div>
        </div>
    );
}
