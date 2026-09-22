import React from 'react';
import { Route, Clock, Calendar, Fuel, BedDouble, ShieldAlert } from 'lucide-react';

export default function TripSummaryCard({ summary }) {
  if (!summary) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0284C7', marginBottom: 4 }}>
          <Route style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Distance</span>
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {summary.total_miles} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>mi</span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4F46E5', marginBottom: 4 }}>
          <Clock style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Driving Time</span>
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {summary.total_driving_hours} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>hrs</span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#059669', marginBottom: 4 }}>
          <Calendar style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Trip Duration</span>
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {summary.total_days} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{summary.total_days === 1 ? 'Day' : 'Days'} ({summary.total_trip_hours}h)</span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#D97706', marginBottom: 4 }}>
          <Fuel style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Fuel Stops</span>
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {summary.fuel_stops_count} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({'>'}1,000 mi rule)</span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#DB2777', marginBottom: 4 }}>
          <BedDouble style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Rest Breaks</span>
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {summary.rest_stops_count} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>stops</span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563EB', marginBottom: 4 }}>
          <ShieldAlert style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>70h Cycle Used</span>
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {summary.final_cycle_used} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 70 hrs</span>
        </div>
      </div>
    </div>
  );
}
