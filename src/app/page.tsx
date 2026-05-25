"use client";

import { motion } from "framer-motion";
import { GlitchText } from "@/components/GlitchText";
import { ProjectCard } from "@/components/ProjectCard";
import { TerminalCommits } from "@/components/TerminalCommits";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { SplashScreen } from "@/components/SplashScreen";
import { projects } from "@/data/projects";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [easterEggFound, setEasterEggFound] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {!showSplash && (
        <main className="min-h-screen pt-24 pb-12 px-6 md:px-12 lg:px-24 mx-auto max-w-7xl relative z-10 selection:bg-[#c8c0a8] selection:text-black">
          {/* Fixed top-left Logo */}
          <div className="absolute top-8 left-6 md:left-12 z-50 flex items-center gap-4">
            <AnimatedLogo
              className="w-10 h-10 text-[#c8c0a8] drop-shadow-[0_0_10px_rgba(200,192,168,0.3)] transition-all duration-700"
            />
            <div className="hidden md:flex flex-col">
              <span className="font-mono text-xs tracking-[0.3em] font-bold text-[#c8c0a8]">ECHLON_SYS</span>
              <span className="font-mono text-[10px] text-gray-600 tracking-widest">OPERATIONAL</span>
            </div>
          </div>

          {/* Easter Egg Overlay */}
          {easterEggFound && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setEasterEggFound(false)}>
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                className="text-center p-8 border-2 border-[#FF003C] bg-black shadow-[0_0_50px_#FF003C] font-mono text-[#FF003C]"
              >
                <div className="flex justify-center mb-6 w-32 h-32 mx-auto">
                  <AnimatedLogo className="w-full h-full text-[#FF003C] drop-shadow-[0_0_30px_#FF003C] animate-spin-slow" style={{ animationDuration: '3s' }} />
                </div>
                <h2 className="text-4xl mb-4 blink">SYSTEM COMPROMISED</h2>
                <p className="text-xl">Hello from drunk me.</p>
                <p className="text-sm mt-4 opacity-70">Click anywhere to dismiss</p>
              </motion.div>
            </div>
          )}

          {/* Hero Section */}
          <section className="min-h-[60vh] flex flex-col justify-center items-start mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="mb-4 flex flex-col md:flex-row items-start md:items-center gap-6 relative cursor-pointer group" onClick={() => setEasterEggFound(true)}>
                <div className="absolute inset-0 bg-[#c8c0a8]/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative z-10 w-20 h-20 md:w-24 md:h-24">
                  <Image
                    src="/logo_echlon.png"
                    alt="Echlon Logo"
                    fill
                    className="object-contain invert drop-shadow-[0_0_10px_rgba(200,192,168,0.3)] group-hover:drop-shadow-[0_0_25px_rgba(200,192,168,0.4)] transition-all duration-700"
                  />
                </div>
                <h1 className="text-6xl md:text-8xl tracking-tighter text-[#c8c0a8] relative z-10 font-mono font-bold">ECHLON</h1>
              </div>

              <motion.p
                className="text-xl md:text-2xl text-[#c8c0a8] font-mono mt-6 mb-8 max-w-2xl leading-relaxed opacity-80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                &gt;&nbsp;industrial_strength_chaos
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="flex items-center space-x-4 font-mono text-sm"
              >
                <a href="#projects" className="px-6 py-3 border border-[#c8c0a822] text-[#c8c0a8] hover:bg-[#c8c0a8] hover:text-black transition-all rounded-sm uppercase tracking-widest font-bold relative group overflow-hidden">
                  <span className="relative z-10">Initialize</span>
                  <div className="absolute inset-0 h-full w-full bg-[#c8c0a8] -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></div>
                </a>
                <a href="/assistant" className="px-6 py-3 border border-[#c8c0a822] text-[#c8c0a8]/75 hover:border-[#c8c0a8] hover:text-[#c8c0a8] transition-all rounded-sm uppercase tracking-widest font-bold">
                  Assistant
                </a>
              </motion.div>
            </motion.div>
          </section>

          {/* Projects Section */}
          <section id="projects" className="py-24 relative">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#c8c0a8]/20 to-transparent"></div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="flex items-center space-x-4 mb-12">
                <h2 className="text-3xl md:text-4xl font-mono font-bold text-[#c8c0a8] uppercase">
                  System_Components
                </h2>
                <div className="h-px bg-[#c8c0a8]/30 flex-grow"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project, idx) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                  >
                    <ProjectCard project={project} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Commit History Section */}
          <section className="py-24 relative">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#c8c0a8]/20 to-transparent"></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-mono font-bold text-[#c8c0a8] uppercase inline-block relative">
                  system_activity_log
                  <span className="absolute -top-4 -right-8 text-xs text-[#c8c0a8] animate-pulse">● REC</span>
                </h2>
                <p className="text-[#c8c0a8]/60 font-mono mt-4 text-sm">loading recent commit history...</p>
              </div>

              <TerminalCommits />
            </motion.div>
          </section>

          {/* Footer */}
          <footer className="mt-24 pt-8 border-t border-[#c8c0a8]/20 flex flex-col md:flex-row justify-between items-center font-mono text-xs text-[#c8c0a8]/60 relative z-20">
            <p className="flex items-center space-x-2">
              <span>&copy; Echlon est. 2025</span>
              <span className="text-[#c8c0a8]/30">|</span>
              <span className="opacity-50">All Rights Reserved</span>
            </p>
            <a
              href="mailto:echlondev@gmail.com"
              className="mt-4 md:mt-0 hover:text-[#c8c0a8] transition-colors relative group"
            >
              echlondev@gmail.com
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#c8c0a8] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            </a>
          </footer>
        </main>
      )}
    </>
  );
}
