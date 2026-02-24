"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '@/data/projects';
import { ChevronDown, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProjectCard({ project }: { project: Project }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            layout
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "relative rounded-xl border p-6 transition-all duration-300 bg-[#050608]/80 backdrop-blur-md overflow-hidden",
                isHovered ? "border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.2)] -translate-y-2" : "border-[#333]"
            )}
        >
            {/* Background glow on hover */}
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-to-br from-[#00F0FF]/5 to-transparent opacity-0 transition-opacity duration-500",
                    isHovered && "opacity-100"
                )}
            />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-mono text-xl font-bold text-white group-hover:text-[#00F0FF] transition-colors">
                        {isHovered ? (
                            <span className="glitch inline-block" data-text={project.name}>
                                {project.name}
                            </span>
                        ) : (
                            project.name
                        )}
                    </h3>
                    <div className="flex items-center space-x-1 shrink-0" title={`Chaos Level: ${project.chaosLevel}/5`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skull
                                key={i}
                                className={cn(
                                    "w-4 h-4 transition-colors",
                                    i < project.chaosLevel
                                        ? project.chaosLevel === 5 ? "text-[#FF003C] drop-shadow-[0_0_5px_#FF003C]" : "text-[#00F0FF]"
                                        : "text-[#333]"
                                )}
                            />
                        ))}
                    </div>
                </div>

                <p className="text-gray-400 text-sm mb-6 flex-grow">
                    {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map((tag, idx) => (
                        <span
                            key={idx}
                            className="text-xs font-mono px-2 py-1 rounded bg-[#111] border border-[#222] text-gray-300"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center text-sm font-mono text-[#00F0FF] hover:text-[#FF003C] transition-colors w-max"
                >
                    <span className="mr-2">{isExpanded ? 'Hide' : 'Show'} Features</span>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 border-t border-[#333]">
                                <ul className="space-y-2">
                                    {project.features.map((feature, idx) => (
                                        <motion.li
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="flex items-start text-sm text-gray-400"
                                        >
                                            <span className="text-[#00F0FF] mr-2 block mt-1">»</span>
                                            <span>{feature}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
