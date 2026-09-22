import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const createCustomIcon = (color, emoji) =>
  L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:13px;">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });

const icons = {
  START:    createCustomIcon('#111111', '🟢'),
  PICKUP:   createCustomIcon('#2563EB', '📦'),
  DROPOFF:  createCustomIcon('#dc2626', '🏁'),
  FUEL:     createCustomIcon('#d97706', '⛽'),
  REST_30M: createCustomIcon('#0891b2', '☕'),
  REST_10H: createCustomIcon('#7c3aed', '🛌'),
  RESTART:  createCustomIcon('#ea580c', '⚠️'),
};

function AutoFitBounds({ coordinates, waypoints }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (coordinates?.length > 0) {
      map.fitBounds(L.latLngBounds(coordinates), { padding: [30, 30] });
    } else if (waypoints?.length > 0) {
      map.fitBounds(L.latLngBounds(waypoints.map(w => [w.lat, w.lng])), { padding: [30, 30] });
    }
  }, [coordinates, waypoints, map]);
  return null;
}

// Enables scroll zoom only when map is "activated" by a click
function ScrollZoomController({ active }) {
  const map = useMap();
  useEffect(() => {
    if (active) map.scrollWheelZoom.enable();
    else         map.scrollWheelZoom.disable();
  }, [active, map]);
  return null;
}

export default function RouteMap({ coordinates, waypoints, locations }) {
  const center = locations?.current ? [locations.current.lat, locations.current.lng] : [39.8283, -98.5795];
  const [scrollZoomActive, setScrollZoomActive] = useState(false);

  return (
    <div
      style={{ height: '100%', width: '100%', position: 'relative' }}
      onMouseLeave={() => setScrollZoomActive(false)}
    >
      <MapContainer
        center={center}
        zoom={5}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${import.meta.env.VITE_CARTO_API_KEY}`}
        />

        <AutoFitBounds coordinates={coordinates} waypoints={waypoints} />
        <ScrollZoomController active={scrollZoomActive} />

        {coordinates?.length > 0 && (
          <Polyline
            positions={coordinates}
            pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.85 }}
          />
        )}

        {waypoints?.map((wp, idx) => (
          <Marker key={idx} position={[wp.lat, wp.lng]} icon={icons[wp.type] || icons.START}>
            <Popup>
              <div style={{ fontFamily: 'var(--font)', padding: 2 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111', marginBottom: 2 }}>{wp.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#555' }}>{wp.location}</div>
                <div style={{ fontSize: '0.76rem', color: '#888', marginTop: 4 }}>{wp.description}</div>
                {wp.duration && <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#111', marginTop: 3 }}>{wp.duration}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Click-to-activate overlay */}
      {!scrollZoomActive && (
        <div
          onClick={() => setScrollZoomActive(true)}
          style={{
            position: 'absolute', inset: 0, zIndex: 400,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              background: 'rgba(15,23,42,0.75)', color: '#fff',
              fontSize: '0.75rem', fontWeight: 500,
              padding: '5px 12px', borderRadius: 20,
              opacity: 0,
              transition: 'opacity 0.2s',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            className="map-hint"
          >
            Click to enable scroll zoom
          </div>
        </div>
      )}
    </div>
  );
}
