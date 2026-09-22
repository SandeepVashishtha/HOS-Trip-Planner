import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Create custom SVG markers
const createCustomIcon = (color, emoji) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        font-size: 16px;
      ">${emoji}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

const icons = {
  START: createCustomIcon('#10B981', '🟢'),
  PICKUP: createCustomIcon('#3B82F6', '📦'),
  DROPOFF: createCustomIcon('#EF4444', '🏁'),
  FUEL: createCustomIcon('#F59E0B', '⛽'),
  REST_30M: createCustomIcon('#14B8A6', '☕'),
  REST_10H: createCustomIcon('#8B5CF6', '🛌'),
  RESTART: createCustomIcon('#F97316', '⚠️')
};

function AutoFitBounds({ coordinates, waypoints }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (waypoints && waypoints.length > 0) {
      const pts = waypoints.map(w => [w.lat, w.lng]);
      const bounds = L.latLngBounds(pts);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [coordinates, waypoints, map]);

  return null;
}

export default function RouteMap({ coordinates, waypoints, locations }) {
  const center = locations?.current ? [locations.current.lat, locations.current.lng] : [39.8283, -98.5795];

  return (
    <div className="map-container">
      <MapContainer center={center} zoom={5} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <AutoFitBounds coordinates={coordinates} waypoints={waypoints} />

        {/* Route Polyline */}
        {coordinates && coordinates.length > 0 && (
          <Polyline
            positions={coordinates}
            pathOptions={{ color: '#0284C7', weight: 5, opacity: 0.85, lineDashArray: '0' }}
          />
        )}

        {/* Waypoints */}
        {waypoints && waypoints.map((wp, idx) => {
          const icon = icons[wp.type] || icons.START;
          return (
            <Marker key={idx} position={[wp.lat, wp.lng]} icon={icon}>
              <Popup>
                <div style={{ padding: 4, fontFamily: 'sans-serif' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#0F172A', marginBottom: 2 }}>
                    {wp.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                    {wp.location}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#0284C7', marginTop: 4, fontWeight: 600 }}>
                    Duration: {wp.duration}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>
                    {wp.description}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
