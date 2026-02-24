import React from 'react';
import { cn } from "@/lib/utils";

interface GlitchTextProps {
    text: string;
    className?: string;
    as?: React.ElementType;
}

export function GlitchText({ text, className, as: Component = 'span' }: GlitchTextProps) {
    return (
        <Component className={cn("glitch-wrapper font-mono font-bold tracking-tight inline-block", className)}>
            <span className="glitch block" data-text={text}>
                {text}
            </span>
        </Component>
    );
}
