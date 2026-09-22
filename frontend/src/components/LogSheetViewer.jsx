import React, { useState } from 'react';
import LogSheetCanvas from './LogSheetCanvas';
import { Download, FileText, Calendar, Table, Eye, BookOpen } from 'lucide-react';
import jsPDF from 'jspdf';

export default function LogSheetViewer({ dailyLogs = [] }) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' or 'table'
  const [exportingAll, setExportingAll] = useState(false);

  if (!dailyLogs || dailyLogs.length === 0) return null;

  const currentLog = dailyLogs[selectedDayIndex] || dailyLogs[0];

  const handleDownloadPNG = () => {
    const canvas = document.querySelector('.canvas-wrapper canvas');
    if (!canvas) return;
    const imageURI = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `FMCSA_Driver_Log_Day_${currentLog.day_number}.png`;
    link.href = imageURI;
    link.click();
  };

  const handleDownloadPDF = () => {
    const canvas = document.querySelector('.canvas-wrapper canvas');
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`FMCSA_Driver_Log_Day_${currentLog.day_number}.pdf`);
  };

  // Renders each day log to an off-screen canvas and exports all pages as one PDF
  const handleDownloadAllPDF = async () => {
    setExportingAll(true);
    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < dailyLogs.length; i++) {
        const log = dailyLogs[i];

        // Build date string for this day
        const base = new Date();
        const logDate = new Date(base);
        logDate.setDate(logDate.getDate() + i);
        const mm = String(logDate.getMonth() + 1).padStart(2, '0');
        const dd = String(logDate.getDate()).padStart(2, '0');
        const yyyy = logDate.getFullYear();
        const dateStr = `${mm} / ${dd} / ${yyyy}`;

        // Render to an off-screen canvas using the same logic as LogSheetCanvas
        const imgData = await renderLogToDataURL(log, dateStr);

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      }

      pdf.save(`FMCSA_Driver_Log_All_Days.pdf`);
    } finally {
      setExportingAll(false);
    }
  };

  return (
    <div>
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font)', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            <FileText size={15} style={{ color: 'var(--ink-3)' }} />
            ELD Daily Log Sheets
            <span style={{ fontWeight: 400, color: 'var(--ink-3)', textTransform: 'none', letterSpacing: 0 }}>({dailyLogs.length} {dailyLogs.length === 1 ? 'sheet' : 'sheets'})</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--ink-3)', marginTop: 2, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            24-Hour Record of Duty Status (RODS)
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => setViewMode(viewMode === 'canvas' ? 'table' : 'canvas')}>
            {viewMode === 'canvas' ? <Table style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
            {viewMode === 'canvas' ? 'Table View' : 'Log Sheet View'}
          </button>
          <button className="btn-secondary" onClick={handleDownloadPNG}>
            <Download style={{ width: 16, height: 16 }} />
            PNG
          </button>
          <button className="btn-secondary" onClick={handleDownloadPDF}>
            <Download style={{ width: 16, height: 16 }} />
            PDF (This Day)
          </button>
          <button className="btn-primary" onClick={handleDownloadAllPDF} disabled={exportingAll}>
            <BookOpen style={{ width: 16, height: 16 }} />
            {exportingAll ? 'Generating...' : `PDF All ${dailyLogs.length} Days`}
          </button>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="tabs-header" style={{ paddingLeft: 20, paddingRight: 20 }}>
        {dailyLogs.map((log, idx) => (
          <button
            key={idx}
            className={`tab-btn ${selectedDayIndex === idx ? 'active' : ''}`}
            onClick={() => setSelectedDayIndex(idx)}
          >
            <Calendar style={{ width: 14, height: 14, marginRight: 6 }} />
            Day {log.day_number} · {log.totals.driving}h driving · {(log.totals.driving + log.totals.on_duty).toFixed(1)}h on-duty
          </button>
        ))}
      </div>

      {/* Main View Area */}
      {viewMode === 'canvas' ? (
        (() => {
          const base = new Date();
          const logDate = new Date(base);
          logDate.setDate(logDate.getDate() + (currentLog.day_number - 1));
          const mm = String(logDate.getMonth() + 1).padStart(2, '0');
          const dd = String(logDate.getDate()).padStart(2, '0');
          const yyyy = logDate.getFullYear();
          const dateStr = `${mm} / ${dd} / ${yyyy}`;
            return <div style={{ padding: '12px 20px' }}><LogSheetCanvas dailyLog={currentLog} dateStr={dateStr} /></div>;
        })()
      ) : (
        <div style={{ overflowX: 'auto', padding: '12px 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Time Window</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Duty Status</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Duration</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Location</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {currentLog.intervals.map((inv, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: '#0284C7', fontWeight: 600 }}>
                    {inv.start_time_str} - {inv.end_time_str}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                    <span className={`badge ${
                      inv.duty_code === 3 ? 'badge-info' :
                      inv.duty_code === 4 ? 'badge-warning' : 'badge-success'
                    }`}>
                      {inv.duty_name}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-main)' }}>{inv.duration_hours} hrs</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{inv.location}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{inv.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Off-screen renderer — mirrors LogSheetCanvas draw logic ─────────────────
// Renders a dailyLog to a data URL without mounting a React component,
// so we can generate all days sequentially for the multi-page PDF export.
function renderLogToDataURL(dailyLog, dateStr) {
  return new Promise((resolve) => {
    const W = 1100;
    const H = 860;
    const canvas = document.createElement('canvas');
    canvas.width = W * 2;
    canvas.height = H * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    // Import the draw function from LogSheetCanvas by re-using the same canvas element trick:
    // We render the visible LogSheetCanvas for this day, grab its data, then resolve.
    // Simplest approach: re-use the existing LogSheetCanvas render by temporarily mounting it.
    // Since we can't do that here synchronously, we clone the draw logic inline.
    // (The draw code is duplicated from LogSheetCanvas.jsx for off-screen use.)

    drawLogSheet(ctx, W, H, dailyLog, dateStr);
    resolve(canvas.toDataURL('image/png'));
  });
}

// Shared draw function (keeps LogSheetCanvas.jsx as the source of truth for the visible canvas;
// this mirrors it for off-screen/export use). Keep in sync with LogSheetCanvas.jsx.
function drawLogSheet(ctx, W, H, dailyLog, dateStr) {
  const PAD = 20;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = '#000';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillText("Driver's Daily Log", PAD, 27);
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText('(24 hours)', PAD + 175, 27);

  // Date
  const dateX = 380;
  let monthStr = '', dayStr = '', yearStr = '';
  if (dateStr && dateStr.includes('/')) {
    const parts = dateStr.split('/');
    monthStr = (parts[0] || '').trim();
    dayStr   = (parts[1] || '').trim();
    yearStr  = (parts[2] || '').trim();
  }
  ctx.font = '9px Arial, sans-serif';
  ctx.fillStyle = '#555';
  ctx.fillText('(month)', dateX, 14);
  ctx.fillText('(day)',   dateX + 72, 14);
  ctx.fillText('(year)',  dateX + 132, 14);
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(dateX, 28); ctx.lineTo(dateX + 62, 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(dateX + 72, 28); ctx.lineTo(dateX + 122, 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(dateX + 132, 28); ctx.lineTo(dateX + 192, 28); ctx.stroke();
  ctx.fillStyle = '#000';
  ctx.font = 'bold 12px Arial, sans-serif';
  if (monthStr) {
    ctx.fillText(monthStr, dateX + 12, 25);
    ctx.fillText(dayStr,   dateX + 82, 25);
    ctx.fillText(yearStr,  dateX + 140, 25);
  } else {
    ctx.fillText(dateStr || '', dateX + 12, 25);
  }

  ctx.font = '8.5px Arial, sans-serif';
  ctx.fillStyle = '#333';
  ctx.fillText('Original - File at home terminal.', 640, 16);
  ctx.fillText('Duplicate - Driver retains in his/her possession for 8 days.', 640, 28);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(PAD, 35); ctx.lineTo(W - PAD, 35); ctx.stroke();

  // From / To
  ctx.fillStyle = '#000';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.fillText('From:', PAD, 52);
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText(dailyLog.from_location || '', PAD + 44, 52);
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.fillText('To:', 440, 52);
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText(dailyLog.to_location || '', 460, 52);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(PAD + 42, 55); ctx.lineTo(435, 55); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(457, 55); ctx.lineTo(W - PAD, 55); ctx.stroke();

  // Header boxes
  const bY = 63;
  const bH = 40;
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(PAD, bY, 128, bH);
  ctx.font = '8.5px Arial, sans-serif';
  ctx.fillText('Total Miles Driving Today', PAD + 3, bY + 12);
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText(`${dailyLog.total_miles_today || 0} mi`, PAD + 3, bY + 32);

  ctx.strokeRect(PAD + 136, bY, 128, bH);
  ctx.font = '8.5px Arial, sans-serif';
  ctx.fillText('Total Mileage Today', PAD + 139, bY + 12);
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText(`${dailyLog.total_miles_trip || 0} mi`, PAD + 139, bY + 32);

  ctx.strokeRect(PAD, bY + bH + 3, 264, 42);
  ctx.font = '8px Arial, sans-serif';
  ctx.fillStyle = '#555';
  ctx.fillText('Truck/Tractor and Trailer Numbers or', PAD + 3, bY + bH + 14);
  ctx.fillText('License Plate(s)/State (show each unit)', PAD + 3, bY + bH + 24);
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(PAD + 1, bY + bH + 28); ctx.lineTo(PAD + 263, bY + bH + 28); ctx.stroke();
  ctx.font = 'bold 11.5px Arial, sans-serif';
  ctx.fillStyle = '#000';
  ctx.fillText(dailyLog.truck_number || 'TRK-001', PAD + 6, bY + bH + 40);

  const cX = 305;
  ctx.font = '8.5px Arial, sans-serif';
  ctx.fillStyle = '#333';
  ctx.fillText('Name of Carrier or Carriers', cX, bY + 10);
  ctx.strokeStyle = '#bbb';
  ctx.beginPath(); ctx.moveTo(cX, bY + 12); ctx.lineTo(W - PAD, bY + 12); ctx.stroke();
  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = '#000';
  ctx.fillText(dailyLog.carrier_name || 'Apex Freight Logistics', cX + 2, bY + 25);
  ctx.font = '8.5px Arial, sans-serif';
  ctx.fillStyle = '#333';
  ctx.fillText('Main Office Address', cX, bY + 40);
  ctx.strokeStyle = '#bbb';
  ctx.beginPath(); ctx.moveTo(cX, bY + 42); ctx.lineTo(W - PAD, bY + 42); ctx.stroke();
  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = '#000';
  ctx.fillText('100 Logistics Way, Chicago, IL 60601', cX + 2, bY + 56);
  ctx.font = '8.5px Arial, sans-serif';
  ctx.fillStyle = '#333';
  ctx.fillText('Home Terminal Address', cX, bY + 68);
  ctx.strokeStyle = '#bbb';
  ctx.beginPath(); ctx.moveTo(cX, bY + 70); ctx.lineTo(W - PAD, bY + 70); ctx.stroke();
  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = '#000';
  ctx.fillText(dailyLog.home_terminal || 'Chicago, IL', cX + 2, bY + 83);

  // Graph Grid
  const lblW = 160;
  const gX   = PAD + lblW;
  const gY   = 170;
  const gW   = W - PAD - gX - 70;
  const rowH = 34;
  const hdrH = 28;

  ctx.fillStyle = '#0F172A';
  ctx.fillRect(gX, gY, gW + 70, hdrH);

  ctx.fillStyle = '#FFF';
  const hourLabels = [
    'Mid-\nnight','1','2','3','4','5','6','7','8','9','10','11',
    'Noon','1','2','3','4','5','6','7','8','9','10','11','Mid-\nnight'
  ];
  const colW = gW / 24;
  for (let i = 0; i <= 24; i++) {
    const x = gX + i * colW;
    const lbl = hourLabels[i] || '';
    if (i === 0)       ctx.textAlign = 'left';
    else if (i === 24) ctx.textAlign = 'right';
    else               ctx.textAlign = 'center';
    if (lbl.includes('\n')) {
      const [a, b] = lbl.split('\n');
      ctx.font = 'bold 7.5px Arial, sans-serif';
      const xOff = i === 24 ? x - 1 : (i === 0 ? x + 1 : x);
      ctx.fillText(a, xOff, gY + 10);
      ctx.fillText(b, xOff, gY + 20);
    } else {
      ctx.font = lbl === 'Noon' ? 'bold 8px Arial, sans-serif' : '8px Arial, sans-serif';
      ctx.fillText(lbl, x, gY + 18);
    }
  }
  ctx.textAlign = 'center';
  ctx.font = 'bold 8px Arial, sans-serif';
  ctx.fillText('Total', gX + gW + 35, gY + 11);
  ctx.fillText('Hours', gX + gW + 35, gY + 21);
  ctx.textAlign = 'left';

  const rowLabels = ['1. Off Duty', '2. Sleeper\n   Berth', '3. Driving', '4. On Duty\n(not driving)'];
  const totals = dailyLog.totals || {};
  const totalValues = [totals.off_duty || 0, totals.sleeper_berth || 0, totals.driving || 0, totals.on_duty || 0];

  ctx.strokeStyle = '#000';
  for (let r = 0; r < 4; r++) {
    const y = gY + hdrH + r * rowH;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(gX, y, gW, rowH);
    ctx.strokeRect(gX + gW, y, 70, rowH);
    ctx.fillStyle = '#000';
    const lbl = rowLabels[r];
    if (lbl.includes('\n')) {
      const [a, b] = lbl.split('\n');
      ctx.font = r === 3 ? '9.5px Arial, sans-serif' : 'bold 10px Arial, sans-serif';
      ctx.fillText(a, PAD, y + 14);
      ctx.font = '9.5px Arial, sans-serif';
      ctx.fillText(b, PAD, y + 26);
    } else {
      ctx.font = 'bold 10.5px Arial, sans-serif';
      ctx.fillText(lbl, PAD, y + 21);
    }
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${totalValues[r]}`, gX + gW + 35, y + rowH / 2 + 5);
    ctx.textAlign = 'left';
  }

  const pxPerMin = gW / 1440.0;
  for (let i = 0; i <= 96; i++) {
    const x = gX + i * (gW / 96);
    const isHour = i % 4 === 0;
    const isHalf = i % 2 === 0;
    for (let r = 0; r < 4; r++) {
      const y0 = gY + hdrH + r * rowH;
      const tickH = isHour ? rowH : isHalf ? rowH * 0.55 : rowH * 0.3;
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y0 + tickH);
      ctx.strokeStyle = isHour ? '#444' : isHalf ? '#999' : '#ccc';
      ctx.lineWidth = isHour ? 0.9 : 0.5;
      ctx.stroke();
    }
  }

  // Duty step line
  const intervals = dailyLog.intervals || [];
  if (intervals.length > 0) {
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    const rowCY = (code) => gY + hdrH + (code - 1) * rowH + rowH / 2;
    let curX = gX;
    let curY = rowCY(intervals[0].duty_code);
    ctx.moveTo(curX, curY);
    intervals.forEach((inv) => {
      const x1 = gX + inv.start_minute_of_day * pxPerMin;
      const x2 = gX + inv.end_minute_of_day * pxPerMin;
      const y  = rowCY(inv.duty_code);
      if (x1 > curX + 0.5) ctx.lineTo(x1, curY);
      if (Math.abs(curY - y) > 1) { ctx.lineTo(x1, curY); ctx.lineTo(x1, y); }
      ctx.lineTo(x2, y);
      curX = x2;
      curY = y;
    });
    if (curX < gX + gW) ctx.lineTo(gX + gW, curY);
    ctx.stroke();
  }

  // Remarks
  const rmY = gY + hdrH + 4 * rowH + 16;
  ctx.fillStyle = '#000';
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillText('Remarks', PAD, rmY + 14);
  ctx.font = '8.5px Arial, sans-serif';
  ctx.fillStyle = '#333';
  ctx.fillText('Enter name of place you reported and where released from work and when and where each change of duty occurred.', PAD, rmY + 27);
  ctx.fillText('Use time standard of home terminal.', PAD, rmY + 37);

  const rmBoxW = 580;
  const remarks = dailyLog.remarks || [];
  const remarkLineH = 16;
  const remarkPadTop = 16;
  const maxVisibleRemarks = 10;
  const visibleRemarks = remarks.slice(0, maxVisibleRemarks);
  const overflowed = remarks.length > maxVisibleRemarks;
  const rmBoxH = Math.max(80, visibleRemarks.length * remarkLineH + remarkPadTop + 10);

  ctx.strokeStyle = '#555';
  ctx.lineWidth = 0.7;
  ctx.strokeRect(PAD, rmY + 44, rmBoxW, rmBoxH);
  ctx.font = '9.5px Arial, sans-serif';
  ctx.fillStyle = '#000';
  visibleRemarks.forEach((rem, idx) => {
    ctx.fillText(`${rem.time}  ${rem.location}  —  ${rem.description}`, PAD + 6, rmY + 44 + remarkPadTop + idx * remarkLineH);
  });
  if (overflowed) {
    ctx.font = 'italic 8.5px Arial, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(`... ${remarks.length - maxVisibleRemarks} more entries (see subsequent log sheets)`, PAD + 6, rmY + 44 + remarkPadTop + maxVisibleRemarks * remarkLineH);
  }

  // Shipping Documents
  const sdY = rmY + 170;
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.fillStyle = '#000';
  ctx.fillText('Shipping Documents:', PAD, sdY);
  ctx.font = '9.5px Arial, sans-serif';
  ctx.fillText('DVL or Manifest No.', PAD, sdY + 16);
  ctx.fillText('or', PAD, sdY + 28);
  ctx.fillText('Shipper & Commodity', PAD, sdY + 40);
  ctx.strokeStyle = '#888';
  ctx.beginPath(); ctx.moveTo(PAD + 118, sdY + 18); ctx.lineTo(PAD + 310, sdY + 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(PAD + 118, sdY + 42); ctx.lineTo(PAD + 310, sdY + 42); ctx.stroke();

  // Recap
  const recap = dailyLog.recap || {};
  const rcX = 618;
  const rcY = rmY + 44;
  const rcW = W - PAD - rcX;
  const rcH = 230;

  ctx.strokeStyle = '#555';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(rcX, rcY, rcW, rcH);
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(rcX + 1, rcY + 1, rcW - 2, 22);
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 9px Arial, sans-serif';
  ctx.fillText('Recap: Complete at end of day', rcX + 6, rcY + 14);

  const sec70X = rcX + 6;
  const sec70Y = rcY + 30;
  ctx.fillStyle = '#000';
  ctx.font = 'bold 9px Arial, sans-serif';
  ctx.fillText('70 Hour / 8 Day Drivers', sec70X, sec70Y);

  const colAx = rcX + 130;
  const colBx = rcX + 200;
  const colCx = rcX + 270;

  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.fillStyle = '#000';
  ctx.fillText('A.', colAx, sec70Y);
  ctx.fillText('B.', colBx, sec70Y);
  ctx.fillText('C.', colCx, sec70Y);

  ctx.font = '8px Arial, sans-serif';
  ctx.fillStyle = '#333';
  const col_desc = [
    ['Total on-duty hrs', 'last 7 days', 'incl. today'],
    ['Total hrs avail.', 'tomorrow', '(70 minus A)'],
    ['Total on-duty hrs', 'last 7 days', 'incl. 70hr today']
  ];
  const cxs = [colAx, colBx, colCx];
  col_desc.forEach((lines, ci) => {
    lines.forEach((line, li) => {
      ctx.fillText(line, cxs[ci], sec70Y + 12 + li * 10);
    });
  });

  const divY = sec70Y + 46;
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(rcX + 1, divY); ctx.lineTo(rcX + rcW - 1, divY); ctx.stroke();

  ctx.fillStyle = '#000';
  ctx.font = '9px Arial, sans-serif';
  ctx.fillText('On duty hours today', sec70X, divY + 16);
  ctx.fillText('(lines 3 & 4):', sec70X, divY + 28);

  const valY = divY + 8;
  const valH = 28;
  const valW = 55;
  const onDutyToday = recap.on_duty_today || 0;
  const totalLast7  = recap.total_last_7_days || 0;
  const available   = recap.available_tomorrow || 0;
  const aVal = parseFloat(totalLast7).toFixed(1);
  const bVal = parseFloat(available).toFixed(1);
  const cVal = parseFloat(totalLast7).toFixed(1);

  const boxConfigs = [
    { x: colAx - 5, val: aVal },
    { x: colBx - 5, val: bVal },
    { x: colCx - 5, val: cVal }
  ];
  boxConfigs.forEach(({ x, val }) => {
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, valY, valW, valH);
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText(val, x + valW / 2, valY + 19);
    ctx.textAlign = 'left';
  });

  const infoY = valY + valH + 12;
  ctx.font = '9px Arial, sans-serif';
  ctx.fillStyle = '#000';
  ctx.fillText(`A.  On duty hours today:  ${onDutyToday} hrs`, sec70X, infoY);
  ctx.fillText(`B.  Available tomorrow:  ${bVal} hrs`, sec70X, infoY + 16);
  ctx.fillText(`C.  Total on-duty last 7 days:  ${aVal} hrs`, sec70X, infoY + 32);

  ctx.font = 'italic 8px Arial, sans-serif';
  ctx.fillStyle = '#555';
  ctx.fillText('*If you took 34 consecutive hours off duty,', sec70X, infoY + 54);
  ctx.fillText('you have 60/70 hours available.', sec70X, infoY + 65);

  // Signature
  const sigY = H - 22;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(PAD, sigY); ctx.lineTo(430, sigY); ctx.stroke();
  ctx.fillStyle = '#000';
  ctx.font = '9.5px Arial, sans-serif';
  ctx.fillText("Driver's Signature", PAD, sigY + 12);
  ctx.beginPath(); ctx.moveTo(450, sigY); ctx.lineTo(W - PAD, sigY); ctx.stroke();
  ctx.fillText('Co-Driver (if applicable)', 450, sigY + 12);
}
