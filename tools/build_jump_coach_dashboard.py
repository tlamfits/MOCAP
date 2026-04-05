#!/usr/bin/env python3
"""
Build Coach_Team_Jump_Metric_Dashboard.html from:
  - Flight_School_Coach_Team_Report.html (layout + styles)
  - Parsed jump reports (data)
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def parse_reports(reports_dir: Path, exclude_sample: bool) -> dict:
    parse_py = _repo_root() / "tools" / "parse_jump_reports.py"
    cmd = [sys.executable, str(parse_py), str(reports_dir)]
    if exclude_sample:
        cmd.append("--exclude-sample")
    out = subprocess.check_output(cmd, text=True)
    return json.loads(out)


def to_dashboard_athletes(raw: dict) -> list[dict]:
    out = []
    for a in raw["athletes"]:
        out.append(
            {
                "name": a["name"],
                "team": a["team"],
                "testDate": a["testDate"],
                "tests": a["tests"],
                "aj": a["aj"],
                "touch": a.get("touch") or "—",
                "reach": a.get("reach") or "—",
                "cmj": a["cmj"],
                "dj": a["dj"],
                "tov": a["tov"],
                "mrsi": a["mrsi"],
                "rsi": a["rsi"],
                "maxStr": a["maxStr"],
                "react": a["react"],
                "ecc": a["ecc"],
                "prop": a["prop"],
                "sym": a["sym"],
                "timingComp": a["timingComp"],
                "lifts": None,
                "liftScores": None,
                "kinogramLink": "#",
                "kinogramScore": "—",
            }
        )
    return out


def patch_template(html: str, bundle: dict) -> str:
    athletes = bundle["athletes"]
    meta = bundle["meta"]

    html = re.sub(
        r"const athletes = \[[\s\S]*?\];",
        "const athletes = "
        + json.dumps(athletes, ensure_ascii=False)
        + ";",
        html,
        count=1,
    )

    html = html.replace(
        "<title>Flight School — Coach Team Report</title>",
        "<title>Flight School — Coach Team Jump Metric Dashboard</title>",
    )
    html = html.replace(
        '<div class="team-name">COLOSSEUM VOLLEYBALL</div>',
        '<div class="team-name">COLOSSEUM VOLLEYBALL</div>',
    )
    html = re.sub(
        r"<span>📅 Testing: [^<]*</span>",
        f"<span>📅 Testing: {meta.get('dateRange') or '—'}</span>",
        html,
        count=1,
    )
    html = re.sub(
        r"<span>👥 Roster: \d+ Athletes</span>",
        f"<span>👥 Roster: {meta.get('reportCount', len(athletes))} Athletes</span>",
        html,
        count=1,
    )

    html = html.replace(
        "KEY LIFT ANALYSIS",
        "JUMP METRICS",
    )
    html = html.replace(
        "Key Lift Analysis",
        "Jump Metrics Detail",
    )
    html = html.replace(
        "Gym-based force & power qualities mapped to engine profile",
        "CMJ / DJ / RSI / mRSI / takeoff velocity from Hawkin assessments",
    )

    # Dashboard: Lift Composite → mRSI (CMJ)
    html = html.replace(
        '<th data-col="liftAvg">Lift Composite</th>',
        '<th data-col="mrsi">mRSI (CMJ)</th>',
    )

    # Strength cluster → Jump performance cluster
    html = html.replace(
        "Strength Cluster",
        "Jump Performance",
    )
    html = html.replace(
        "→ Maps to Max Strength Engine Quality",
        "CMJ & DJ heights (inches)",
    )
    html = html.replace(
        '<thead><tr><th>Athlete</th><th>Back Squat</th><th>Front Squat</th><th>Trap Bar DL</th><th>Str Avg</th></tr></thead>',
        "<thead><tr><th>Athlete</th><th>CMJ</th><th>DJ</th><th>Best</th></tr></thead>",
    )
    html = html.replace(
        "Power Cluster",
        "Elastic / Reactive",
    )
    html = html.replace(
        "→ Maps to Power / Propulsion Engine Quality",
        "RSI, mRSI, takeoff velocity",
    )
    html = html.replace(
        '<thead><tr><th>Athlete</th><th>DB Jump (W/kg)</th><th>Hang Clean</th><th>Pwr Avg</th></tr></thead>',
        "<thead><tr><th>Athlete</th><th>RSI (DJ)</th><th>mRSI</th><th>TOV m/s</th></tr></thead>",
    )

    html = html.replace(
        "Strength Ceiling vs. Engine Expression",
        "CMJ vs. Engine Expression",
    )
    html = html.replace(
        "High lift + low engine = coordination/elastic limitation · Low lift + low engine = raw strength ceiling",
        "High CMJ + lower engine avg = expression gap · Use with individual jump reports for context",
    )
    html = html.replace(
        '<div class="scatter-axis-label scatter-x-label">Key Lift Score →</div>',
        '<div class="scatter-axis-label scatter-x-label">CMJ height →</div>',
    )

    html = html.replace(
        "Flight School Coach Team Report v1.0",
        "Flight School Coach Team Jump Metric Dashboard v1.0",
    )

    html = re.sub(
        r'<select class="filter-select" id="teamFilter">\s*<option value="all">All Teams</option>.*?</select>',
        '<select class="filter-select" id="teamFilter">\n                <option value="all">All Teams</option>\n            </select>',
        html,
        count=1,
        flags=re.DOTALL,
    )

    # --- JS patches (after const athletes) ---
    get_flags_new = r"""function getFlags(a) {
    const flags = [];
    const symList = (a.sym || []).filter(s => s !== null && s !== undefined);
    if (symList.length && symList.some(s => s < 30)) flags.push({icon:'⚠️', type:'red', msg:'Severe symmetry deficit (score < 30)'});
    else if (symList.length && symList.some(s => s < 60)) flags.push({icon:'⚡', type:'orange', msg:'Symmetry imbalance detected (score < 60)'});
    [['react','Reactivity'],['ecc','Eccentric'],['prop','Propulsion'],['maxStr','Max Strength']].forEach(([k,name])=>{
        if (a[k] !== null && a[k] !== undefined && a[k] <= 25) flags.push({icon:'🔻', type:'red', msg: name+' in Development band ('+a[k]+')'});
        else if (a[k] !== null && a[k] !== undefined && a[k] <= 50) flags.push({icon:'📉', type:'yellow', msg: name+' in Intermediate band ('+a[k]+')'});
    });
    return flags;
}"""

    html = re.sub(
        r"function getFlags\(a\) \{[\s\S]*?return flags;\s*\}",
        get_flags_new,
        html,
        count=1,
    )

    html = html.replace(
        "if (sortCol === 'liftAvg') { va = a.liftScores ? Math.round((a.liftScores.str+a.liftScores.pwr)/2) : 0; vb = b.liftScores ? Math.round((b.liftScores.str+b.liftScores.pwr)/2) : 0; }",
        "if (sortCol === 'mrsi') { va = a.mrsi; vb = b.mrsi; }",
    )

    html = html.replace(
        """        const la = a.liftScores ? Math.round((a.liftScores.str + a.liftScores.pwr)/2) : null;
        const flags = getFlags(a);
        html += `<tr data-name="${a.name}" onclick="toggleDrillDown(this)">
            <td><span class="athlete-link">${a.name}</span></td>
            <td style="font-size:0.75em;color:var(--text-muted);">${a.team}</td>
            <td><strong>${a.aj}"</strong> <span class="level-pill ${getPillClass(getLevel(ea))}">${getLevel(ea) ? 'L'+getLevel(ea) : ''}</span></td>
            <td>${a.cmj}"</td>
            <td class="score-cell ${getScoreClass(a.maxStr)}">${a.maxStr !== null ? a.maxStr : '—'}</td>
            <td class="score-cell ${getScoreClass(a.react)}">${a.react}</td>
            <td class="score-cell ${getScoreClass(a.ecc)}">${a.ecc}</td>
            <td class="score-cell ${getScoreClass(a.prop)}">${a.prop}</td>
            <td class="score-cell ${getScoreClass(ea)}">${ea || '—'}</td>
            <td class="score-cell ${getScoreClass(la)}">${la || '—'}</td>""",
        """        const flags = getFlags(a);
        html += `<tr data-name="${a.name}" onclick="toggleDrillDown(this)">
            <td><span class="athlete-link">${a.name}</span></td>
            <td style="font-size:0.75em;color:var(--text-muted);">${a.team}</td>
            <td><strong>${a.aj != null ? a.aj+'\\"' : '—'}</strong> ${a.aj != null ? '<span class="level-pill '+getPillClass(getLevel(ea))+'">'+(getLevel(ea)?'L'+getLevel(ea):'')+'</span>' : '<span style="color:var(--text-muted);font-size:0.75em;">(no AJ)</span>'}</td>
            <td>${a.cmj != null ? a.cmj+'\\"' : '—'}</td>
            <td class="score-cell ${getScoreClass(a.maxStr)}">${a.maxStr !== null ? a.maxStr : '—'}</td>
            <td class="score-cell ${getScoreClass(a.react)}">${a.react}</td>
            <td class="score-cell ${getScoreClass(a.ecc)}">${a.ecc}</td>
            <td class="score-cell ${getScoreClass(a.prop)}">${a.prop}</td>
            <td class="score-cell ${getScoreClass(ea)}">${ea || '—'}</td>
            <td class="score-cell score-na" style="color:var(--text-primary);font-weight:600;">${a.mrsi != null ? a.mrsi.toFixed(3) : '—'}</td>""",
    )

    new_drill = r"""                <div class="drill-card">
                    <div class="drill-card-title">Elastic / RSI</div>
                    <div class="drill-metric"><span class="drill-metric-label">RSI (DJ)</span><span class="drill-metric-val">${a.rsi != null ? a.rsi.toFixed(3) : '—'}</span></div>
                    <div class="drill-metric"><span class="drill-metric-label">mRSI (CMJ)</span><span class="drill-metric-val">${a.mrsi != null ? a.mrsi.toFixed(3) : '—'}</span></div>
                    <div class="drill-metric"><span class="drill-metric-label">Takeoff velocity</span><span class="drill-metric-val">${a.tov != null ? a.tov.toFixed(2)+' m/s' : '—'}</span></div>
                    <div style="margin-top:8px;font-size:0.72em;color:var(--text-muted);">Barbell metrics are not exported in jump reports.</div>
                </div>"""

    html = html.replace(
        """                <div class="drill-card">
                    <div class="drill-card-title">Key Lifts (Rel. BW)</div>
                    <div class="drill-metric"><span class="drill-metric-label">Back Squat</span><span class="drill-metric-val">${a.lifts.bs.toFixed(2)}x</span></div>
                    <div class="drill-metric"><span class="drill-metric-label">Front Squat</span><span class="drill-metric-val">${a.lifts.fs.toFixed(2)}x</span></div>
                    <div class="drill-metric"><span class="drill-metric-label">Trap Bar DL</span><span class="drill-metric-val">${a.lifts.tb.toFixed(2)}x</span></div>
                    <div class="drill-metric"><span class="drill-metric-label">DB Jump Power</span><span class="drill-metric-val">${a.lifts.dbPwr.toFixed(1)} W/kg</span></div>
                    <div class="drill-metric"><span class="drill-metric-label">Hang Clean</span><span class="drill-metric-val">${a.lifts.hc.toFixed(2)}x</span></div>
                    <div style="margin-top:8px;display:flex;gap:8px;">
                        <span class="level-pill ${getPillClass(getLevel(a.liftScores.str))}" style="font-size:0.6em;">STR: ${a.liftScores.str}</span>
                        <span class="level-pill ${getPillClass(getLevel(a.liftScores.pwr))}" style="font-size:0.6em;">PWR: ${a.liftScores.pwr}</span>
                    </div>
                </div>""",
        new_drill,
    )

    # Symmetry drill: handle null entries
    html = html.replace(
        """                    ${['Eccentric Loading','Reactive Loading','Propulsion','Landing'].map((name,i) => {
                        const s = a.sym[i] !== undefined ? a.sym[i] : null;
                        return s !== null ? `<div class="drill-metric"><span class="drill-metric-label">${name}</span><span class="drill-metric-val" style="color:${s>=70?'#2ecc71':s>=40?'#f39c12':'#e74c3c'};">${s}</span></div>` : '';
                    }).join('')}""",
        """                    ${['Eccentric Loading','Reactive Loading','Propulsion','Landing'].map((name,i) => {
                        const s = a.sym[i];
                        return s !== null && s !== undefined ? `<div class="drill-metric"><span class="drill-metric-label">${name}</span><span class="drill-metric-val" style="color:${s>=70?'#2ecc71':s>=40?'#f39c12':'#e74c3c'};">${s}</span></div>` : '';
                    }).join('')}""",
    )

    # Jump performance tables
    html = html.replace(
        """function renderLiftTables() {
    const sorted = [...athletes].sort((a,b) => (b.liftScores?.str||0) - (a.liftScores?.str||0));
    let strHtml = '', pwrHtml = '';
    sorted.forEach(a => {
        strHtml += `<tr>
            <td style="font-weight:600;">${a.name}</td>
            <td>${a.lifts.bs.toFixed(2)}x</td>
            <td>${a.lifts.fs.toFixed(2)}x</td>
            <td>${a.lifts.tb.toFixed(2)}x</td>
            <td class="score-cell ${getScoreClass(a.liftScores.str)}">${a.liftScores.str}</td>
        </tr>`;
    });
    const sortedP = [...athletes].sort((a,b) => (b.liftScores?.pwr||0) - (a.liftScores?.pwr||0));
    sortedP.forEach(a => {
        pwrHtml += `<tr>
            <td style="font-weight:600;">${a.name}</td>
            <td>${a.lifts.dbPwr.toFixed(1)}</td>
            <td>${a.lifts.hc.toFixed(2)}x</td>
            <td class="score-cell ${getScoreClass(a.liftScores.pwr)}">${a.liftScores.pwr}</td>
        </tr>`;
    });
    document.getElementById('liftStrBody').innerHTML = strHtml;
    document.getElementById('liftPwrBody').innerHTML = pwrHtml;
}""",
        """function renderLiftTables() {
    const sorted = [...athletes].sort((a,b) => (b.cmj||0) - (a.cmj||0));
    let strHtml = '', pwrHtml = '';
    sorted.forEach(a => {
        const best = Math.max(a.cmj||0, a.dj||0);
        strHtml += `<tr>
            <td style="font-weight:600;">${a.name}</td>
            <td>${a.cmj != null ? a.cmj.toFixed(1)+'"' : '—'}</td>
            <td>${a.dj != null ? a.dj.toFixed(1)+'"' : '—'}</td>
            <td>${best > 0 ? best.toFixed(1)+'"' : '—'}</td>
        </tr>`;
    });
    const sortedP = [...athletes].sort((a,b) => (b.rsi||0) - (a.rsi||0));
    sortedP.forEach(a => {
        pwrHtml += `<tr>
            <td style="font-weight:600;">${a.name}</td>
            <td>${a.rsi != null ? a.rsi.toFixed(3) : '—'}</td>
            <td>${a.mrsi != null ? a.mrsi.toFixed(3) : '—'}</td>
            <td>${a.tov != null ? a.tov.toFixed(2) : '—'}</td>
        </tr>`;
    });
    document.getElementById('liftStrBody').innerHTML = strHtml;
    document.getElementById('liftPwrBody').innerHTML = pwrHtml;
}""",
    )

    # Scatter: CMJ vs engine avg
    html = html.replace(
        """        const x = a.liftScores ? a.liftScores.str : 50;
        const yStr = a.maxStr !== null ? a.maxStr : Math.round((a.react + a.ecc)/2);
        // Plot power cluster: x = liftScores.pwr, y = propulsion
        const xPwr = a.liftScores ? a.liftScores.pwr : 50;
        const yPwr = a.prop;

        // Strength dot (circle)
        const dot1 = document.createElement('div');
        dot1.className = 'scatter-dot';
        dot1.style.left = (x) + '%';
        dot1.style.bottom = (yStr) + '%';
        dot1.style.background = colors[i % colors.length];
        dot1.innerHTML = `<div class="dot-label">${a.name.split(' ')[0]} · STR (Lift:${x} → Engine:${yStr})</div>`;
        grid.appendChild(dot1);

        // Power dot (smaller, with ring)
        const dot2 = document.createElement('div');
        dot2.className = 'scatter-dot';
        dot2.style.left = xPwr + '%';
        dot2.style.bottom = yPwr + '%';
        dot2.style.background = 'transparent';
        dot2.style.borderColor = colors[i % colors.length];
        dot2.style.borderWidth = '3px';
        dot2.innerHTML = `<div class="dot-label">${a.name.split(' ')[0]} · PWR (Lift:${xPwr} → Engine:${yPwr})</div>`;
        grid.appendChild(dot2);""",
        """        const x = a.cmj != null ? Math.min(100, Math.max(0, a.cmj * 4)) : 0;
        const yE = engineAvg(a) != null ? engineAvg(a) : 0;
        const dot1 = document.createElement('div');
        dot1.className = 'scatter-dot';
        dot1.style.left = (x) + '%';
        dot1.style.bottom = (yE) + '%';
        dot1.style.background = colors[i % colors.length];
        dot1.innerHTML = `<div class="dot-label">${a.name.split(' ')[0]} · CMJ→Engine (${a.cmj != null ? a.cmj : '—'} / ${yE})</div>`;
        grid.appendChild(dot1);""",
    )

    # Team averages: drop lift scores, add mrsi/rsi
    html = html.replace(
        """    // Add lift scores
    metrics.push({key:'liftStr', label:'Lift Str Score', unit:'', dec:0});
    metrics.push({key:'liftPwr', label:'Lift Pwr Score', unit:'', dec:0});

    let html = '';
    metrics.forEach(m => {
        let vals;
        if (m.key === 'liftStr') vals = athletes.map(a => a.liftScores?.str).filter(v => v != null);
        else if (m.key === 'liftPwr') vals = athletes.map(a => a.liftScores?.pwr).filter(v => v != null);
        else vals = athletes.map(a => a[m.key]).filter(v => v !== null && v !== undefined);""",
        """    metrics.push({key:'mrsi', label:'mRSI (CMJ)', unit:'', dec:3});
    metrics.push({key:'rsi', label:'RSI (DJ)', unit:'', dec:3});

    let html = '';
    metrics.forEach(m => {
        let vals;
        vals = athletes.map(a => a[m.key]).filter(v => v !== null && v !== undefined);""",
    )

    # Banner stats: handle null aj
    html = html.replace(
        """    const ajs = athletes.map(a=>a.aj).filter(v=>v);
    const cmjs = athletes.map(a=>a.cmj).filter(v=>v);
    const engs = athletes.map(a=>engineAvg(a)).filter(v=>v!==null);
    const html = `
        <div class="banner-stat"><div class="banner-stat-val">${Math.max(...ajs).toFixed(1)}"</div><div class="banner-stat-label">Best AJ Vert</div></div>
        <div class="banner-stat"><div class="banner-stat-val">${(ajs.reduce((s,v)=>s+v,0)/ajs.length).toFixed(1)}"</div><div class="banner-stat-label">Team Avg AJ</div></div>
        <div class="banner-stat"><div class="banner-stat-val">${Math.max(...cmjs).toFixed(1)}"</div><div class="banner-stat-label">Best CMJ</div></div>
        <div class="banner-stat"><div class="banner-stat-val">${Math.round(engs.reduce((s,v)=>s+v,0)/engs.length)}</div><div class="banner-stat-label">Avg Engine Score</div></div>
        <div class="banner-stat"><div class="banner-stat-val">${athletes.filter(a=>getFlags(a).some(f=>f.type==='red')).length}</div><div class="banner-stat-label">Red Flags</div></div>
    `;""",
        """    const ajs = athletes.map(a=>a.aj).filter(v=>v!=null);
    const cmjs = athletes.map(a=>a.cmj).filter(v=>v!=null);
    const engs = athletes.map(a=>engineAvg(a)).filter(v=>v!==null);
    const html = `
        <div class="banner-stat"><div class="banner-stat-val">${ajs.length ? Math.max(...ajs).toFixed(1)+'"' : '—'}</div><div class="banner-stat-label">Best AJ Vert</div></div>
        <div class="banner-stat"><div class="banner-stat-val">${ajs.length ? (ajs.reduce((s,v)=>s+v,0)/ajs.length).toFixed(1)+'"' : '—'}</div><div class="banner-stat-label">Team Avg AJ</div></div>
        <div class="banner-stat"><div class="banner-stat-val">${cmjs.length ? Math.max(...cmjs).toFixed(1)+'"' : '—'}</div><div class="banner-stat-label">Best CMJ</div></div>
        <div class="banner-stat"><div class="banner-stat-val">${engs.length ? Math.round(engs.reduce((s,v)=>s+v,0)/engs.length) : '—'}</div><div class="banner-stat-label">Avg Engine Score</div></div>
        <div class="banner-stat"><div class="banner-stat-val">${athletes.filter(a=>getFlags(a).some(f=>f.type==='red')).length}</div><div class="banner-stat-label">Red Flags</div></div>
    `;""",
    )

    html = html.replace(
        """                    <div class="drill-metric"><span class="drill-metric-label">Approach Jump</span><span class="drill-metric-val">${a.aj}"</span></div>
                    <div class="drill-metric"><span class="drill-metric-label">Touch Height</span><span class="drill-metric-val">${a.touch}</span></div>
                    <div class="drill-metric"><span class="drill-metric-label">Standing Reach</span><span class="drill-metric-val">${a.reach}</span></div>
                    <div class="drill-metric"><span class="drill-metric-label">CMJ Height</span><span class="drill-metric-val">${a.cmj}"</span></div>
                    <div class="drill-metric"><span class="drill-metric-label">DJ Height</span><span class="drill-metric-val">${a.dj}"</span></div>
                    <div class="drill-metric"><span class="drill-metric-label">Takeoff Velocity</span><span class="drill-metric-val">${a.tov} m/s</span></div>""",
        """                    <div class="drill-metric"><span class="drill-metric-label">Approach Jump</span><span class="drill-metric-val">${a.aj != null ? a.aj+'\\"' : '—'}</span></div>
                    <div class="drill-metric"><span class="drill-metric-label">Touch Height</span><span class="drill-metric-val">${a.touch}</span></div>
                    <div class="drill-metric"><span class="drill-metric-label">Standing Reach</span><span class="drill-metric-val">${a.reach}</span></div>
                    <div class="drill-metric"><span class="drill-metric-label">CMJ Height</span><span class="drill-metric-val">${a.cmj != null ? a.cmj+'\\"' : '—'}</span></div>
                    <div class="drill-metric"><span class="drill-metric-label">DJ Height</span><span class="drill-metric-val">${a.dj != null ? a.dj+'\\"' : '—'}</span></div>
                    <div class="drill-metric"><span class="drill-metric-label">Takeoff Velocity</span><span class="drill-metric-val">${a.tov != null ? a.tov.toFixed(2)+' m/s' : '—'}</span></div>""",
    )

    html = html.replace(
        """        const color = getLevelColor(getLevel(Math.round(avg)));
        html += `<div class="avg-card">
            <div class="avg-card-label">${m.label}</div>
            <div class="avg-card-val" style="color:${m.unit?'var(--accent-blue)':color};">${avg.toFixed(m.dec)}${m.unit}</div>""",
        """        const color = (m.key === 'mrsi' || m.key === 'rsi' || m.unit) ? 'var(--accent-blue)' : getLevelColor(getLevel(Math.round(avg)));
        html += `<div class="avg-card">
            <div class="avg-card-label">${m.label}</div>
            <div class="avg-card-val" style="color:${color};">${avg.toFixed(m.dec)}${m.unit}</div>""",
    )

    html = html.replace(
        """// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════
renderBannerStats();""",
        """// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════
(function populateTeamFilter() {
    const sel = document.getElementById('teamFilter');
    const teams = [...new Set(athletes.map(a => a.team).filter(Boolean))].sort();
    teams.forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; sel.appendChild(o); });
})();
renderBannerStats();""",
    )

    return html


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--reports",
        type=Path,
        default=Path(
            "/Users/thomaslam/Library/CloudStorage/OneDrive-Personal/18.ISDS/1.4 GUIDES/ADS GUIDES/FITS ADS/X9 - JUMP METRICS/reports"
        ),
    )
    ap.add_argument(
        "--template",
        type=Path,
        default=Path(
            "/Users/thomaslam/Library/CloudStorage/OneDrive-Personal/18.ISDS/1.4 GUIDES/ADS GUIDES/FITS ADS/X1 - VISUALIZATIONS IN DEVELOPMENT/VISUALIZATIONS IN DEVELOPMENT/Flight_School_Coach_Team_Report.html"
        ),
    )
    ap.add_argument(
        "-o",
        "--output",
        type=Path,
        default=_repo_root() / "Coach_Team_Jump_Metric_Dashboard.html",
    )
    ap.add_argument(
        "--exclude-sample",
        action="store_true",
        help="Omit Sample_Athlete_* reports from the roster",
    )
    args = ap.parse_args()
    exclude = args.exclude_sample

    raw = parse_reports(args.reports, exclude)
    bundle = {
        "meta": raw["meta"],
        "athletes": to_dashboard_athletes(raw),
    }
    template = args.template.read_text(encoding="utf-8", errors="replace")
    out = patch_template(template, bundle)
    args.output.write_text(out, encoding="utf-8")
    print(f"Wrote {args.output} ({bundle['meta']['reportCount']} athletes)")


if __name__ == "__main__":
    main()
