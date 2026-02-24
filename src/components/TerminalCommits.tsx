"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const defaultCommits = [
    "added stupid shit",
    "wtf is this",
    "shit++",
    "it works? lmao",
    "broke everything, fixing tomorrow",
    "added ICE agents because why not",
    "git push -f origin main",
    "Removed console.log('here')",
    "Update README.md... again",
    "I have no idea what I'm doing",
    "Fixed typo in variable name",
];

export function TerminalCommits() {
    const [commits, setCommits] = useState<{ id: string; text: string; time: string }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // initialize with a few commits
        const initialCommits = [
            { id: 'initial-1', text: "init framework", time: new Date(Date.now() - 60000).toISOString() },
            { id: 'initial-2', text: "added stupid shit", time: new Date(Date.now() - 30000).toISOString() },
        ];
        setCommits(initialCommits);

        const intervalId = setInterval(() => {
            const newCommit = {
                id: Math.random().toString(36).substring(7),
                text: defaultCommits[Math.floor(Math.random() * defaultCommits.length)],
                time: new Date().toISOString()
            };

            setCommits(prev => [...prev.slice(-15), newCommit]);
        }, 2500);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [commits]);

    return (
        <div className="w-full max-w-2xl mx-auto rounded-lg overflow-hidden border border-[#333] bg-[#050608] shadow-lg shadow-[#00F0FF]/10 z-10 relative">
            <div className="flex items-center px-4 py-2 bg-[#1A1A1A] border-b border-[#333]">
                <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF003C]"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="mx-auto text-xs text-gray-400 font-mono">echlon@sys:~</div>
            </div>
            <div
                ref={scrollRef}
                className="p-4 h-64 overflow-y-auto terminal-scroll font-mono text-sm space-y-2 flex flex-col"
            >
                <AnimatePresence initial={false}>
                    {commits.map((commit) => (
                        <motion.div
                            key={commit.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex font-mono"
                        >
                            <span className="text-[#00F0FF] mr-4 shrink-0">
                                {new Date(commit.time).toLocaleTimeString([], { hour12: false })}
                            </span>
                            <span className="text-[#00F0FF] opacity-50 mr-2 shrink-0">~</span>
                            <span className="text-gray-300">git commit -m "{commit.text}"</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div className="flex font-mono mt-2 animate-pulse">
                    <span className="text-[#00F0FF] mr-2">echlon@sys:~ $</span>
                    <span className="w-2 h-4 bg-[#00F0FF] inline-block translate-y-0.5 shadow-[0_0_8px_#00F0FF]"></span>
                </div>
            </div>
        </div>
    );
}
