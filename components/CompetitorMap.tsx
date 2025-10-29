'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';

// Fix for default marker icons in Leaflet with Next.js
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Competitor {
  id: string;
  name: string;
  short_name: string;
  headquarters_city?: string;
  headquarters_country: string;
  latitude?: number;
  longitude?: number;
  threat_level: string;
  competitive_overlap_score: number;
  primary_focus?: string[];
  technology_platforms?: string[];
  trial_count?: number;
  publication_count?: number;
  update_count?: number;
}

interface CompetitorMapProps {
  competitors: Competitor[];
}

export default function CompetitorMap({ competitors }: CompetitorMapProps) {
  // Filter competitors with valid coordinates
  const mappableCompetitors = useMemo(() => {
    return competitors.filter(comp =>
      comp.latitude !== null &&
      comp.latitude !== undefined &&
      comp.longitude !== null &&
      comp.longitude !== undefined &&
      !isNaN(comp.latitude) &&
      !isNaN(comp.longitude)
    );
  }, [competitors]);

  // Create custom markers based on threat level
  const createMarkerIcon = (threatLevel: string) => {
    const colors: Record<string, string> = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#22c55e'
    };

    const color = colors[threatLevel] || '#6b7280';

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="position: relative;">
          <div style="
            width: 30px;
            height: 30px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
          ">
            ${threatLevel === 'critical' ? '🔴' : threatLevel === 'high' ? '🟠' : threatLevel === 'medium' ? '🟡' : '🟢'}
          </div>
          <div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid white;
          "></div>
        </div>
      `,
      iconSize: [30, 38],
      iconAnchor: [15, 38],
      popupAnchor: [0, -38]
    });
  };

  // Get circle radius based on competitive overlap score
  const getCircleRadius = (score: number) => {
    return Math.max(100000, score * 5000); // Min 100km, scales with score
  };

  // Get circle color based on threat level
  const getCircleColor = (threatLevel: string) => {
    const colors: Record<string, string> = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#22c55e'
    };
    return colors[threatLevel] || '#6b7280';
  };

  return (
    <MapContainer
      center={[30, 0]} // Center on world
      zoom={2}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      {/* Dark mode tile layer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Render circles for competitive influence */}
      {mappableCompetitors.map((comp) => (
        <Circle
          key={`circle-${comp.id}`}
          center={[comp.latitude!, comp.longitude!]}
          radius={getCircleRadius(comp.competitive_overlap_score)}
          pathOptions={{
            color: getCircleColor(comp.threat_level),
            fillColor: getCircleColor(comp.threat_level),
            fillOpacity: 0.1,
            weight: 1,
            opacity: 0.4
          }}
        />
      ))}

      {/* Render markers */}
      {mappableCompetitors.map((comp) => (
        <Marker
          key={comp.id}
          position={[comp.latitude!, comp.longitude!]}
          icon={createMarkerIcon(comp.threat_level)}
        >
          <Popup
            className="competitor-popup"
            maxWidth={300}
          >
            <div className="p-4 bg-slate-900 text-white rounded-lg" style={{ minWidth: '280px' }}>
              {/* Header */}
              <div className="mb-3 pb-3 border-b border-white/20">
                <h3 className="text-lg font-bold text-white mb-1">
                  {comp.short_name || comp.name}
                </h3>
                <p className="text-sm text-gray-400">
                  {comp.headquarters_city}, {comp.headquarters_country}
                </p>
              </div>

              {/* Threat Level */}
              <div className="mb-3">
                <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                  comp.threat_level === 'critical' ? 'bg-red-500/20 text-red-400' :
                  comp.threat_level === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  comp.threat_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {comp.threat_level === 'critical' ? '🔴' : comp.threat_level === 'high' ? '🟠' : comp.threat_level === 'medium' ? '🟡' : '🟢'}
                  {' '}{comp.threat_level.toUpperCase()} THREAT
                </div>
              </div>

              {/* Competitive Overlap */}
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-1">Competitive Overlap</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                      style={{ width: `${comp.competitive_overlap_score}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white">{comp.competitive_overlap_score}%</span>
                </div>
              </div>

              {/* Focus Areas */}
              {comp.primary_focus && comp.primary_focus.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-2">Focus Areas</div>
                  <div className="flex flex-wrap gap-1">
                    {comp.primary_focus.slice(0, 3).map((focus, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs rounded bg-purple-500/30 text-purple-300">
                        {focus}
                      </span>
                    ))}
                    {comp.primary_focus.length > 3 && (
                      <span className="px-2 py-1 text-xs rounded bg-purple-500/30 text-purple-300">
                        +{comp.primary_focus.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-4 mb-4 text-sm text-gray-400">
                <div>
                  <span className="font-bold text-white">{comp.trial_count || 0}</span> trials
                </div>
                <div>
                  <span className="font-bold text-white">{comp.publication_count || 0}</span> pubs
                </div>
                <div>
                  <span className="font-bold text-white">{comp.update_count || 0}</span> updates
                </div>
              </div>

              {/* View Details Button */}
              <Link
                href={`/competitors/${comp.id}`}
                className="block w-full text-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                View Full Details →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Legend */}
      <div className="leaflet-bottom leaflet-right">
        <div className="leaflet-control backdrop-blur-md bg-slate-900/90 text-white p-4 rounded-lg m-2 shadow-xl border border-white/10">
          <h4 className="font-bold mb-2 text-sm">Threat Levels</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span>🔴</span>
              <span>Critical ({competitors.filter(c => c.threat_level === 'critical').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🟠</span>
              <span>High ({competitors.filter(c => c.threat_level === 'high').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🟡</span>
              <span>Medium ({competitors.filter(c => c.threat_level === 'medium').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🟢</span>
              <span>Low ({competitors.filter(c => c.threat_level === 'low').length})</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20 text-xs text-gray-400">
            <div>Total: {mappableCompetitors.length} mapped</div>
            {competitors.length > mappableCompetitors.length && (
              <div className="text-yellow-400">
                {competitors.length - mappableCompetitors.length} without coordinates
              </div>
            )}
          </div>
        </div>
      </div>
    </MapContainer>
  );
}
