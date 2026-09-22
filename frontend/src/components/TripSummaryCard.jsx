import React from 'react';
import { Route, Clock, Calendar, Fuel, BedDouble, ShieldAlert } from 'lucide-react';

const formatNumber = (num, maxDigits = 1) => {
  if (num === null || num === undefined) return '0';
  const n = typeof num === 'number' ? num : parseFloat(num);
  if (isNaN(n)) return String(num);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDigits,
  });
};

const STATS = (s) => [
  {
    icon: Route,
    label: 'Total Distance',
    value: formatNumber(s.total_miles, 1),
    sub: 'miles',
  },
  {
    icon: Clock,
    label: 'Total Driving',
    value: formatNumber(s.total_driving_hours, 1),
    sub: 'hours',
  },
  {
    icon: Calendar,
    label: 'Trip Duration',
    value: `${s.total_days}d`,
    sub: `${formatNumber(s.total_trip_hours, 1)}h total`,
  },
  {
    icon: Fuel,
    label: 'Fuel Stops',
    value: s.fuel_stops_count ?? 0,
    sub: '>1,000 mi rule',
  },
  {
    icon: BedDouble,
    label: '30-Min Breaks',
    value: s.rest_stops_count ?? 0,
    sub: 'mandatory stops',
  },
  {
    icon: ShieldAlert,
    label: '70h Cycle Used',
    value: formatNumber(s.final_cycle_used, 1),
    sub: '/ 70 hrs',
  },
];

export default function TripSummaryCard({ summary }) {
  if (!summary) return null;

  return (
    <div className="stats-bar">
      {STATS(summary).map(({ icon: Icon, label, value, sub }) => (
        <div key={label} className="stat-cell">
          <div className="stat-label">
            <Icon size={11} />
            {label}
          </div>
          <div className="stat-value">{value}</div>
          <div className="stat-sub">{sub}</div>
        </div>
      ))}
    </div>
  );
}
