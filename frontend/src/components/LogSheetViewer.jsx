import React, { useState } from 'react';
import LogSheetCanvas, {
  drawLogSheet,
  LOG_SHEET_WIDTH,
  LOG_SHEET_HEIGHT,
} from './LogSheetCanvas';
import { Download, FileText, Calendar, Table, Eye, BookOpen } from 'lucide-react';
import jsPDF from 'jspdf';

export default function LogSheetViewer({ dailyLogs = [] }) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' or 'table'
  const [exportingAll, setExportingAll] = useState(false);

  if (!dailyLogs || dailyLogs.length === 0) return null;

  const currentLog = dailyLogs[selectedDayIndex] || dailyLogs[0];

  const getDateStr = (dayNumber) => {
    const base = new Date();
    const logDate = new Date(base);
    logDate.setDate(logDate.getDate() + (dayNumber - 1));
    const mm = String(logDate.getMonth() + 1).padStart(2, '0');
    const dd = String(logDate.getDate()).padStart(2, '0');
    const yyyy = logDate.getFullYear();
    return `${mm} / ${dd} / ${yyyy}`;
  };

  const handleDownloadPNG = () => {
    const canvas = document.querySelector('.canvas-wrapper canvas');
    if (!canvas) return;
    const imageURI = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `FMCSA_Driver_Log_Day_${currentLog.day_number}.png`;
    link.href = imageURI;
    link.click();
  };

  const handleDownloadPDF = async () => {
    const dateStr = getDateStr(currentLog.day_number);
    const imgData = await renderLogToDataURL(currentLog, dateStr);

    const pdf = new jsPDF('landscape', 'mm', 'a4');
    addScaledImageToPDF(pdf, imgData);
    pdf.save(`FMCSA_Driver_Log_Day_${currentLog.day_number}.pdf`);
  };

  // Renders each day log to an off-screen canvas and exports all pages as one PDF
  const handleDownloadAllPDF = async () => {
    setExportingAll(true);
    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4');

      for (let i = 0; i < dailyLogs.length; i++) {
        const log = dailyLogs[i];
        const dateStr = getDateStr(log.day_number);
        const imgData = await renderLogToDataURL(log, dateStr);

        if (i > 0) pdf.addPage();
        addScaledImageToPDF(pdf, imgData);
      }

      pdf.save(`FMCSA_Driver_Log_All_Days.pdf`);
    } finally {
      setExportingAll(false);
    }
  };

  return (
    <div>
      {/* Header controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: 'var(--font)',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--ink)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            <FileText size={15} style={{ color: 'var(--ink-3)' }} />
            ELD Daily Log Sheets
            <span
              style={{
                fontWeight: 400,
                color: 'var(--ink-3)',
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              ({dailyLogs.length} {dailyLogs.length === 1 ? 'sheet' : 'sheets'})
            </span>
          </h2>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--ink-3)',
              marginTop: 2,
              fontWeight: 400,
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            24-Hour Record of Duty Status (RODS)
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={() => setViewMode(viewMode === 'canvas' ? 'table' : 'canvas')}
          >
            {viewMode === 'canvas' ? <Table style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
            {viewMode === 'canvas' ? 'Table View' : 'Log Sheet View'}
          </button>
          <button className="btn-secondary" onClick={handleDownloadPNG}>
            <Download style={{ width: 15, height: 15 }} />
            PNG
          </button>
          <button className="btn-secondary" onClick={handleDownloadPDF}>
            <Download style={{ width: 15, height: 15 }} />
            PDF (This Day)
          </button>
          <button className="btn-primary" onClick={handleDownloadAllPDF} disabled={exportingAll}>
            <BookOpen style={{ width: 15, height: 15 }} />
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
        <div style={{ padding: '12px 20px' }}>
          <LogSheetCanvas
            dailyLog={currentLog}
            dateStr={getDateStr(currentLog.day_number)}
          />
        </div>
      ) : (
        <div style={{ overflowX: 'auto', padding: '12px 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 14px', color: 'var(--ink-3)' }}>Time Window</th>
                <th style={{ padding: '10px 14px', color: 'var(--ink-3)' }}>Duty Status</th>
                <th style={{ padding: '10px 14px', color: 'var(--ink-3)' }}>Duration</th>
                <th style={{ padding: '10px 14px', color: 'var(--ink-3)' }}>Location</th>
                <th style={{ padding: '10px 14px', color: 'var(--ink-3)' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {currentLog.intervals.map((inv, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', color: '#0284C7', fontWeight: 600 }}>
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
                  <td style={{ padding: '10px 14px', color: 'var(--ink)' }}>{inv.duration_hours} hrs</td>
                  <td style={{ padding: '10px 14px', color: 'var(--ink-3)' }}>{inv.location}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--ink-3)' }}>{inv.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Places a high-res canvas rendering cleanly centered onto an A4 landscape PDF page.
 */
function addScaledImageToPDF(pdf, imgData) {
  const pdfW = pdf.internal.pageSize.getWidth();  // 297 mm
  const pdfH = pdf.internal.pageSize.getHeight(); // 210 mm
  const margin = 8; // 8 mm margin

  const maxW = pdfW - margin * 2;
  const maxH = pdfH - margin * 2;

  const scale = Math.min(maxW / LOG_SHEET_WIDTH, maxH / LOG_SHEET_HEIGHT);
  const imgW = LOG_SHEET_WIDTH * scale;
  const imgH = LOG_SHEET_HEIGHT * scale;

  const x = (pdfW - imgW) / 2;
  const y = (pdfH - imgH) / 2;

  pdf.addImage(imgData, 'PNG', x, y, imgW, imgH);
}

/**
 * Renders a dailyLog to a data URL using the single shared drawLogSheet function.
 */
function renderLogToDataURL(dailyLog, dateStr) {
  return new Promise((resolve) => {
    const W = LOG_SHEET_WIDTH;
    const H = LOG_SHEET_HEIGHT;
    const canvas = document.createElement('canvas');
    canvas.width = W * 2;
    canvas.height = H * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    drawLogSheet(ctx, W, H, dailyLog, dateStr);
    resolve(canvas.toDataURL('image/png'));
  });
}
