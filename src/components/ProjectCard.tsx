"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '@/data/projects';
import { ChevronDown } from 'lucide-react';
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
                "relative rounded-sm border p-6 transition-all duration-300 bg-[#06080a]/60 backdrop-blur-sm overflow-hidden",
                isHovered ? "border-[#c8c0a8] -translate-y-1" : "border-[#c8c0a822]"
            )}
        >
            {/* Background glow on hover */}
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-to-br from-[#c8c0a8]/5 to-transparent opacity-0 transition-opacity duration-500",
                    isHovered && "opacity-100"
                )}
            />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-mono text-xl font-bold text-[#c8c0a8] transition-colors">
                        {project.name}
                    </h3>
                    <div className="flex items-center space-x-1 shrink-0 text-xs text-[#c8c0a8]/60" title={`Risk: ${project.chaosLevel}/5`}>
                        <span>[RISK</span>
                        <span className="font-bold">{project.chaosLevel}</span>
                        <span>]</span>
                    </div>
                </div>

                <p className="text-[#c8c0a8]/70 text-sm mb-6 flex-grow">
                    {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map((tag, idx) => (
                        <span
                            key={idx}
                            className="text-xs font-mono px-2 py-1 rounded-sm bg-[#06080a]/80 border border-[#c8c0a822] text-[#c8c0a8]/80"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center text-sm font-mono text-[#c8c0a8]/80 hover:text-[#c8c0a8] transition-colors w-max"
                >
                    <span className="mr-2">{isExpanded ? 'hide' : 'show'} features</span>
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
                            <div className="pt-4 border-t border-[#c8c0a822]">
                                <ul className="space-y-2">
                                    {project.features.map((feature, idx) => (
                                        <motion.li
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="flex items-start text-sm text-[#c8c0a8]/70"
                                        >
                                            <span className="text-[#c8c0a8]/60 mr-2 block mt-1">»</span>
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
