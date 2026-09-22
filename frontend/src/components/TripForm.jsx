import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { MapPin, Navigation, Package, Play, Clock, Sparkles, Search, X } from 'lucide-react';

// ── Debounce hook ──────────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Portal Dropdown ────────────────────────────────────────────────────────────
// Renders the dropdown into document.body so it is never clipped by overflow:hidden
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
      background: '#FFFFFF',
      border: '1.5px solid #E2E8F0',
      borderRadius: 10,
      boxShadow: '0 16px 40px rgba(15,23,42,0.15)',
      overflow: 'hidden',
      maxHeight: 280,
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
            alignItems: 'flex-start',
            gap: 10,
            background: highlightedIdx === idx ? '#EFF6FF' : '#FFFFFF',
            borderBottom: idx < suggestions.length - 1 ? '1px solid #F1F5F9' : 'none',
            transition: 'background 0.1s',
          }}
        >
          <MapPin style={{
            width: 14, height: 14, marginTop: 2, flexShrink: 0,
            color: highlightedIdx === idx ? '#0284C7' : '#94A3B8',
          }} />
          <div>
            <div style={{
              fontSize: '0.88rem', fontWeight: 600,
              color: highlightedIdx === idx ? '#0F172A' : '#334155',
            }}>
              {s.city}{s.state ? `, ${s.state}` : ''}
            </div>
            {s.extra && (
              <div style={{
                fontSize: '0.74rem', color: '#94A3B8', marginTop: 1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: rect.width - 50,
              }}>
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

// ── LocationInput ──────────────────────────────────────────────────────────────
function LocationInput({ value, onChange, placeholder, icon: Icon, iconColor, label, id }) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [skipFetch, setSkipFetch] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const debouncedQuery = useDebounce(query, 350);

  // Sync external value into query when preset is clicked
  useEffect(() => {
    setQuery(value);
    setSuggestions([]);
    setOpen(false);
  }, [value]);

  // Fetch from Photon (Komoot) — better CORS, free, no key
  useEffect(() => {
    if (skipFetch) { setSkipFetch(false); return; }
    const q = debouncedQuery.trim();
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }

    let cancelled = false;
    setLoading(true);

    fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=7&lang=en&layer=city&layer=state&bbox=-125,24,-66,49`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const features = data.features || [];
        const results = features
          .filter(f => f.properties)
          .map(f => {
            const p = f.properties;
            const city  = p.city || p.name || '';
            const state = p.state || '';
            const country = p.country || '';
            const extra = [p.county, country].filter(Boolean).join(', ');
            return { city, state, extra, display: `${city}${state ? ', ' + state : ''}` };
          })
          .filter(f => f.city);

        // Deduplicate by display string
        const seen = new Set();
        const unique = results.filter(r => {
          if (seen.has(r.display)) return false;
          seen.add(r.display); return true;
        });

        setSuggestions(unique);
        setOpen(unique.length > 0);
        setHighlightedIdx(-1);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setSuggestions([]); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectSuggestion = (s) => {
    const val = s.display;
    setSkipFetch(true);
    setQuery(val);
    onChange(val);
    setSuggestions([]);
    setOpen(false);
    setHighlightedIdx(-1);
    inputRef.current?.blur();
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

  const clear = () => {
    setQuery('');
    onChange('');
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="form-group" ref={wrapperRef}>
      <label className="form-label" htmlFor={id}>
        <Icon style={{ width: 14, height: 14, color: iconColor, marginRight: 4 }} />
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          ref={inputRef}
          type="text"
          className="form-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          placeholder={placeholder}
          autoComplete="off"
          required
          style={{ paddingRight: 36 }}
        />
        <div style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', alignItems: 'center', pointerEvents: query ? 'auto' : 'none',
        }}>
          {loading
            ? <div style={{
                width: 14, height: 14,
                border: '2px solid #CBD5E1', borderTopColor: '#0284C7',
                borderRadius: '50%', animation: 'spin 0.6s linear infinite',
              }} />
            : query
              ? <X style={{ width: 15, height: 15, cursor: 'pointer', color: '#94A3B8' }} onClick={clear} />
              : <Search style={{ width: 14, height: 14, color: '#CBD5E1' }} />
          }
        </div>
      </div>

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

// ── TripForm ───────────────────────────────────────────────────────────────────
export default function TripForm({ onSubmit, loading }) {
  const [currentLocation, setCurrentLocation] = useState('Chicago, IL');
  const [pickupLocation, setPickupLocation] = useState('Indianapolis, IN');
  const [dropoffLocation, setDropoffLocation] = useState('Dallas, TX');
  const [currentCycleUsed, setCurrentCycleUsed] = useState(15.0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      current_location: currentLocation,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      current_cycle_used: parseFloat(currentCycleUsed) || 0,
    });
  };

  const applyPreset = (curr, pick, drop, cycle) => {
    setCurrentLocation(curr);
    setPickupLocation(pick);
    setDropoffLocation(drop);
    setCurrentCycleUsed(cycle);
  };

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Trip Parameters
        </h2>
        <span style={{ fontSize: '0.8rem', color: '#0284C7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Sparkles style={{ width: 14, height: 14 }} /> HOS Engine Active
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <LocationInput
          id="current-location"
          label="Current Location"
          placeholder="e.g. Chicago, IL"
          icon={MapPin}
          iconColor="#0284C7"
          value={currentLocation}
          onChange={setCurrentLocation}
        />

        <LocationInput
          id="pickup-location"
          label="Pickup Location"
          placeholder="e.g. Indianapolis, IN"
          icon={Package}
          iconColor="#10B981"
          value={pickupLocation}
          onChange={setPickupLocation}
        />

        <LocationInput
          id="dropoff-location"
          label="Dropoff Location"
          placeholder="e.g. Dallas, TX"
          icon={Navigation}
          iconColor="#EF4444"
          value={dropoffLocation}
          onChange={setDropoffLocation}
        />

        {/* Cycle slider */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label">
              <Clock style={{ width: 14, height: 14, color: '#D97706', marginRight: 4 }} />
              Current Cycle Hours Used (70h/8d)
            </label>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#D97706',
              fontWeight: 700, background: '#FEF3C7', padding: '2px 8px', borderRadius: 6,
            }}>
              {currentCycleUsed} hrs
            </span>
          </div>
          <input
            type="range" min="0" max="70" step="0.5" value={currentCycleUsed}
            onChange={(e) => setCurrentCycleUsed(e.target.value)}
            style={{ accentColor: '#0284C7', cursor: 'pointer', marginTop: 6, width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>
            <span>0 hrs</span>
            <span style={{ color: '#D97706' }}>{70 - currentCycleUsed} hrs remaining</span>
            <span>70 hrs</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
            Quick Presets:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {[
              ['Chicago, IL', 'Indianapolis, IN', 'Dallas, TX', 15, 'Chicago → Indy → Dallas'],
              ['New York, NY', 'Atlanta, GA', 'Miami, FL', 25, 'NY → Atlanta → Miami'],
              ['Los Angeles, CA', 'Denver, CO', 'Seattle, WA', 65, 'LA → Denver → Seattle'],
            ].map(([c, p, d, hr, label]) => (
              <button key={label} type="button" className="btn-preset"
                onClick={() => applyPreset(c, p, d, hr)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit" className="btn-primary" disabled={loading}
          style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '14px 24px' }}
        >
          {loading
            ? <span className="pulse-loader">Calculating Route & HOS Logs...</span>
            : <><Play style={{ width: 18, height: 18 }} /> Calculate Route &amp; Generate ELD Logs</>
          }
        </button>
      </form>
    </div>
  );
}
