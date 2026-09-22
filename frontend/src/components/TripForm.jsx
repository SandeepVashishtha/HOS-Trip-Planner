import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { MapPin, ArrowLeftRight, Clock, Search, Sparkles, Navigation, CheckCircle2 } from 'lucide-react';

// ── Debounce ────────────────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Dropdown Portal ──────────────────────────────────────────────────────────────
function DropdownPortal({ anchorRef, open, suggestions, highlightedIdx, onSelect, onHover }) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const update = () => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (r) setRect(r);
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, anchorRef]);

  if (!open || !rect || suggestions.length === 0) return null;

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
      overflow: 'hidden',
      maxHeight: 250,
      overflowY: 'auto',
    }}>
      {suggestions.map((s, idx) => (
        <div
          key={idx}
          onMouseDown={(e) => { e.preventDefault(); onSelect(s); }}
          onMouseEnter={() => onHover(idx)}
          style={{
            padding: '10px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: highlightedIdx === idx ? 'var(--bg-hover)' : '#fff',
            borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <MapPin size={14} style={{ flexShrink: 0, color: 'var(--accent-blue)' }} />
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink)' }}>
              {s.city}{s.state ? `, ${s.state}` : ''}
            </div>
            {s.extra && (
              <div style={{ fontSize: '0.74rem', color: 'var(--ink-3)', marginTop: 1 }}>
                {s.extra}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
}

// ── LocationInput Box (Card Style) ──────────────────────────────────────────────
function LocationInputBox({
  value,
  onChange,
  label,
  placeholder,
  icon: Icon = MapPin,
  iconColor = '#2563eb',
  id,
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2 || q === value) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en&layer=city&layer=state&bbox=-125,24,-66,49`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const results = (data.features || [])
          .filter(f => f.properties)
          .map(f => {
            const p = f.properties;
            const city = p.city || p.name || '';
            const state = p.state || '';
            const extra = [p.county, p.country].filter(Boolean).join(', ');
            return { city, state, extra, display: `${city}${state ? ', ' + state : ''}` };
          })
          .filter(f => f.city);
        const seen = new Set();
        const unique = results.filter(r => { if (seen.has(r.display)) return false; seen.add(r.display); return true; });
        setSuggestions(unique);
        setOpen(unique.length > 0);
        setHighlightedIdx(-1);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setSuggestions([]); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [debouncedQuery, value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectSuggestion = (s) => {
    setQuery(s.display);
    onChange(s.display);
    setSuggestions([]);
    setOpen(false);
    setHighlightedIdx(-1);
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightedIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightedIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="search-field-box"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="search-field-icon" style={{ color: iconColor }}>
        <Icon size={18} />
      </div>
      <div className="search-field-content">
        <label htmlFor={id} className="search-field-label">{label}</label>
        <input
          id={id}
          ref={inputRef}
          type="text"
          className="search-field-input"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          placeholder={placeholder}
          autoComplete="off"
          required
        />
      </div>
      {loading && (
        <div style={{ width: 14, height: 14, border: '2px solid #e2e8f0', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', marginRight: 4 }} />
      )}

      <DropdownPortal
        anchorRef={wrapperRef}
        open={open}
        suggestions={suggestions}
        highlightedIdx={highlightedIdx}
        onSelect={selectSuggestion}
        onHover={setHighlightedIdx}
      />
    </div>
  );
}

// ── TripForm Component ──────────────────────────────────────────────────────────
export default function TripForm({
  initialValues = {},
  onSubmit,
  loading = false,
}) {
  const [currentLocation, setCurrentLocation] = useState(initialValues.current_location || 'Chicago, IL');
  const [pickupLocation, setPickupLocation] = useState(initialValues.pickup_location || 'Indianapolis, IN');
  const [dropoffLocation, setDropoffLocation] = useState(initialValues.dropoff_location || 'Dallas, TX');
  const [currentCycleUsed, setCurrentCycleUsed] = useState(initialValues.current_cycle_used ?? 15.0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      current_location: currentLocation,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      current_cycle_used: parseFloat(currentCycleUsed) || 0,
    });
  };

  const swapLocations = () => {
    const temp = currentLocation;
    setCurrentLocation(pickupLocation);
    setPickupLocation(temp);
  };

  const applyPreset = (curr, pick, drop, cycle) => {
    setCurrentLocation(curr);
    setPickupLocation(pick);
    setDropoffLocation(drop);
    setCurrentCycleUsed(cycle);
  };

  const cycleRemaining = Math.max(0, 70 - currentCycleUsed);
  const cyclePercent = (currentCycleUsed / 70) * 100;

  return (
    <div className="trip-widget-container">
      <form onSubmit={handleSubmit} className="trip-search-card">
        
        {/* Main Input Row (From, Swap, Pickup, Dropoff) */}
        <div className="trip-fields-row">
          
          {/* Current Location (From) */}
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <LocationInputBox
              id="current-location"
              label="From (Current Location)"
              placeholder="e.g. Chicago, IL"
              value={currentLocation}
              onChange={setCurrentLocation}
              icon={Navigation}
              iconColor="#111827"
            />
          </div>

          {/* Swap Button */}
          <button
            type="button"
            className="swap-btn"
            onClick={swapLocations}
            title="Swap Current & Pickup Location"
          >
            <ArrowLeftRight size={15} />
          </button>

          {/* Pickup Location */}
          <div style={{ flex: '1 1 200px' }}>
            <LocationInputBox
              id="pickup-location"
              label="Pickup Location"
              placeholder="e.g. Indianapolis, IN"
              value={pickupLocation}
              onChange={setPickupLocation}
              icon={MapPin}
              iconColor="#2563eb"
            />
          </div>

          {/* Dropoff Location */}
          <div style={{ flex: '1 1 200px' }}>
            <LocationInputBox
              id="dropoff-location"
              label="Dropoff Location"
              placeholder="e.g. Dallas, TX"
              value={dropoffLocation}
              onChange={setDropoffLocation}
              icon={MapPin}
              iconColor="#dc2626"
            />
          </div>

        </div>

        {/* Secondary Row: Cycle Hours + CTA Button */}
        <div className="trip-secondary-row">
          
          {/* Cycle Hours Slider Box */}
          <div className="cycle-selector-box">
            <div className="cycle-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={15} style={{ color: '#d97706' }} />
                <span className="search-field-label" style={{ margin: 0 }}>Current Cycle Used (70h / 8-Day)</span>
              </div>
              <span className="cycle-val-display">
                <strong>{currentCycleUsed}h</strong> <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>/ 70h</span>
              </span>
            </div>

            <div style={{ marginTop: 8 }}>
              <div className="cycle-track">
                <div
                  className="cycle-fill"
                  style={{
                    width: `${cyclePercent}%`,
                    background: cyclePercent > 85 ? '#dc2626' : cyclePercent > 60 ? '#d97706' : '#2563eb',
                  }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="70"
                step="0.5"
                value={currentCycleUsed}
                onChange={e => setCurrentCycleUsed(parseFloat(e.target.value) || 0)}
                className="cycle-slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--ink-3)', marginTop: 2 }}>
                <span>0 hrs</span>
                <span style={{ fontWeight: 600, color: cycleRemaining < 10 ? '#dc2626' : 'var(--ink-2)' }}>
                  {cycleRemaining.toFixed(1)} hrs remaining
                </span>
                <span>70 hrs max</span>
              </div>
            </div>
          </div>

          {/* Calculate Route & Generate Logs CTA Button */}
          <button
            type="submit"
            className="search-cta-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="pulse-loader">Planning Trip…</span>
            ) : (
              <>
                <Search size={18} />
                <span>Calculate Route &amp; ELD Logs</span>
              </>
            )}
          </button>

        </div>

        {/* Quick Route Presets Bar */}
        <div className="presets-bar">
          <div className="presets-title">
            <Sparkles size={13} style={{ color: 'var(--accent-blue)' }} />
            <span>Sample Trips:</span>
          </div>
          <div className="presets-list">
            {[
              { curr: 'Chicago, IL', pick: 'Indianapolis, IN', drop: 'Dallas, TX', cycle: 15, name: 'Chicago → Indy → Dallas (980 mi)' },
              { curr: 'New York, NY', pick: 'Atlanta, GA', drop: 'Miami, FL', cycle: 25, name: 'New York → Atlanta → Miami (1,340 mi)' },
              { curr: 'Los Angeles, CA', pick: 'Denver, CO', drop: 'Seattle, WA', cycle: 45, name: 'LA → Denver → Seattle (2,350 mi)' },
            ].map((p, i) => (
              <button
                key={i}
                type="button"
                className="preset-chip"
                onClick={() => applyPreset(p.curr, p.pick, p.drop, p.cycle)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

      </form>

      {/* Feature cards below the search widget */}
      <div className="feature-cards-grid">
        <div className="feature-card">
          <CheckCircle2 size={16} className="feature-icon" />
          <div>
            <div className="feature-title">FMCSA HOS Compliant</div>
            <div className="feature-desc">70-hour / 8-day cycle, 11h driving &amp; 14h duty window logic</div>
          </div>
        </div>
        <div className="feature-card">
          <CheckCircle2 size={16} className="feature-icon" />
          <div>
            <div className="feature-title">Smart Mandatory Stops</div>
            <div className="feature-desc">30-min rest breaks every 8h &amp; 10-hr sleeper berths</div>
          </div>
        </div>
        <div className="feature-card">
          <CheckCircle2 size={16} className="feature-icon" />
          <div>
            <div className="feature-title">Official Daily Log Sheets</div>
            <div className="feature-desc">Generated 24-hour graph grid RODS sheets &amp; PDF export</div>
          </div>
        </div>
      </div>

    </div>
  );
}
