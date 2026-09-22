import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TripForm from './components/TripForm';
import TripSummaryCard from './components/TripSummaryCard';
import RouteMap from './components/RouteMap';
import LogSheetViewer from './components/LogSheetViewer';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initial load default route calculation (Chicago -> Indy -> Dallas)
  useEffect(() => {
    handlePlanTrip({
      current_location: 'Chicago, IL',
      pickup_location: 'Indianapolis, IN',
      dropoff_location: 'Dallas, TX',
      current_cycle_used: 15.0
    });
  }, []);

  const handlePlanTrip = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/plan-trip/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to calculate trip route and HOS logs.');
      }

      const data = await response.json();
      setTripData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error communicating with backend API. Make sure Django server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      {error && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: 12,
          padding: '12px 18px',
          marginBottom: 20,
          color: '#991B1B',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <AlertCircle style={{ width: 20, height: 20, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {tripData && <TripSummaryCard summary={tripData.summary} />}

      <div className="main-grid">
        {/* Left Column: Form & Route Waypoint Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <TripForm onSubmit={handlePlanTrip} loading={loading} />

          {tripData && tripData.waypoints && (
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700, marginBottom: 14, color: 'var(--text-main)' }}>
                Trip Itinerary & Stops
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tripData.waypoints.map((wp, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: wp.type === 'START' ? '#D1FAE5' :
                                  wp.type === 'PICKUP' ? '#DBEAFE' :
                                  wp.type === 'DROPOFF' ? '#FEE2E2' : '#FEF3C7',
                      border: wp.type === 'START' ? '1px solid #6EE7B7' :
                              wp.type === 'PICKUP' ? '1px solid #93C5FD' :
                              wp.type === 'DROPOFF' ? '1px solid #FCA5A5' : '1px solid #FCD34D',
                      color: wp.type === 'START' ? '#047857' :
                             wp.type === 'PICKUP' ? '#1D4ED8' :
                             wp.type === 'DROPOFF' ? '#B91C1C' : '#B45309',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {wp.name} ({wp.location})
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {wp.description} — <span style={{ color: '#0284C7', fontWeight: 600 }}>{wp.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Route Map & Daily Log Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {tripData && (
            <RouteMap
              coordinates={tripData.routes.full_path_coordinates}
              waypoints={tripData.waypoints}
              locations={tripData.locations}
            />
          )}

          {tripData && <LogSheetViewer dailyLogs={tripData.daily_logs} />}
        </div>
      </div>
    </div>
  );
}
