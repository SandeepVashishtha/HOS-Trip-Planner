import React, { useState } from 'react';
import LogSheetCanvas from './LogSheetCanvas';
import { Download, FileText, Calendar, Table, Eye } from 'lucide-react';
import jsPDF from 'jspdf';

export default function LogSheetViewer({ dailyLogs = [] }) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' or 'table'

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

  return (
    <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-main)' }}>
            <FileText style={{ width: 22, height: 22, color: '#0284C7' }} />
            FMCSA Daily Driver Log Sheets ({dailyLogs.length} {dailyLogs.length === 1 ? 'Sheet' : 'Sheets'})
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Standard 24-Hour Driver Record of Duty Status (RODS)
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => setViewMode(viewMode === 'canvas' ? 'table' : 'canvas')}>
            {viewMode === 'canvas' ? <Table style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
            {viewMode === 'canvas' ? 'Table View' : 'Log Sheet View'}
          </button>
          <button className="btn-secondary" onClick={handleDownloadPNG}>
            <Download style={{ width: 16, height: 16 }} />
            PNG
          </button>
          <button className="btn-primary" onClick={handleDownloadPDF}>
            <Download style={{ width: 16, height: 16 }} />
            PDF Sheet
          </button>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="tabs-header">
        {dailyLogs.map((log, idx) => (
          <button
            key={idx}
            className={`tab-btn ${selectedDayIndex === idx ? 'active' : ''}`}
            onClick={() => setSelectedDayIndex(idx)}
          >
            <Calendar style={{ width: 14, height: 14, marginRight: 6 }} />
            Day {log.day_number} ({log.totals.driving}h Drive)
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
          return <LogSheetCanvas dailyLog={currentLog} dateStr={dateStr} />;
        })()
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
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
