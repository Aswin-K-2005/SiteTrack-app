import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import { OpenStreetMapProvider, GeoSearchControl } from "leaflet-geosearch";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet-geosearch/dist/geosearch.css";

// Vite doesn't auto-wire Leaflet's default marker image paths — set them explicitly.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [20.5937, 78.9629]; // India, roughly — just a sane fallback view

// 1. Dedicated Search Field sub-controller that safely handles map view flying and coordinates parsing
function MapSearchField({ onLocationFound }) {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider: provider,
      style: "bar",
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: "Type site address (e.g. Ernakulam)...",
    });

    map.addControl(searchControl);

    map.on("geosearch/showlocation", (result) => {
      const { x: lng, y: lat } = result.location;
      onLocationFound(lat, lng);
      map.setView([lat, lng], 16); // Glides view right down close to targeted structure coordinates
    });

    return () => map.removeControl(searchControl);
  }, [map, onLocationFound]);

  return null;
}

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Click-to-pin map with built-in text address geocoding search.
 * `value` is {lat, lng} or null. `radius` in meters, shown as a preview circle.
 * Calls onChange(lat, lng) when the admin clicks the map or picks a search address.
 */
export default function LocationPicker({ value, radius = 150, onChange }) {
  const [locating, setLocating] = useState(false);
  const center = value ? [value.lat, value.lng] : DEFAULT_CENTER;
  const zoom = value ? 16 : 5;

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      // Relaxed accuracy rules + longer timeout window prevents browser throttling locks
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
    );
  }

  return (
    <div>
      {/* Polished, well-spaced header bar aligning with industrial form aesthetics */}
      <div className="flex items-center justify-between mb-2">
        <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider block m-0">
          Site Location Target
        </label>
        <button 
          type="button" 
          className="px-3 py-1 bg-surface-container-high border border-outline-variant text-secondary text-xs font-label-caps tracking-wider rounded hover:bg-surface-container-highest transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50" 
          onClick={useMyLocation} 
          disabled={locating}
        >
          {locating ? (
            <span className="animate-spin rounded-full h-3 w-3 border-2 border-secondary border-t-transparent"></span>
          ) : (
            <span className="text-sm">📍</span>
          )}
          {locating ? "LOCATING SYSTEM..." : "USE MY LOCATION"}
        </button>
      </div>
        <div className="h-[350px] w-full rounded-xl overflow-hidden border border-outline-variant mt-2">        
        {/* key forces a remount when we jump to a new center via "use my location" or address selection so the view recenters */}
        <MapContainer
          key={value ? `${value.lat.toFixed(4)}-${value.lng.toFixed(4)}` : "empty"}
          center={center}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Inject Option 2 Address Searching Interface */}
          <MapSearchField onLocationFound={onChange} />
          
          <ClickHandler onPick={onChange} />
          {value && (
            <>
              <Marker position={[value.lat, value.lng]} />
              <Circle
                center={[value.lat, value.lng]}
                radius={radius}
                pathOptions={{ color: "#ff7a1a", fillColor: "#ff7a1a", fillOpacity: 0.12 }}
              />
            </>
          )}
        </MapContainer>
      </div>
      
      <div className="text-[11px] text-on-surface-variant/70 italic mt-2">
        🔍 Search an address inside the map or tap anywhere to drop the site pin.
      </div>

      {value && (
        <div className="mt-3 flex items-center gap-4 bg-surface-container-low border border-outline-variant p-2 rounded-lg text-xs font-body-md text-on-surface-variant">
          <span>Lat: <b className="text-on-surface font-mono">{value.lat.toFixed(6)}</b></span>
          <span>Lng: <b className="text-on-surface font-mono">{value.lng.toFixed(6)}</b></span>
        </div>
      )}
    </div>
  );
}
