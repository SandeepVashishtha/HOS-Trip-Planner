import React from 'react';
import { Truck, ShieldCheck, Clock, MapPin } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="header">
      <div>
        <div className="header-title">
          <Truck style={{ width: 32, height: 32, color: '#0284C7' }} />
          <span>FMCSA HOS Trip Planner & ELD Log Generator</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>
          Automated FMCSA 49 CFR Part 395 Hours of Service Planner & 24-Hour Paper Log Sheets
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span className="badge badge-info">
          <ShieldCheck style={{ width: 14, height: 14, marginRight: 4 }} />
          70hr / 8-Day Rule
        </span>
        <span className="badge badge-success">
          <Clock style={{ width: 14, height: 14, marginRight: 4 }} />
          11h Drive / 14h Duty
        </span>
      </div>
    </header>
  );
}
