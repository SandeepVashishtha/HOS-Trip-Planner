import React from 'react';
import { Route, Clock, Calendar, Fuel, BedDouble, ShieldAlert } from 'lucide-react';

const STATS = (s) => [
  { icon: Route,       label: 'Total Distance',    value: s.total_miles,        sub: 'miles'             },
  { icon: Clock,       label: 'Total Driving',     value: s.total_driving_hours, sub: 'hours'            },
  { icon: Calendar,    label: 'Trip Duration',     value: `${s.total_days}d`,   sub: `${s.total_trip_hours}h total` },
  { icon: Fuel,        label: 'Fuel Stops',        value: s.fuel_stops_count,   sub: '>1,000 mi rule'    },
  { icon: BedDouble,   label: '30-Min Breaks',     value: s.rest_stops_count,   sub: 'mandatory stops'   },
  { icon: ShieldAlert, label: '70h Cycle Used',    value: s.final_cycle_used,   sub: `/ 70 hrs`          },
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
