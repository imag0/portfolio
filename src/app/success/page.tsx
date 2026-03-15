"use client";

import { motion } from "framer-motion";
import { GlitchText } from "@/components/GlitchText";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Success() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen pt-24 pb-12 px-6 md:px-12 lg:px-24 mx-auto max-w-7xl relative z-10 selection:bg-[#00F0FF] selection:text-black flex flex-col items-center justify-center">
      {/* Fixed top-left Logo */}
      <div className="absolute top-8 left-6 md:left-12 z-50 flex items-center gap-4">
        <AnimatedLogo
          className="w-10 h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_0_25px_#00F0FF] transition-all duration-700"
        />
        <div className="hidden md:flex flex-col">
          <span className="font-mono text-xs tracking-[0.3em] font-bold text-[#00F0FF]">ECHLON_SYS</span>
          <span className="font-mono text-[10px] text-gray-500 tracking-widest">TRANSACTION_COMPLETE</span>
        </div>
      </div>

      {/* Success Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
          className="mb-8 flex justify-center"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 border-2 border-[#00F0FF] rounded-full flex items-center justify-center relative shadow-[0_0_30px_rgba(0,240,255,0.4)]">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl md:text-5xl text-[#00F0FF]"
            >
              ✓
            </motion.div>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <GlitchText
            as="h1"
            text="Payment Successful"
            className="text-5xl md:text-7xl tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-4"
          />
        </motion.div>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-xl md:text-2xl text-gray-400 font-mono mb-8 max-w-2xl leading-relaxed"
        >
          Thank you for your transaction.
          <br />
          <span className="text-[#00F0FF]">Your payment has been processed.</span>
        </motion.p>

        {/* Transaction Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="bg-black/40 border border-[#333] rounded-sm p-6 md:p-8 mb-12 max-w-md mx-auto shadow-[0_0_20px_rgba(0,240,255,0.1)]"
        >
          <p className="text-gray-400 font-mono text-sm mb-2">
            TRANSACTION_ID: <span className="text-[#00F0FF]">TXN_{Date.now().toString().slice(-8).toUpperCase()}</span>
          </p>
          <p className="text-gray-400 font-mono text-sm">
            STATUS: <span className="text-[#00F0FF] font-bold">VERIFIED</span>
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-col md:flex-row gap-4 justify-center items-center"
        >
          <Link
            href="/"
            className="px-8 py-3 border border-[#00F0FF] text-[#00F0FF] hover:bg-[#00F0FF] hover:text-black transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] rounded-sm uppercase tracking-widest font-bold font-mono text-sm relative group overflow-hidden"
          >
            <span className="relative z-10">Return Home</span>
            <div className="absolute inset-0 h-full w-full bg-[#00F0FF] -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></div>
          </Link>

          <a
            href="https://t.me/echlon_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 border border-[#FF003C] text-[#FF003C] hover:bg-[#FF003C] hover:text-black transition-all shadow-[0_0_15px_rgba(255,0,60,0.2)] hover:shadow-[0_0_25px_rgba(255,0,60,0.6)] rounded-sm uppercase tracking-widest font-bold font-mono text-sm relative group overflow-hidden"
          >
            <span className="relative z-10">Support</span>
            <div className="absolute inset-0 h-full w-full bg-[#FF003C] -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></div>
          </a>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <footer className="mt-24 pt-8 border-t border-[#222] flex flex-col md:flex-row justify-between items-center font-mono text-xs text-gray-500 relative z-20 w-full absolute bottom-0 left-0 px-6 md:px-12 lg:px-24">
        <p className="flex items-center space-x-2">
          <span>&copy; Echlon est. 2025</span>
          <span className="text-[#333]">|</span>
          <span className="opacity-50">All Rights Reserved</span>
        </p>
        <a
          href="mailto:echlondev@gmail.com"
          className="mt-4 md:mt-0 hover:text-[#00F0FF] transition-colors relative group"
        >
          echlondev@gmail.com
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#00F0FF] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
        </a>
      </footer>
    </main>
  );
}
