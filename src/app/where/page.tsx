"use client";

import { useEffect, useState, useMemo } from "react";

export default function EarningsTrackerPage() {
    const [mounted, setMounted] = useState(false);
    const [now, setNow] = useState(new Date());

    // Static Contract Data
    const CONTRACT = useMemo(() => ({
        startDate: new Date('2026-03-06T00:00:00'),
        durationMonths: 4,
    }), []);

    const MONTHLY = useMemo(() => ({
        basic: 461.00,
        overtime: 220.00,
        leave: 120.00,
        subsistence: 126.00,
        weComp: 52.00,
        otherPure: 1073.00 - 52.00,
        total: 2000.00
    }), []);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Calculation Logic
    const stats = useMemo(() => {
        const diff = now.getTime() - CONTRACT.startDate.getTime();
        if (diff < 0) return null;

        const totalSeconds = diff / 1000;
        const totalDays = totalSeconds / (60 * 60 * 24);

        const months = Math.floor(totalDays / 30.44);
        const remDays = Math.floor(totalDays % 30.44);
        const remHours = Math.floor((totalSeconds / 3600) % 24);
        const remMinutes = Math.floor((totalSeconds / 60) % 60);

        const monthsElapsed = totalDays / 30.44;
        const baseEarned = MONTHLY.basic * monthsElapsed;
        const otEarned = MONTHLY.overtime * monthsElapsed;
        const leaveEarned = MONTHLY.leave * monthsElapsed;
        const subsEarned = MONTHLY.subsistence * monthsElapsed;
        const weEarned = MONTHLY.weComp * monthsElapsed;
        const otherEarned = MONTHLY.otherPure * monthsElapsed;
        const totalEarned = baseEarned + otEarned + leaveEarned + subsEarned + weEarned + otherEarned;

        const dailyRate = MONTHLY.total / 30.44;
        const hourlyRate = dailyRate / 24;

        const totalContractDays = CONTRACT.durationMonths * 30.44;
        const progressPct = Math.min((totalDays / totalContractDays) * 100, 100);

        return {
            time: {
                months: String(months).padStart(2, '0'),
                days: String(remDays).padStart(2, '0'),
                hours: String(remHours).padStart(2, '0'),
                minutes: String(remMinutes).padStart(2, '0')
            },
            earnings: {
                total: totalEarned,
                base: baseEarned,
                ot: otEarned,
                leave: leaveEarned,
                subs: subsEarned,
                we: weEarned,
                other: otherEarned
            },
            rates: { daily: dailyRate, hourly: hourlyRate },
            progress: progressPct.toFixed(2)
        };
    }, [now, CONTRACT, MONTHLY]);

    if (!mounted) return null;

    const fmt = (n: number, long = true) => {
        const prefix = long ? '$ ' : '$';
        return prefix + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="noise-layer scanlines-layer min-h-screen bg-[#06080a] selection:bg-[#c8c0a833] selection:text-[#c8c0a8]">
            <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600&display=swap');

        *{margin:0;padding:0;box-sizing:border-box}

        :root {
          --bg: #06080a;
          --fg: #c8c0a8;
          --dim: #c8c0a822;
          --glow: #c8c0a80a;
        }

        .main-wrapper {
          min-height: 100vh;
          background: var(--bg);
          font-family: 'JetBrains Mono', monospace;
          color: var(--fg);
          cursor: crosshair;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
          position: relative;
        }

        .grid-overlay {
          position: fixed; inset: 0; z-index: 1;
          background-image: linear-gradient(var(--dim) 1px, transparent 1px), linear-gradient(90deg, var(--dim) 1px, transparent 1px);
          background-size: 40px 40px; pointer-events: none; opacity: 0.15;
        }

        .noise-layer::before {
          content: ''; position: fixed; inset: 0; z-index: 200;
          pointer-events: none; opacity: 0.05;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          animation: noiseShift 0.15s steps(3) infinite;
        }

        @keyframes noiseShift { 0%{transform:translate(0,0)} 33%{transform:translate(-2px,1px)} 66%{transform:translate(1px,-1px)} 100%{transform:translate(0,0)} }

        .scanlines-layer::after {
          content: ''; position: fixed; inset: 0; z-index: 199;
          pointer-events: none;
          background: repeating-linear-gradient(to bottom, transparent, transparent 1px, rgba(0,0,0,0.2) 1px, rgba(0,0,0,0.2) 3px);
        }

        .vignette { position: fixed; inset: 0; z-index: 198; pointer-events: none; box-shadow: inset 0 0 300px rgba(0,0,0,0.9); }

        .signal-container {
          position: fixed; bottom: 0; left: 0; right: 0; height: 180px; z-index: 2;
          pointer-events: none; opacity: 0.25;
          mask-image: linear-gradient(to top, white, transparent);
          -webkit-mask-image: linear-gradient(to top, white, transparent);
        }

        .signal-wave { position: absolute; bottom: 0; left: 0; width: 200%; height: 100%; background-repeat: repeat-x; background-position: 0 bottom; }
        .sig-1 { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 100'%3E%3Cpath d='M0,50 Q200,0 400,50 T800,50' fill='none' stroke='%23c8c0a8' stroke-width='1.5'/%3E%3C/svg%3E"); background-size: 800px 100px; animation: signalMove 12s linear infinite; }
        .sig-2 { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 100'%3E%3Cpath d='M0,60 Q300,10 600,60 T1200,60' fill='none' stroke='%23c8c0a8' stroke-width='1' opacity='0.5'/%3E%3C/svg%3E"); background-size: 1200px 100px; animation: signalMove 18s linear infinite reverse; }
        .sig-3 { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 100'%3E%3Cpath d='M0,40 Q150,90 300,40 T600,40' fill='none' stroke='%23c8c0a8' stroke-width='0.5' opacity='0.3'/%3E%3C/svg%3E"); background-size: 600px 100px; animation: signalMove 8s linear infinite; }
        @keyframes signalMove { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        .container { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 10; padding: 3rem 2rem; max-width: 800px; margin: 0 auto; animation: containerIn 2s ease both; }
        @keyframes containerIn { 0%{opacity:0;filter:blur(8px) brightness(3)} 30%{opacity:0.5;filter:blur(0) brightness(1.5)} 100%{opacity:1;filter:blur(0) brightness(1)} }

        .eye { width: 80px; height: 80px; position: relative; margin-bottom: 2rem; }
        .eye svg { width: 100%; height: 100%; overflow: visible; }
        .eye-stroke { fill: none; stroke: var(--fg); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .eye-fill { fill: var(--fg); stroke: none; }
        .eye-lids { transform-origin: 50% 50%; animation: eyeReveal 2.5s cubic-bezier(.16,1,.3,1) 0.8s both, idleBlink 6s ease 4s infinite; }
        @keyframes eyeReveal { 0%{transform:scaleY(0);opacity:0} 50%{transform:scaleY(1);opacity:1} 100%{transform:scaleY(1);opacity:1} }
        @keyframes idleBlink { 0%,48%,53%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.05)} }
        .iris { transform-origin: 50% 50%; animation: irisLook 10s ease-in-out 3.5s infinite; }
        @keyframes irisLook { 0%,100%{transform:translateX(0)} 15%,25%{transform:translateX(6px)} 40%,55%{transform:translateX(-4px)} 70%,80%{transform:translateX(2px)} }

        .redacted { display: inline-block; background: var(--fg); color: var(--fg); padding: 0 0.4em; height: 1.1em; line-height: 1; position: relative; animation: redactFlicker 10s steps(1) infinite; }
        @keyframes redactFlicker { 0%,94%,98%,100%{background:var(--fg)} 95%,97%{background:transparent;text-shadow:0 0 5px var(--fg)} }

        .panel { width: 100%; border: 1px solid var(--dim); padding: 2rem; margin-bottom: 2rem; position: relative; background: rgba(6, 8, 10, 0.6); backdrop-filter: blur(8px); }
        .panel::before { content:''; position:absolute; top:-1px; left:-1px; width:10px; height:10px; border-top:1px solid var(--fg); border-left:1px solid var(--fg); }
        .panel::after { content:''; position:absolute; bottom:-1px; right:-1px; width:10px; height:10px; border-bottom:1px solid var(--fg); border-right:1px solid var(--fg); }
        .panel-tag { position: absolute; top: -0.6rem; left: 1.2rem; background: var(--bg); padding: 0 0.6rem; font-size: 0.5rem; letter-spacing: 0.3em; color: var(--fg); opacity: 0.8; text-transform: uppercase; }

        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; text-align: center; }
        @media (max-width: 600px) { .grid-4 { grid-template-columns: repeat(2, 1fr); gap: 1.5rem; } }

        .total-sum { font-size: 3.5rem; font-weight: 300; letter-spacing: -0.02em; margin: 0.8rem 0; color: var(--fg); text-shadow: 0 0 20px rgba(200, 192, 168, 0.15); }

        .details-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; margin-top: 1.5rem; }
        @media (max-width: 600px) { .details-list { grid-template-columns: 1fr; gap: 1rem; } }

        .row { display: flex; justify-content: space-between; align-items: flex-end; font-size: 0.65rem; padding-bottom: 0.6rem; border-bottom: 1px dotted var(--dim); color: var(--fg); }
        .progress-bar { height: 1px; background: var(--dim); position: relative; }
        .progress-fill { height: 1px; background: var(--fg); position: absolute; left: 0; top: 0; box-shadow: 0 0 15px var(--fg); transition: width 1s linear; }
        .progress-fill::after { content: ''; position: absolute; right: 0; top: -2px; width: 4px; height: 5px; background: var(--fg); box-shadow: 0 0 10px var(--fg); }

        .tick { position: fixed; background: var(--fg); opacity: 0.1; z-index: 10; pointer-events: none; }
        .tick.h { width: 15px; height: 1px; } .tick.v { width: 1px; height: 15px; }
        .t1, .t5 { top: 2rem; left: 2rem; } .t2, .t6 { top: 2rem; right: 2rem; } .t3, .t7 { bottom: 2rem; left: 2rem; } .t4, .t8 { bottom: 2rem; right: 2rem; }

        .label-frag { font-size: 0.55rem; font-weight: 300; letter-spacing: 0.4em; text-transform: uppercase; text-align: center; line-height: 2.4; opacity: 0.6; color: var(--fg); }
        .pulse-node { width: 6px; height: 12px; background: var(--fg); animation: cursorBlink 1.1s step-end infinite; }
        @keyframes cursorBlink { 0%,100%{opacity:0.8} 50%{opacity:0} }
      ` }} />

            <div className="main-wrapper">
                <div className="vignette"></div>
                <div className="grid-overlay"></div>

                <div className="signal-container">
                    <div className="signal-wave sig-1"></div>
                    <div className="signal-wave sig-2"></div>
                    <div className="signal-wave sig-3"></div>
                </div>

                <div className="tick h t1"></div><div className="tick h t2"></div>
                <div className="tick h t3"></div><div className="tick h t4"></div>
                <div className="tick v t5"></div><div className="tick v t6"></div>
                <div className="tick v t7"></div><div className="tick v t8"></div>

                <div className="container">
                    <div className="eye">
                        <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
                            <g className="eye-lids">
                                <path className="eye-stroke" d="M8,60 Q38,10 100,8 Q162,10 192,60" />
                                <path className="eye-stroke" d="M8,60 Q38,110 100,112 Q162,110 192,60" />
                                <circle className="eye-stroke" cx="100" cy="60" r="30" />
                                <g className="iris">
                                    <circle className="eye-fill" cx="100" cy="60" r="13" />
                                    <line className="eye-stroke" x1="100" y1="45" x2="100" y2="50" />
                                    <line className="eye-stroke" x1="100" y1="70" x2="100" y2="75" />
                                    <line className="eye-stroke" x1="85" y1="60" x2="90" y2="60" />
                                    <line className="eye-stroke" x1="110" y1="60" x2="115" y2="60" />
                                    <circle cx="100" cy="60" r="4.5" fill="var(--bg)" />
                                    <circle className="eye-fill" cx="100" cy="60" r="1.8" />
                                </g>
                            </g>
                        </svg>
                    </div>

                    <div className="label-frag">sys_init: earnings_monitor.v4</div>
                    <h1 style={{ fontSize: '1.1rem', letterSpacing: '0.35em', margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--fg)' }}>
                        TARGET: <span className="redacted">OPERATIVE_REDACTED</span>
                    </h1>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '3rem', color: 'var(--fg)' }}>
                        <div className="pulse-node"></div>
                        <span>DEPLOYED // RANGE: INT_WATERS // IMO: 9292280</span>
                    </div>

                    {stats && (
                        <>
                            <div className="panel">
                                <div className="panel-tag">{" >> "} MISSION_TIME_ELAPSED</div>
                                <div className="grid-4">
                                    <div><div style={{ fontSize: '2.2rem', fontWeight: 300, color: 'var(--fg)' }}>{stats.time.months}</div><div className="label-frag" style={{ fontSize: '0.45rem' }}>Months</div></div>
                                    <div><div style={{ fontSize: '2.2rem', fontWeight: 300, color: 'var(--fg)' }}>{stats.time.days}</div><div className="label-frag" style={{ fontSize: '0.45rem' }}>Days</div></div>
                                    <div><div style={{ fontSize: '2.2rem', fontWeight: 300, color: 'var(--fg)' }}>{stats.time.hours}</div><div className="label-frag" style={{ fontSize: '0.45rem' }}>Hours</div></div>
                                    <div><div style={{ fontSize: '2.2rem', fontWeight: 300, color: 'var(--fg)' }}>{stats.time.minutes}</div><div className="label-frag" style={{ fontSize: '0.45rem' }}>Minutes</div></div>
                                </div>
                            </div>

                            <div className="panel">
                                <div className="panel-tag">{" >> "} ASSET_ACCUMULATION</div>
                                <div style={{ textAlign: 'center', padding: '1rem 0 2rem' }}>
                                    <div className="label-frag">Current Fund Yield</div>
                                    <div className="total-sum">{fmt(stats.earnings.total)}</div>
                                    <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', opacity: 0.5, color: 'var(--fg)' }}>
                                        ACCRUAL_RATE: <b style={{ color: 'var(--fg)' }}>{fmt(stats.rates.daily, false)}</b> / DAY // <b style={{ color: 'var(--fg)' }}>{fmt(stats.rates.hourly, false)}</b> / HR
                                    </div>
                                </div>

                                <div className="details-list">
                                    <div>
                                        <div className="row"><span style={{ opacity: 0.4 }}>Basic Pay</span><span style={{ fontWeight: 600 }}>{fmt(stats.earnings.base, false)}</span></div>
                                        <div className="row"><span style={{ opacity: 0.4 }}>Guaranteed OT</span><span style={{ fontWeight: 600 }}>{fmt(stats.earnings.ot, false)}</span></div>
                                        <div className="row"><span style={{ opacity: 0.4 }}>Leave Accrual</span><span style={{ fontWeight: 600 }}>{fmt(stats.earnings.leave, false)}</span></div>
                                    </div>
                                    <div>
                                        <div className="row"><span style={{ opacity: 0.4 }}>Subsistence</span><span style={{ fontWeight: 600 }}>{fmt(stats.earnings.subs, false)}</span></div>
                                        <div className="row"><span style={{ opacity: 0.4 }}>W/E Compensation</span><span style={{ fontWeight: 600 }}>{fmt(stats.earnings.we, false)}</span></div>
                                        <div className="row"><span style={{ opacity: 0.4 }}>Other Credits</span><span style={{ fontWeight: 600 }}>{fmt(stats.earnings.other, false)}</span></div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '2.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', letterSpacing: '0.25em', marginBottom: '0.8rem', opacity: 0.6, color: 'var(--fg)' }}>
                                        <span>CONTRACT_PHASE_PROGRESS</span>
                                        <span>{stats.progress}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${stats.progress}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="panel">
                                <div className="panel-tag">{" >> "} SYSTEM_PARAMETERS</div>
                                <div className="details-list">
                                    <div>
                                        <div className="row"><span style={{ opacity: 0.4 }}>Registry</span><span style={{ fontWeight: 600 }}>ITALIAN INT.</span></div>
                                        <div className="row"><span style={{ opacity: 0.4 }}>Operator</span><span style={{ fontWeight: 600 }}>DALMARE S.P.A.</span></div>
                                        <div className="row"><span style={{ opacity: 0.4 }}>Max Mo. Pay</span><span style={{ fontWeight: 600 }}>$2,000.00</span></div>
                                    </div>
                                    <div>
                                        <div className="row"><span style={{ opacity: 0.4 }}>Departure</span><span style={{ fontWeight: 600 }}>Ravenna, IT</span></div>
                                        <div className="row"><span style={{ opacity: 0.4 }}>Watch Cycle</span><span style={{ fontWeight: 600 }}>44 HR / WK</span></div>
                                        <div className="row"><span style={{ opacity: 0.4 }}>Leave Calc</span><span style={{ fontWeight: 600 }}>7.5 D / MO</span></div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="footer-sys" style={{ marginTop: '4rem', fontSize: '0.5rem', letterSpacing: '0.4em', opacity: 0.3, color: 'var(--fg)' }}>
                        ECHLON // TERMINAL_ID: 9X-PRIME // 2026
                    </div>
                </div>
            </div>
        </div>
    );
}