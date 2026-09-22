import React, { useState } from 'react';
import Navbar from './components/Navbar';
import TripForm from './components/TripForm';
import TripSummaryCard from './components/TripSummaryCard';
import RouteMap from './components/RouteMap';
import LogSheetViewer from './components/LogSheetViewer';
import {
  AlertCircle,
  MapPin,
  ArrowLeft,
  Clock,
  Layers,
  ShieldCheck,
  Fuel,
  Bed,
  Compass,
} from 'lucide-react';

const WP_COLORS = {
  START:    '#111111',
  PICKUP:   '#2563eb',
  DROPOFF:  '#dc2626',
  FUEL:     '#d97706',
  REST_30M: '#0891b2',
  REST_10H: '#7c3aed',
  RESTART:  '#ea580c',
};

export default function App() {
  const [page, setPage] = useState('landing'); // 'landing' | 'results'
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formInputs, setFormInputs] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_used: 0,
  });

  const handlePlanTrip = async (formData) => {
    setLoading(true);
    setError(null);
    setFormInputs(formData);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plan-trip/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to calculate trip.');
      }

      const data = await res.json();
      setTripData(data);
      setPage('results');
    } catch (err) {
      setError(err.message || 'Could not reach backend service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      
      {/* ── Landing Page View ── */}
      {page === 'landing' && (
        <div className="landing-page-view">
          
          {/* Full-width background with truck visible in the upper area */}
          <div className="landing-bg-banner">
            <div className="landing-bg-overlay" />
          </div>

          <Navbar onHomeClick={() => setPage('landing')} />

          <main className="landing-content">
            
            {/* Top spacing area so the truck in the background is fully shown */}
            <div className="hero-visible-space" />

            {/* Error Banner if any */}
            {error && (
              <div className="error-banner" style={{ maxWidth: 960, margin: '0 auto 20px', width: '100%' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Shifted Trip Parameters Search Card */}
            <TripForm
              initialValues={formInputs}
              onSubmit={handlePlanTrip}
              loading={loading}
            />

            {/* Minimalist HOS Rules Footer Strip */}
            <div className="landing-rules-strip">
              <div className="rule-item">
                <Compass size={14} className="rule-icon" />
                <div className="rule-content">
                  <span className="rule-title">11-Hour Driving</span>
                  <span className="rule-desc">Max driving in 14h window</span>
                </div>
              </div>

              <div className="rule-item">
                <Bed size={14} className="rule-icon" />
                <div className="rule-content">
                  <span className="rule-title">10-Hour Rest</span>
                  <span className="rule-desc">Mandatory sleeper berth</span>
                </div>
              </div>

              <div className="rule-item">
                <Fuel size={14} className="rule-icon" />
                <div className="rule-content">
                  <span className="rule-title">1,000-Mi Fueling</span>
                  <span className="rule-desc">Automatic fuel intervals</span>
                </div>
              </div>

              <div className="rule-item">
                <ShieldCheck size={14} className="rule-icon" />
                <div className="rule-content">
                  <span className="rule-title">70h / 8-Day Cycle</span>
                  <span className="rule-desc">Recap &amp; FMCSA RODS</span>
                </div>
              </div>
            </div>

          </main>
        </div>
      )}

      {/* ── Results Page View ── */}
      {page === 'results' && (
        <div className="results-page-view">
          <Navbar onHomeClick={() => setPage('landing')} />

          {/* Top navigation & route summary bar */}
          <div className="results-top-bar">
            <div className="results-top-bar-inner">
              <button
                className="btn-back"
                onClick={() => setPage('landing')}
                title="Return to search inputs"
              >
                <ArrowLeft size={15} />
                <span>Edit Trip Parameters</span>
              </button>

              <div className="route-breadcrumb-pill">
                <span className="route-point">{formInputs.current_location}</span>
                <span className="route-arrow">➔</span>
                <span className="route-point" style={{ color: 'var(--accent-blue)' }}>{formInputs.pickup_location}</span>
                <span className="route-arrow">➔</span>
                <span className="route-point" style={{ color: 'var(--accent-red)' }}>{formInputs.dropoff_location}</span>
                <span className="route-cycle-badge">Cycle: {formInputs.current_cycle_used}h used</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <TripSummaryCard summary={tripData?.summary} />

          {/* Main Results Container */}
          <div className="page-results-content">
            
            {/* Error banner if something fails */}
            {error && (
              <div className="error-banner">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* ── Row: Side-by-Side (Stops & Itinerary on Left | Map on Right) ── */}
            <div className="side-by-side-row">
              
              {/* Left Side: Stops and Itinerary */}
              <div className="itinerary-panel">
                <div className="panel-header-bar">
                  <div className="panel-title">
                    <Layers size={14} style={{ color: 'var(--ink-2)' }} />
                    <span>Stops &amp; Itinerary</span>
                  </div>
                  <span className="panel-counter-badge">
                    {tripData?.waypoints?.length || 0} Waypoints
                  </span>
                </div>

                <div className="itinerary-scroll-list">
                  {tripData?.waypoints?.map((wp, idx) => (
                    <div key={idx} className="itinerary-card">
                      <div
                        className="itinerary-marker-dot"
                        style={{ background: WP_COLORS[wp.type] || '#111' }}
                      >
                        {idx + 1}
                      </div>

                      <div className="itinerary-card-body">
                        <div className="itinerary-card-head">
                          <span className="itinerary-card-title">{wp.name}</span>
                          <span
                            className="itinerary-card-type-badge"
                            style={{
                              color: WP_COLORS[wp.type] || '#111',
                              borderColor: `${WP_COLORS[wp.type] || '#111'}33`,
                              background: `${WP_COLORS[wp.type] || '#111'}10`,
                            }}
                          >
                            {wp.type.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="itinerary-card-location">
                          <MapPin size={12} style={{ flexShrink: 0 }} />
                          <span>{wp.location}</span>
                        </div>

                        <div className="itinerary-card-desc">
                          {wp.description}
                          {wp.duration && (
                            <span className="itinerary-duration-tag">
                              <Clock size={11} /> {wp.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Map */}
              <div className="map-panel">
                <div className="panel-header-bar">
                  <div className="panel-title">
                    <MapPin size={14} style={{ color: 'var(--ink-2)' }} />
                    <span>Route Map</span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--ink-3)' }}>
                    Interactive Map &amp; Stops
                  </span>
                </div>

                <div className="map-wrapper">
                  {tripData ? (
                    <RouteMap
                      coordinates={tripData.routes.full_path_coordinates}
                      waypoints={tripData.waypoints}
                      locations={tripData.locations}
                    />
                  ) : (
                    <div className="map-placeholder">
                      Loading route map…
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ── Row: FMCSA ELD Log Sheets (Below the map & itinerary) ── */}
            {tripData?.daily_logs && (
              <div className="eld-container-section">
                <LogSheetViewer dailyLogs={tripData.daily_logs} />
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
