import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ArrowLeftRight, Clock, Search, Navigation, X } from 'lucide-react';

// ── Debounce Hook ───────────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── LocationInput Box ────────────────────────────────────────────────────────────
function LocationInputBox({
  value,
  onChange,
  label,
  placeholder,
  icon: Icon = MapPin,
  id,
}) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const isSelectingRef = useRef(false);

  const debouncedQuery = useDebounce(query, 300);

  // Synchronize when external value changes (e.g. swap)
  useEffect(() => {
    if (!isSelectingRef.current) {
      setQuery(value || '');
    }
  }, [value]);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    let isCancelled = false;
    setLoading(true);

    fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en&layer=city&layer=state&bbox=-125,24,-66,49`)
      .then((r) => r.json())
      .then((data) => {
        if (isCancelled) return;
        const results = (data.features || [])
          .filter((f) => f.properties)
          .map((f) => {
            const p = f.properties;
            const city = p.city || p.name || '';
            const state = p.state || '';
            const extra = [p.county, p.country].filter(Boolean).join(', ');
            return {
              city,
              state,
              extra,
              display: `${city}${state ? ', ' + state : ''}`,
            };
          })
          .filter((f) => f.city);

        const seen = new Set();
        const unique = results.filter((r) => {
          if (seen.has(r.display)) return false;
          seen.add(r.display);
          return true;
        });

        setSuggestions(unique);
        setIsOpen(unique.length > 0);
        setHighlightedIdx(-1);
        setLoading(false);
      })
      .catch(() => {
        if (!isCancelled) {
          setSuggestions([]);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const selectSuggestion = (s) => {
    isSelectingRef.current = true;
    setQuery(s.display);
    onChange(s.display);
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIdx(-1);
    inputRef.current?.blur();
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIdx >= 0 && suggestions[highlightedIdx]) {
        e.preventDefault();
        selectSuggestion(suggestions[highlightedIdx]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    isSelectingRef.current = true;
    setQuery('');
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="search-field-container">
      <div
        className={`search-field-box ${isOpen ? 'is-focused' : ''}`}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="search-field-icon">
          <Icon size={16} />
        </div>

        <div className="search-field-content">
          <label htmlFor={id} className="search-field-label">
            {label}
          </label>
          <input
            id={id}
            ref={inputRef}
            type="text"
            className="search-field-input"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            placeholder={placeholder}
            autoComplete="off"
            required
          />
        </div>

        {/* Clear or Loading Icon */}
        <div className="search-field-actions">
          {loading ? (
            <div className="input-spinner" />
          ) : query ? (
            <button
              type="button"
              className="input-clear-btn"
              onClick={handleClear}
              title="Clear input"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Embedded Dropdown Menu */}
      {isOpen && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((s, idx) => (
            <div
              key={idx}
              className={`suggestion-item ${highlightedIdx === idx ? 'highlighted' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevents input blur before select
                selectSuggestion(s);
              }}
              onMouseEnter={() => setHighlightedIdx(idx)}
            >
              <MapPin size={13} className="suggestion-icon" />
              <div className="suggestion-text">
                <div className="suggestion-main">
                  {s.city}
                  {s.state ? `, ${s.state}` : ''}
                </div>
                {s.extra && <div className="suggestion-sub">{s.extra}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TripForm Component ──────────────────────────────────────────────────────────
export default function TripForm({
  initialValues = {},
  onSubmit,
  loading = false,
}) {
  const [currentLocation, setCurrentLocation] = useState(initialValues.current_location || '');
  const [pickupLocation, setPickupLocation] = useState(initialValues.pickup_location || '');
  const [dropoffLocation, setDropoffLocation] = useState(initialValues.dropoff_location || '');
  const [currentCycleUsed, setCurrentCycleUsed] = useState(initialValues.current_cycle_used ?? 0);

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

  const cycleRemaining = Math.max(0, 70 - currentCycleUsed);
  const cyclePercent = (currentCycleUsed / 70) * 100;

  return (
    <div className="trip-widget-container">
      <form onSubmit={handleSubmit} className="trip-search-card">
        
        {/* Row 1: Location Inputs (Blank for user to fill) */}
        <div className="trip-fields-row">
          
          {/* Current Location */}
          <div style={{ flex: '1 1 220px', position: 'relative' }}>
            <LocationInputBox
              id="current-location"
              label="From"
              placeholder="e.g. Chicago, IL"
              value={currentLocation}
              onChange={setCurrentLocation}
              icon={Navigation}
            />
          </div>

          {/* Swap Button */}
          <button
            type="button"
            className="swap-btn"
            onClick={swapLocations}
            title="Swap Current and Pickup"
          >
            <ArrowLeftRight size={14} />
          </button>

          {/* Pickup Location */}
          <div style={{ flex: '1 1 220px', position: 'relative' }}>
            <LocationInputBox
              id="pickup-location"
              label="Pickup Location"
              placeholder="e.g. Indianapolis, IN"
              value={pickupLocation}
              onChange={setPickupLocation}
              icon={MapPin}
            />
          </div>

          {/* Dropoff Location */}
          <div style={{ flex: '1 1 220px', position: 'relative' }}>
            <LocationInputBox
              id="dropoff-location"
              label="Dropoff Location"
              placeholder="e.g. Dallas, TX"
              value={dropoffLocation}
              onChange={setDropoffLocation}
              icon={MapPin}
            />
          </div>

        </div>

        {/* Row 2: Cycle Hours + Calculate Button */}
        <div className="trip-secondary-row">
          
          {/* Cycle Hours Selector */}
          <div className="cycle-selector-box">
            <div className="cycle-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} style={{ color: 'var(--ink-3)' }} />
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
                    background: cyclePercent > 85 ? '#dc2626' : cyclePercent > 60 ? '#d97706' : '#111111',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--ink-3)', marginTop: 2 }}>
                <span>0h</span>
                <span style={{ fontWeight: 600, color: cycleRemaining < 10 ? '#dc2626' : 'var(--ink-2)' }}>
                  {cycleRemaining.toFixed(1)}h remaining
                </span>
                <span>70h max</span>
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <button
            type="submit"
            className="search-cta-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="pulse-loader">Planning Trip…</span>
            ) : (
              <>
                <Search size={16} />
                <span>Calculate Route &amp; ELD Logs</span>
              </>
            )}
          </button>

        </div>

      </form>
    </div>
  );
}
