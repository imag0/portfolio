"use client";

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
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        <title>Transaction Complete</title>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400&display=swap');

          *{margin:0;padding:0;box-sizing:border-box}

          :root{
            --bg:#06080a;
            --fg:#c8c0a8;
            --dim:#c8c0a822;
            --glow:#c8c0a80a;
            --success:#00c853;
          }

          html,body{
            height:100%;overflow:hidden;
            background:var(--bg);
            font-family:'JetBrains Mono',monospace;
            color:var(--fg);
            cursor:crosshair;
            -webkit-font-smoothing:antialiased;
          }

          body{
            display:flex;
            align-items:center;
            justify-content:center;
          }

          /* ── Noise ── */
          body::before{
            content:'';position:fixed;inset:0;z-index:200;
            pointer-events:none;opacity:0.06;
            background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
            animation:noiseShift 0.15s steps(3) infinite;
          }

          @keyframes noiseShift{
            0%{transform:translate(0,0)}
            33%{transform:translate(-2px,1px)}
            66%{transform:translate(1px,-1px)}
            100%{transform:translate(0,0)}
          }

          /* ── Scanlines ── */
          body::after{
            content:'';position:fixed;inset:0;z-index:199;
            pointer-events:none;
            background:repeating-linear-gradient(
              to bottom,transparent,transparent 1px,
              rgba(0,0,0,0.2) 1px,rgba(0,0,0,0.2) 3px
            );
          }

          /* ── Vignette ── */
          .vignette{
            position:fixed;inset:0;z-index:198;
            pointer-events:none;
            box-shadow:inset 0 0 250px rgba(0,0,0,0.92);
          }

          /* ── Horizontal glitch bar ── */
          .glitch-bar{
            position:fixed;
            left:0;right:0;
            height:2px;
            background:var(--fg);
            opacity:0;
            z-index:300;
            pointer-events:none;
            animation:glitchBar 8s linear infinite;
          }

          @keyframes glitchBar{
            0%,100%{opacity:0;top:20%}
            2%{opacity:0.08;top:20%}
            2.5%{opacity:0;top:20%}
            45%{opacity:0;top:73%}
            46%{opacity:0.06;top:73%}
            46.5%{opacity:0;top:73%}
            78%{opacity:0;top:45%}
            78.5%{opacity:0.1;top:45%;height:4px}
            79.5%{opacity:0;top:45%}
          }

          /* ── Container ── */
          .c{
            display:flex;flex-direction:column;align-items:center;
            position:relative;z-index:10;
            padding:2rem;
            animation:containerIn 2s ease both;
          }

          @keyframes containerIn{
            0%{opacity:0;filter:blur(8px) brightness(3)}
            30%{opacity:0.5;filter:blur(0) brightness(1.5)}
            50%{opacity:0.2;filter:blur(2px) brightness(0.8)}
            100%{opacity:1;filter:blur(0) brightness(1)}
          }

          /* ── Success indicator ── */
          .status-indicator{
            width:140px;height:140px;
            position:relative;
            margin-bottom:4rem;
            display:flex;
            align-items:center;
            justify-content:center;
          }

          .status-circle{
            width:100%;height:100%;
            border:2px solid var(--success);
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            animation:statusPulse 2s ease-in-out infinite;
            position:relative;
          }

          .status-checkmark{
            font-size:4rem;
            color:var(--success);
            font-weight:bold;
            animation:checkScale 1s cubic-bezier(.16,1,.3,1) 1s both;
          }

          @keyframes statusPulse{
            0%,100%{box-shadow:0 0 0 0 rgba(0,200,83,0.3)}
            50%{box-shadow:0 0 0 15px rgba(0,200,83,0.1)}
          }

          @keyframes checkScale{
            0%{transform:scale(0);opacity:0}
            50%{transform:scale(1.2)}
            100%{transform:scale(1);opacity:1}
          }

          /* ── Corrupted text fragments ── */
          .frag{
            font-size:0.55rem;
            font-weight:300;
            letter-spacing:0.4em;
            text-transform:uppercase;
            opacity:0;
            text-align:center;
            line-height:2.4;
            position:relative;
          }

          .frag.f1{animation:fragIn 0.8s ease 2.8s both}
          .frag.f2{animation:fragIn 0.8s ease 3.6s both}
          .frag.f3{animation:fragIn 0.8s ease 4.4s both}

          @keyframes fragIn{
            0%{opacity:0;transform:translateY(4px);letter-spacing:0.8em}
            60%{opacity:0.5}
            100%{opacity:1;transform:translateY(0);letter-spacing:0.4em}
          }

          .frag .success-text{
            color:var(--success);
            font-weight:400;
          }

          .frag .redact{
            background:var(--fg);
            color:var(--fg);
            padding:0 0.3em;
            font-size:0.5rem;
            animation:redactFlicker 4s steps(1) infinite;
          }

          @keyframes redactFlicker{
            0%,100%{background:var(--fg);color:var(--fg)}
            92%{background:var(--fg);color:var(--fg)}
            93%{background:transparent;color:var(--fg)}
            95%{background:var(--fg);color:var(--fg)}
          }

          .frag .dim{opacity:0.25}

          /* ── The entry point ── */
          .entry{
            margin-top:3.5rem;
            opacity:0;
            animation:entryIn 1s ease 5.2s both;
          }

          @keyframes entryIn{
            0%{opacity:0;transform:translateY(8px)}
            100%{opacity:1;transform:translateY(0)}
          }

          .entry a{
            display:inline-flex;
            align-items:center;
            gap:0.5rem;
            text-decoration:none;
            color:var(--fg);
            font-size:0.55rem;
            font-weight:300;
            letter-spacing:0.35em;
            text-transform:uppercase;
            padding:0.6rem 1.4rem;
            border:1px solid var(--dim);
            position:relative;
            overflow:hidden;
            transition:all 0.6s cubic-bezier(.16,1,.3,1);
          }

          .entry a::before{
            content:'';position:absolute;inset:0;
            background:var(--fg);
            transform:scaleX(0);
            transform-origin:left;
            transition:transform 0.4s cubic-bezier(.16,1,.3,1);
            z-index:0;
          }

          .entry a:hover::before{transform:scaleX(1)}
          .entry a:hover{color:var(--bg);border-color:var(--fg)}

          .entry a span{position:relative;z-index:1}

          .entry a .arrow{
            position:relative;z-index:1;
            transition:transform 0.3s ease;
            font-size:0.7rem;
            line-height:1;
          }

          .entry a:hover .arrow{transform:translateX(4px)}

          .entry-cursor{
            display:inline-block;
            width:5px;height:11px;
            background:var(--fg);
            opacity:0.3;
            margin-left:1rem;
            vertical-align:middle;
            animation:cursorBlink 1.1s step-end infinite;
          }

          @keyframes cursorBlink{
            0%,100%{opacity:0.3}
            50%{opacity:0}
          }

          /* ── Scattered data fragments (background) ── */
          .bg-data{
            position:fixed;
            font-size:0.45rem;
            font-weight:300;
            letter-spacing:0.15em;
            color:var(--fg);
            opacity:0;
            pointer-events:none;
            z-index:5;
            animation:bgDataIn 2s ease both;
          }

          @keyframes bgDataIn{
            0%{opacity:0}
            100%{opacity:var(--o,0.04)}
          }

          .bg-data.d1{top:12%;left:8%;--o:0.04;animation-delay:4s;transform:rotate(-2deg)}
          .bg-data.d2{top:78%;right:6%;--o:0.03;animation-delay:5s;transform:rotate(1deg)}
          .bg-data.d3{top:25%;right:12%;--o:0.025;animation-delay:6s}
          .bg-data.d4{bottom:18%;left:5%;--o:0.03;animation-delay:5.5s;transform:rotate(-1deg)}
          .bg-data.d5{top:55%;left:4%;--o:0.02;animation-delay:7s}

          /* ── Bottom identifier ── */
          .sys-id{
            position:fixed;
            bottom:1.2rem;
            left:50%;transform:translateX(-50%);
            font-size:0.5rem;
            font-weight:300;
            letter-spacing:0.3em;
            opacity:0;
            z-index:10;
            animation:sysIn 1s ease 6s both;
          }

          @keyframes sysIn{from{opacity:0}to{opacity:0.1}}

          /* ── Edge ticks ── */
          .tick{
            position:fixed;
            background:var(--fg);
            opacity:0;
            z-index:10;
            animation:tickIn 1s ease both;
          }

          .tick.h{width:12px;height:1px}
          .tick.v{width:1px;height:12px}

          .tick.t1{top:2rem;left:2rem;animation-delay:5.5s}
          .tick.t2{top:2rem;right:2rem;animation-delay:5.7s}
          .tick.t3{bottom:2rem;left:2rem;animation-delay:5.9s}
          .tick.t4{bottom:2rem;right:2rem;animation-delay:6.1s}
          .tick.t5{top:calc(2rem + 1px);left:2rem;width:1px;height:12px;animation-delay:5.5s}
          .tick.t6{top:calc(2rem + 1px);right:2rem;width:1px;height:12px;animation-delay:5.7s}
          .tick.t7{bottom:calc(2rem + 1px);left:2rem;width:1px;height:12px;animation-delay:5.9s}
          .tick.t8{bottom:calc(2rem + 1px);right:2rem;width:1px;height:12px;animation-delay:6.1s}

          @keyframes tickIn{from{opacity:0}to{opacity:0.06}}
        ` }} />
      </head>
      <body>
        <div className="vignette"></div>
        <div className="glitch-bar"></div>

        {/* Corner ticks */}
        <div className="tick h t1"></div>
        <div className="tick h t2"></div>
        <div className="tick h t3"></div>
        <div className="tick h t4"></div>
        <div className="tick h t5"></div>
        <div className="tick h t6"></div>
        <div className="tick h t7"></div>
        <div className="tick h t8"></div>

        {/* Background data fragments */}
        <div className="bg-data d1">0x74 0x78 0x6e 0x5f 0x6f 0x6b</div>
        <div className="bg-data d2">payment_verified → CONFIRMED</div>
        <div className="bg-data d3">ledger_hash: 0x9a2f...</div>
        <div className="bg-data d4">consensus: +2847 valid</div>
        <div className="bg-data d5">signature_valid: TRUE</div>

        <div className="c">
          {/* Status Indicator */}
          <div className="status-indicator">
            <div className="status-circle">
              <div className="status-checkmark">✓</div>
            </div>
          </div>

          {/* Text fragments */}
          <div className="frag f1">
            <span className="dim">status:</span> <span className="success-text">transaction_verified</span>
          </div>

          <div className="frag f2">
            payment received <span className="success-text">&lt;timestamp_recorded&gt;</span>
          </div>

          <div className="frag f3">
            <span className="dim">integrity:</span> authenticated
          </div>

          {/* Entry */}
          <div className="entry">
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <a href="/">
                <span>return_home</span>
                <span className="arrow">→</span>
              </a>
              <span style={{ opacity: 0.3 }}>|</span>
              <a href="https://t.me/echlon_bot" target="_blank" rel="noopener noreferrer">
                <span>return_to_origin</span>
                <span className="arrow">→</span>
              </a>
            </div>
            <span className="entry-cursor"></span>
          </div>
        </div>

        <div className="sys-id">ECHLON // 2025</div>
      </body>
    </html>
  );
}
