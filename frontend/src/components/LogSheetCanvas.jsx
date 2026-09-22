import React, { useRef, useEffect } from 'react';

export const LOG_SHEET_WIDTH = 1100;
export const LOG_SHEET_HEIGHT = 850;

/**
 * Shared canvas drawing logic for FMCSA Driver's Daily Log (RODS).
 * Used for both live canvas rendering in the browser and high-res PDF/PNG exports.
 */
export function drawLogSheet(ctx, W, H, dailyLog, dateStr = '') {
  const PAD = 20;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // ── 1. Header Title & Form Info ──────────────────────────────────────────
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillText("Driver's Daily Log", PAD, 27);
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText('(24 hours)', PAD + 175, 27);

  // Date Section
  const dateX = 380;
  let monthStr = '', dayStr = '', yearStr = '';
  if (dateStr && dateStr.includes('/')) {
    const parts = dateStr.split('/');
    monthStr = (parts[0] || '').trim();
    dayStr   = (parts[1] || '').trim();
    yearStr  = (parts[2] || '').trim();
  }
  ctx.font = '9px Arial, sans-serif';
  ctx.fillStyle = '#555555';
  ctx.fillText('(month)', dateX, 14);
  ctx.fillText('(day)',   dateX + 72, 14);
  ctx.fillText('(year)',  dateX + 132, 14);

  ctx.strokeStyle = '#888888';
  ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(dateX, 28); ctx.lineTo(dateX + 62, 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(dateX + 72, 28); ctx.lineTo(dateX + 122, 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(dateX + 132, 28); ctx.lineTo(dateX + 192, 28); ctx.stroke();

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 12px Arial, sans-serif';
  if (monthStr) {
    ctx.fillText(monthStr, dateX + 12, 25);
    ctx.fillText(dayStr,   dateX + 82, 25);
    ctx.fillText(yearStr,  dateX + 140, 25);
  } else {
    ctx.fillText(dateStr || '', dateX + 12, 25);
  }

  // Right compliance notices
  ctx.font = '8.5px Arial, sans-serif';
  ctx.fillStyle = '#333333';
  ctx.fillText('Original - File at home terminal.', 640, 16);
  ctx.fillText('Duplicate - Driver retains in his/her possession for 8 days.', 640, 28);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(PAD, 35); ctx.lineTo(W - PAD, 35); ctx.stroke();

  // ── 2. From / To Locations ───────────────────────────────────────────────
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.fillText('From:', PAD, 52);
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText(dailyLog.from_location || '', PAD + 44, 52);

  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.fillText('To:', 440, 52);
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText(dailyLog.to_location || '', 460, 52);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(PAD + 42, 55); ctx.lineTo(435, 55); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(457, 55); ctx.lineTo(W - PAD, 55); ctx.stroke();

  // ── 3. Header Mileage & Carrier Boxes ───────────────────────────────────
  const bY = 63;
  const bH = 40;

  // Miles Driving Today
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(PAD, bY, 128, bH);
  ctx.font = '8.5px Arial, sans-serif';
  ctx.fillText('Total Miles Driving Today', PAD + 3, bY + 12);
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText(`${dailyLog.total_miles_today || 0} mi`, PAD + 3, bY + 32);

  // Total Mileage Today
  ctx.strokeRect(PAD + 136, bY, 128, bH);
  ctx.font = '8.5px Arial, sans-serif';
  ctx.fillText('Total Mileage Today', PAD + 139, bY + 12);
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText(`${dailyLog.total_miles_trip || 0} mi`, PAD + 139, bY + 32);

  // Truck / Tractor Numbers
  ctx.strokeRect(PAD, bY + bH + 3, 264, 42);
  ctx.font = '8px Arial, sans-serif';
  ctx.fillStyle = '#555555';
  ctx.fillText('Truck/Tractor and Trailer Numbers or', PAD + 3, bY + bH + 14);
  ctx.fillText('License Plate(s)/State (show each unit)', PAD + 3, bY + bH + 24);
  ctx.strokeStyle = '#dddddd';
  ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(PAD + 1, bY + bH + 28); ctx.lineTo(PAD + 263, bY + bH + 28); ctx.stroke();
  ctx.font = 'bold 11.5px Arial, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(dailyLog.truck_number || 'TRK-709 / TRL-402', PAD + 6, bY + bH + 40);

  // Carrier Information
  const cX = 305;
  ctx.font = '8.5px Arial, sans-serif';
  ctx.fillStyle = '#333333';
  ctx.fillText('Name of Carrier or Carriers', cX, bY + 10);
  ctx.strokeStyle = '#bbbbbb';
  ctx.beginPath(); ctx.moveTo(cX, bY + 12); ctx.lineTo(W - PAD, bY + 12); ctx.stroke();
  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(dailyLog.carrier_name || 'Apex Freight Logistics', cX + 2, bY + 25);

  ctx.font = '8.5px Arial, sans-serif';
  ctx.fillStyle = '#333333';
  ctx.fillText('Main Office Address', cX, bY + 40);
  ctx.strokeStyle = '#bbbbbb';
  ctx.beginPath(); ctx.moveTo(cX, bY + 42); ctx.lineTo(W - PAD, bY + 42); ctx.stroke();
  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText('100 Logistics Way, Chicago, IL 60601', cX + 2, bY + 56);

  ctx.font = '8.5px Arial, sans-serif';
  ctx.fillStyle = '#333333';
  ctx.fillText('Home Terminal Address', cX, bY + 68);
  ctx.strokeStyle = '#bbbbbb';
  ctx.beginPath(); ctx.moveTo(cX, bY + 70); ctx.lineTo(W - PAD, bY + 70); ctx.stroke();
  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(dailyLog.home_terminal || 'Chicago, IL', cX + 2, bY + 83);

  // ── 4. 24-Hour Graph Grid ────────────────────────────────────────────────
  const lblW = 160;
  const gX   = PAD + lblW;
  const gY   = 170;
  const gW   = W - PAD - gX - 70;
  const rowH = 34;
  const hdrH = 28;

  // Header band
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(gX, gY, gW + 70, hdrH);

  // Hour labels
  ctx.fillStyle = '#FFFFFF';
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

  // Total Hours column header
  ctx.textAlign = 'center';
  ctx.font = 'bold 8px Arial, sans-serif';
  ctx.fillText('Total', gX + gW + 35, gY + 11);
  ctx.fillText('Hours', gX + gW + 35, gY + 21);
  ctx.textAlign = 'left';

  // Rows for Duty Statuses
  const rowLabels = ['1. Off Duty', '2. Sleeper\n   Berth', '3. Driving', '4. On Duty\n(not driving)'];
  const totals = dailyLog.totals || {};
  const totalValues = [totals.off_duty || 0, totals.sleeper_berth || 0, totals.driving || 0, totals.on_duty || 0];

  ctx.strokeStyle = '#000000';
  for (let r = 0; r < 4; r++) {
    const y = gY + hdrH + r * rowH;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(gX, y, gW, rowH);
    ctx.strokeRect(gX + gW, y, 70, rowH);

    ctx.fillStyle = '#000000';
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

  // 15-Minute Ticks
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
      ctx.strokeStyle = isHour ? '#444444' : isHalf ? '#999999' : '#cccccc';
      ctx.lineWidth = isHour ? 0.9 : 0.5;
      ctx.stroke();
    }
  }

  // Duty Step Line (Red line showing driver activity)
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

      if (x1 > curX + 0.5) {
        ctx.lineTo(x1, curY);
      }
      if (Math.abs(curY - y) > 1) {
        ctx.lineTo(x1, curY);
        ctx.lineTo(x1, y);
      }
      ctx.lineTo(x2, y);
      curX = x2;
      curY = y;
    });

    if (curX < gX + gW) {
      ctx.lineTo(gX + gW, curY);
    }
    ctx.stroke();
  }

  // ── 5. Remarks & Shipping Documents (Left Column) ────────────────────────
  const rmY = gY + hdrH + 4 * rowH + 16;
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillText('Remarks', PAD, rmY + 14);
  ctx.font = '8.5px Arial, sans-serif';
  ctx.fillStyle = '#333333';
  ctx.fillText('Enter name of place you reported and where released from work and when and where each change of duty occurred.', PAD, rmY + 27);
  ctx.fillText('Use time standard of home terminal.', PAD, rmY + 37);

  const remarks = dailyLog.remarks || [];
  const rmBoxW = 570;
  const remarkLineH = 15;
  const remarkPadTop = 14;
  const maxVisibleRemarks = 9;
  const visibleRemarks = remarks.slice(0, maxVisibleRemarks);
  const overflowed = remarks.length > maxVisibleRemarks;
  const rmBoxH = Math.max(75, visibleRemarks.length * remarkLineH + remarkPadTop + 8);

  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 0.7;
  ctx.strokeRect(PAD, rmY + 44, rmBoxW, rmBoxH);

  ctx.font = '9px Arial, sans-serif';
  ctx.fillStyle = '#000000';
  visibleRemarks.forEach((rem, idx) => {
    ctx.fillText(`${rem.time}  ${rem.location}  —  ${rem.description}`, PAD + 6, rmY + 44 + remarkPadTop + idx * remarkLineH);
  });
  if (overflowed) {
    ctx.font = 'italic 8px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText(`... ${remarks.length - maxVisibleRemarks} more entries (see subsequent log sheets)`, PAD + 6, rmY + 44 + remarkPadTop + maxVisibleRemarks * remarkLineH);
  }

  // Shipping Documents — ALWAYS placed below dynamic rmBoxH
  const sdY = rmY + 44 + rmBoxH + 14;
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText('Shipping Documents:', PAD, sdY);
  ctx.font = '9px Arial, sans-serif';
  ctx.fillText('DVL or Manifest No.', PAD, sdY + 16);
  ctx.fillText('or', PAD, sdY + 28);
  ctx.fillText('Shipper & Commodity', PAD, sdY + 40);

  ctx.strokeStyle = '#888888';
  ctx.beginPath(); ctx.moveTo(PAD + 118, sdY + 18); ctx.lineTo(PAD + 310, sdY + 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(PAD + 118, sdY + 42); ctx.lineTo(PAD + 310, sdY + 42); ctx.stroke();

  // ── 6. 70-Hour / 8-Day Recap Box (Right Column) ──────────────────────────
  const recap = dailyLog.recap || {};
  const rcX = 608;
  const rcY = rmY + 44;
  const rcW = W - PAD - rcX; // ~472px width
  const rcH = 224;

  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(rcX, rcY, rcW, rcH);

  // Recap header band
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(rcX + 1, rcY + 1, rcW - 2, 22);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 9.5px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Recap: Complete at end of day', rcX + 8, rcY + 15);

  // Top Section: 70 Hour / 8 Day Drivers + 3 Columns
  const sec70X = rcX + 8;
  const sec70Y = rcY + 32;

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 9px Arial, sans-serif';
  ctx.fillText('70 Hour / 8 Day', sec70X, sec70Y);
  ctx.fillText('Drivers', sec70X, sec70Y + 12);

  // 3 Columns A, B, C evenly spaced across the right 330px
  const colAreaStart = rcX + 130;
  const colSpacing = (rcW - 140) / 3; // ~110px per column
  const colAx = colAreaStart + colSpacing * 0.5;
  const colBx = colAreaStart + colSpacing * 1.5;
  const colCx = colAreaStart + colSpacing * 2.5;

  const colHeaders = [
    { cx: colAx, letter: 'A.', lines: ['Total on-duty hrs', 'last 7 days', 'incl. today'] },
    { cx: colBx, letter: 'B.', lines: ['Total hrs avail.', 'tomorrow', '(70 minus A)'] },
    { cx: colCx, letter: 'C.', lines: ['Total on-duty hrs', 'last 8 days', 'incl. today'] },
  ];

  colHeaders.forEach(({ cx, letter, lines }) => {
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText(letter, cx, sec70Y);

    ctx.font = '8px Arial, sans-serif';
    ctx.fillStyle = '#333333';
    lines.forEach((line, li) => {
      ctx.fillText(line, cx, sec70Y + 11 + li * 10);
    });
  });

  // Dividing line across Recap box
  const divY = sec70Y + 46;
  ctx.strokeStyle = '#888888';
  ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(rcX + 1, divY); ctx.lineTo(rcX + rcW - 1, divY); ctx.stroke();

  // "On duty hours today" label
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  ctx.font = '9px Arial, sans-serif';
  ctx.fillText('On duty hours today', sec70X, divY + 15);
  ctx.fillText('(lines 3 & 4):', sec70X, divY + 27);

  // Recap Value Boxes (Centered directly beneath columns A, B, C)
  const valY = divY + 7;
  const valH = 28;
  const valW = 66;

  const onDutyToday = recap.on_duty_today || 0;
  const totalLast7  = recap.total_last_7_days || 0;
  const available   = recap.available_tomorrow || 0;
  const aVal = parseFloat(totalLast7).toFixed(1);
  const bVal = parseFloat(available).toFixed(1);
  const cVal = parseFloat(totalLast7).toFixed(1);

  const boxConfigs = [
    { cx: colAx, val: aVal },
    { cx: colBx, val: bVal },
    { cx: colCx, val: cVal },
  ];

  boxConfigs.forEach(({ cx, val }) => {
    const boxX = cx - valW / 2;
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(boxX, valY, valW, valH);

    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(val, cx, valY + 18);
  });

  // Recap Detailed Summary Breakdown List
  const infoY = valY + valH + 16;
  ctx.textAlign = 'left';
  ctx.font = '9px Arial, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(`A.  On duty hours today:  ${parseFloat(onDutyToday).toFixed(1)} hrs`, sec70X, infoY);
  ctx.fillText(`B.  Available tomorrow:  ${bVal} hrs`, sec70X, infoY + 16);
  ctx.fillText(`C.  Total on-duty last 7/8 days:  ${aVal} hrs`, sec70X, infoY + 32);

  // Footnote
  ctx.font = 'italic 8px Arial, sans-serif';
  ctx.fillStyle = '#555555';
  ctx.fillText('*If you took 34 consecutive hours off duty, you have 70 hours available.', sec70X, infoY + 52);

  // ── 7. Signatures Line ───────────────────────────────────────────────────
  const sigY = H - 25;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(PAD, sigY); ctx.lineTo(430, sigY); ctx.stroke();
  ctx.fillStyle = '#000000';
  ctx.font = '9.5px Arial, sans-serif';
  ctx.fillText("Driver's Signature", PAD, sigY + 14);

  ctx.beginPath(); ctx.moveTo(450, sigY); ctx.lineTo(W - PAD, sigY); ctx.stroke();
  ctx.fillText('Co-Driver (if applicable)', 450, sigY + 14);
}

export default function LogSheetCanvas({ dailyLog, dateStr = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!dailyLog || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const W = LOG_SHEET_WIDTH;
    const H = LOG_SHEET_HEIGHT;
    canvas.width = W * 2;
    canvas.height = H * 2;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(2, 2);

    drawLogSheet(ctx, W, H, dailyLog, dateStr);
  }, [dailyLog, dateStr]);

  return (
    <div className="canvas-wrapper">
      <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }} />
    </div>
  );
}
