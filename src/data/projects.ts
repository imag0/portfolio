export interface Project {
    id: string;
    name: string;
    description: string;
    tags: string[];
    chaosLevel: number;
    features: string[];
}

export const projects: Project[] = [
    {
        id: "neural-net-doom",
        name: "NavSight",
        description: "Stealthy autopilot training tool for manoevering simulator",
        tags: ["Python", "Autopilot", "C", "DLL"],
        chaosLevel: 5,
        features: [
            "Turn inertia simulation",
            "Global hotkeys",
            "Auto-map loading",
            "System tray ghost"
        ]
    },
    {
        id: "quantum-commit",
        name: "Deadman",
        description: "SAM orchestration tool",
        tags: ["Rust", "Bash", "API"],
        chaosLevel: 3,
        features: [
            "Post Quantum cryptography",
            "Writes commit messages in ancient Sumerian",
            "Pushes directly to main (always)",
            "Occasionally deletes random files just to keep you on your toes"
        ]
    },
    {
        id: "maritime-simulator",
        name: "Zenith",
        description: "A media player with a twist",
        tags: ["Electron", "Three.js", "WebGL"],
        chaosLevel: 3,
        features: [
            "Custom-built from scratch",
            "Hidden crypto miner (shh)",
            "Full gesture controls",
            "Dynamic YouTube-reactive backgrounds"
        ]
    },
    {
        id: "drunk-coder-bot",
        name: "MorseChat",
        description: "A Morse code messaging protocol because regular chat is for the weak",
        tags: ["Python", "Node.js", "MongoDB"],
        chaosLevel: 4,
        features: [
            "Pure Morse protocol",
            "Handled 200 concurrent users",
            "Latency so low you'd think it's 1844",
            "Has a 5% chance to leak your IP"
        ]
    },
    {
        id: "neon-shadow",
        name: "StowMaster",
        description: "Automatic container stowage planning",
        tags: ["Python", "JavaScript", "Madness"],
        chaosLevel: 5,
        features: [
            "O(n!) time complexity",
            "Renders pixels using capturing groups",
            "Impossible to debug",
            "Summons an elder god if you type 'Szafran' 3 times"
        ]
    }
];
