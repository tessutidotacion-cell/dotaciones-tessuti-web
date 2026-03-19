import React from "react";

export default function GlobalStyles() {
  return (
    <style>{`
      @font-face {
        font-family: 'Helvetica';
        src: url('/fuentes/helvetica-light-587ebe5a59211.woff') format('woff');
        font-weight: 300;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'Helvetica';
        src: url('/fuentes/Helvetica.woff') format('woff');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'Helvetica';
        src: url('/fuentes/Helvetica-Oblique.woff') format('woff');
        font-weight: 400;
        font-style: oblique;
        font-display: swap;
      }
      @font-face {
        font-family: 'Helvetica';
        src: url('/fuentes/Helvetica-Bold.woff') format('woff');
        font-weight: 600 700;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'Helvetica';
        src: url('/fuentes/Helvetica-BoldOblique.woff') format('woff');
        font-weight: 600 700;
        font-style: oblique;
        font-display: swap;
      }
      @font-face {
        font-family: 'Helvetica Compressed';
        src: url('/fuentes/helvetica-compressed-5871d14b6903a.woff') format('woff');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'Helvetica Rounded';
        src: url('/fuentes/helvetica-rounded-bold-5871d05ead8de.woff') format('woff');
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }

      :root {
        --bg:        #ffffff;
        --bg-subtle: #f2efe9;
        --surface:   #ffffff;
        --surface-2: #faf8f5;
        --surface-3: #f3f0eb;
        --ink:       #181715;
        --ink-2:     #3a3835;
        --ink-3:     #7a7671;
        --ink-4:     #aaa9a5;
        --ink-5:     #ccc8c1;
        --line:      #e6e2db;
        --line-2:    #d5d0c8;
        --line-3:    #bfb9b0;
        --gold:      #a07850;
        --gold-lt:   #c9a87a;
        --gold-bg:   #f9f4ee;
        --ok:        #2d6a4f;  --ok-bg:   #f0f7f3;  --ok-line:   #a8d5b5;
        --err:       #8b2020;  --err-bg:  #fdf2f2;  --err-line:  #f0a8a8;
        --warn:      #7a5c00;  --warn-bg: #fdf8ec;  --warn-line: #e8c96a;
        --font:         'Helvetica', Arial, sans-serif;
        --font-display: 'Helvetica Compressed', 'Helvetica', Arial, sans-serif;
        --font-mono:    'Helvetica', monospace;
        --s1:4px; --s2:8px; --s3:12px; --s4:16px; --s5:24px;
        --s6:32px; --s7:48px; --s8:64px; --s9:96px;
        --r-xs:2px; --r-sm:4px; --r:8px; --r-lg:12px; --r-xl:20px;
        --sh-xs: 0 1px 2px  rgba(24,23,21,.04);
        --sh-sm: 0 2px 8px  rgba(24,23,21,.06), 0 1px 2px rgba(24,23,21,.04);
        --sh:    0 4px 20px rgba(24,23,21,.08), 0 2px 6px rgba(24,23,21,.04);
        --sh-md: 0 8px 32px rgba(24,23,21,.09), 0 3px 8px rgba(24,23,21,.05);
        --sh-lg: 0 20px 56px rgba(24,23,21,.11), 0 8px 20px rgba(24,23,21,.06);
        --ease:     cubic-bezier(.4,0,.2,1);
        --ease-out: cubic-bezier(0,0,.2,1);
        --t-xs:.08s; --t-sm:.14s; --t:.22s; --t-lg:.38s;
      }

      *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
      html { -webkit-text-size-adjust:100%; scroll-behavior:smooth; }

      body {
        font-family:var(--font);
        background:var(--bg); color:var(--ink);
        -webkit-font-smoothing:antialiased;
        -moz-osx-font-smoothing:grayscale;
        line-height:1.6; min-height:100dvh;
        font-size:14px; letter-spacing:.018em; overflow-x:hidden;
      }

      h1,h2,h3,h4,h5 {
        font-family:var(--font-display); color:var(--ink);
        font-weight:400; line-height:1.15; letter-spacing:.02em;
      }
      h1 { font-size:clamp(2.4rem,5.5vw,4rem);   font-weight:300; letter-spacing:.04em; }
      h2 { font-size:clamp(1.8rem,3.5vw,2.8rem); }
      h3 { font-size:clamp(1.3rem,2.5vw,1.9rem); }
      h4 { font-size:1.15rem; font-weight:500; }
      h5 { font-size:.95rem;  font-weight:600; }

      p { line-height:1.75; color:var(--ink-2); font-weight:300; }
      strong { font-weight:600; color:var(--ink); }
      a { color:inherit; text-decoration:none; transition:opacity var(--t-sm) var(--ease); }
      a:hover { opacity:.65; }
      img { max-width:100%; height:auto; display:block; }

      button {
        cursor:pointer; border:none;
        font-family:var(--font);
        font-size:11px; font-weight:600;
        letter-spacing:.12em; text-transform:uppercase;
        transition:all var(--t) var(--ease);
        background:none;
        display:inline-flex; align-items:center; justify-content:center;
        gap:8px; line-height:1;
        -webkit-tap-highlight-color:transparent;
      }
      button:disabled { opacity:.32; cursor:not-allowed !important; pointer-events:none; }
      button:focus-visible { outline:1.5px solid var(--ink); outline-offset:3px; border-radius:var(--r-sm); }

      input, select, textarea {
        font-family:var(--font);
        font-size:14px; font-weight:300; letter-spacing:.02em;
        width:100%; padding:13px 16px;
        border:1px solid var(--line-2); border-radius:var(--r-sm);
        background:var(--surface); color:var(--ink);
        transition:border-color var(--t-sm) var(--ease), box-shadow var(--t-sm) var(--ease);
        outline:none; line-height:1.5; -webkit-appearance:none;
      }
      input:hover:not(:focus), select:hover:not(:focus), textarea:hover:not(:focus) { border-color:var(--line-3); }
      input:focus, select:focus, textarea:focus {
        border-color:var(--ink);
        box-shadow:0 0 0 3px rgba(24,23,21,.07);
      }
      input::placeholder { color:var(--ink-5); font-weight:300; }
      textarea { resize:vertical; min-height:120px; }
      select {
        appearance:none;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%237a7671' stroke-width='1.2' stroke-linecap='round' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
        background-repeat:no-repeat; background-position:right 14px center; background-size:16px;
        padding-right:40px; cursor:pointer;
      }

      ::-webkit-scrollbar { width:4px; height:4px; }
      ::-webkit-scrollbar-track { background:transparent; }
      ::-webkit-scrollbar-thumb { background:var(--line-2); border-radius:99px; }
      ::-webkit-scrollbar-thumb:hover { background:var(--line-3); }

      @keyframes fadeIn    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
      @keyframes fadeUp    { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:none} }
      @keyframes fadeDown  { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
      @keyframes fadeScale { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
      @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
      @keyframes spin      { to{transform:rotate(360deg)} }
      @keyframes shimmer   { 0%{background-position:-800px 0} 100%{background-position:800px 0} }
      @keyframes checkDraw { from{stroke-dashoffset:60} to{stroke-dashoffset:0} }
      @keyframes pop { 0%{opacity:0;transform:scale(.9)} 55%{transform:scale(1.03)} 100%{opacity:1;transform:scale(1)} }

      .anim-in    { animation:fadeIn   .38s var(--ease) both; }
      .anim-scale { animation:fadeScale .28s var(--ease) both; }
      .anim-fast  { animation:fadeIn   .2s  var(--ease) both; }

      .stagger > * { animation:fadeUp .4s var(--ease) both; }
      .stagger > *:nth-child(1){ animation-delay:.04s }
      .stagger > *:nth-child(2){ animation-delay:.09s }
      .stagger > *:nth-child(3){ animation-delay:.14s }
      .stagger > *:nth-child(4){ animation-delay:.19s }
      .stagger > *:nth-child(5){ animation-delay:.24s }
      .stagger > *:nth-child(6){ animation-delay:.29s }

      .container    { max-width:1200px; margin:0 auto; padding:0 clamp(20px,5vw,60px); }
      .container-sm { max-width:780px;  margin:0 auto; padding:0 clamp(20px,5vw,48px); }
      .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
      @media(max-width:600px){ .grid-2{ grid-template-columns:1fr; gap:14px; } }

      /* Grain texture overlay */
      body::after {
        content:'';
        position:fixed; inset:0; z-index:99999;
        pointer-events:none;
        opacity:.028;
        background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        background-repeat:repeat;
        mix-blend-mode:multiply;
      }

      .app-nav {
        position:sticky; top:0; z-index:500;
        height:64px; padding:0 clamp(20px,5vw,60px);
        background:rgba(248,246,242,.94);
        backdrop-filter:blur(20px) saturate(1.6);
        -webkit-backdrop-filter:blur(20px) saturate(1.6);
        border-bottom:1px solid var(--line);
        display:flex; align-items:center; justify-content:space-between; gap:20px;
        transition:box-shadow var(--t) var(--ease), border-color var(--t) var(--ease);
      }
      .app-nav.scrolled {
        border-color:var(--line-2);
        box-shadow:0 1px 0 var(--line), 0 4px 24px rgba(24,23,21,.07);
      }

      .toast {
        position:fixed; bottom:32px; left:50%; transform:translateX(-50%);
        padding:12px 28px; border-radius:99px;
        font-size:11px; font-weight:600; letter-spacing:.1em; text-transform:uppercase;
        box-shadow:var(--sh-lg); z-index:9999;
        animation:fadeIn .22s var(--ease-out);
        max-width:min(520px,92vw); text-align:center;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,.25);
      }

      .admin-wrap { display:flex; min-height:100dvh; }
      .admin-sidebar {
        width:240px; background:var(--ink); flex-shrink:0;
        display:flex; flex-direction:column;
        border-right:1px solid rgba(255,255,255,.06);
      }
      @media(max-width:768px){
        .admin-wrap { flex-direction:column; }
        .admin-sidebar {
          width:100%; flex-direction:row; align-items:center;
          padding:0 20px !important; height:56px;
          border-right:none; border-bottom:1px solid rgba(255,255,255,.08);
        }
        .admin-sidebar-hdr { display:none !important; }
        .admin-nav    { flex-direction:row !important; padding:0 !important; gap:4px; margin-left:auto; }
        .admin-logout { margin-left:12px !important; padding:0 !important; }
      }

      .tbl-wrap {
        overflow-x:auto; -webkit-overflow-scrolling:touch;
        border-radius:var(--r-lg); border:1px solid var(--line);
        background:var(--surface); box-shadow:var(--sh-sm);
      }
      table { min-width:680px; width:100%; border-collapse:collapse; }
      thead { background:var(--surface-3); }
      th {
        text-align:left; font-family:var(--font);
        font-size:10px; font-weight:600; letter-spacing:.14em; text-transform:uppercase;
        color:var(--ink-3); padding:14px 20px;
        border-bottom:1px solid var(--line); white-space:nowrap;
      }
      td {
        text-align:left; padding:15px 20px;
        font-size:13.5px; font-weight:300; color:var(--ink-2);
        border-bottom:1px solid var(--line); vertical-align:middle;
      }
      tbody tr:last-child td { border-bottom:none; }
      tbody tr { transition:background var(--t-sm) var(--ease); }
      tbody tr:hover { background:var(--surface-2); }

      .badge {
        display:inline-flex; align-items:center; gap:5px;
        padding:4px 11px; border-radius:99px;
        font-size:10px; font-weight:600;
        letter-spacing:.1em; text-transform:uppercase; white-space:nowrap;
      }
      .badge-ok      { background:var(--ok-bg);     color:var(--ok);   border:1px solid var(--ok-line); }
      .badge-err     { background:var(--err-bg);    color:var(--err);  border:1px solid var(--err-line); }
      .badge-warn    { background:var(--warn-bg);   color:var(--warn); border:1px solid var(--warn-line); }
      .badge-neutral { background:var(--surface-3); color:var(--ink-3); border:1px solid var(--line-2); }
      .badge-gold    { background:var(--gold-bg);   color:var(--gold); border:1px solid #e2c89a; }

      .card {
        background:var(--surface); border:1px solid var(--line);
        border-radius:var(--r-lg); box-shadow:var(--sh-sm); overflow:hidden;
        transition:box-shadow var(--t) var(--ease), border-color var(--t) var(--ease), transform var(--t) var(--ease);
      }
      .card:hover { box-shadow:var(--sh-md); border-color:var(--line-2); transform:translateY(-2px); }
      .card-body    { padding:28px 32px; }
      .card-body-sm { padding:20px 24px; }
      .card-header  {
        padding:22px 32px; border-bottom:1px solid var(--line);
        display:flex; align-items:center; justify-content:space-between; gap:16px;
      }

      .form-group { display:flex; flex-direction:column; gap:8px; }
      .form-label { font-size:10px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); }
      .form-hint  { font-size:12px; color:var(--ink-4); line-height:1.5; }
      .form-error { font-size:12px; color:var(--err); display:flex; align-items:center; gap:5px; }

      .divider {
        height:1px; border:none;
        background:linear-gradient(to right, transparent, var(--line-2) 20%, var(--line-2) 80%, transparent);
        margin:var(--s6) 0;
      }
      .divider-sm { margin:var(--s5) 0; }

      .skeleton {
        background:linear-gradient(90deg,var(--surface-3) 25%,var(--bg-subtle) 50%,var(--surface-3) 75%);
        background-size:800px 100%; animation:shimmer 1.6s ease infinite;
        border-radius:var(--r-sm);
      }

      .eyebrow {
        display:inline-flex; align-items:center; gap:12px;
        font-size:10px; font-weight:600; letter-spacing:.2em; text-transform:uppercase;
        color:var(--ink-3);
      }
      .eyebrow::before,.eyebrow::after {
        content:''; display:block; width:28px; height:1px;
        background:currentColor; opacity:.4;
      }

      .label-xs { font-size:10px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); }
      .text-gold { color:var(--gold); }
      .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
    `}</style>
  );
}