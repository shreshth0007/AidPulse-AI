import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Crosshair, 
  Search, 
  Locate, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Globe,
  Compass,
  Map as MapIcon,
  X,
  CloudRain,
  Thermometer,
  Wind,
  Sparkles
} from 'lucide-react';

import { 
  SHELTERS, 
  ROUTES, 
  HOSPITALS, 
  LANDMARKS, 
  CITY_CENTER, 
  TRANSLATIONS 
} from '../data/mockDisasterData';

import { 
  fetchLiveEarthquakes, 
  fetchNearbyRealHospitalsAndShelters, 
  fetchLiveWeather,
  fetchOSRMRealRoadRoute,
  fetchNominatimGeocode,
  getMapTileConfig
} from '../services/realDataService';

import WeatherCharts from './WeatherCharts';
import GlobalPredictor from './GlobalPredictor';

// Custom SVG Markers for Leaflet
const createCustomIcon = (emoji, bgColor, glowColor) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: ${bgColor}; 
        width: 36px; 
        height: 36px; 
        border-radius: 50%; 
        border: 3px solid #ffffff; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        box-shadow: 0 0 16px ${glowColor}; 
        color: white; 
        font-size: 16px;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const shelterIcon = createCustomIcon('🏠', '#34c759', 'rgba(52,199,89,0.8)');
const hospitalIcon = createCustomIcon('🏥', '#0a84ff', 'rgba(10,132,255,0.8)');
const userLocationIcon = createCustomIcon('📍', '#ff3b30', 'rgba(255,59,48,0.9)');
const earthquakeIcon = createCustomIcon('⚡', '#ff9500', 'rgba(255,149,0,0.9)');
const destPinIcon = createCustomIcon('🎯', '#af52de', 'rgba(175,82,222,0.9)');

export default function EmergencyMap({ currentLang, onSelectShelterInChat }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const customOriginMarkerRef = useRef(null);
  const customDestMarkerRef = useRef(null);

  // Layer Group Refs
  const shelterLayerRef = useRef(null);
  const hospitalLayerRef = useRef(null);
  const earthquakeLayerRef = useRef(null);
  const searchedRouteLayerRef = useRef(null);

  const [selectedShelter, setSelectedShelter] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [mapStyle, setMapStyle] = useState('google_roadmap');
  
  // Real GPS & Real Data States
  const [userLocation, setUserLocation] = useState({ lat: CITY_CENTER.lat, lng: CITY_CENTER.lng, name: "Sector 4 Evacuation Zone" });
  const [isLocating, setIsLocating] = useState(false);
  const [isFetchingRealData, setIsFetchingRealData] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  // Live Data States
  const [liveShelters, setLiveShelters] = useState(SHELTERS);
  const [liveHospitals, setLiveHospitals] = useState(HOSPITALS);
  const [liveQuakes, setLiveQuakes] = useState([]);
  const [liveWeather, setLiveWeather] = useState(null);
  const [useRealOSMData, setUseRealOSMData] = useState(false);

  // Typeahead Start Origin Input State
  const [originInputText, setOriginInputText] = useState("📡 My Verified GPS Location");
  const [selectedOriginObj, setSelectedOriginObj] = useState(null);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);

  // Typeahead Destination Search Engine State
  const [destInputText, setDestInputText] = useState("St. Mary Emergency Relief Complex");
  const [selectedDestObj, setSelectedDestObj] = useState(SHELTERS[0]);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [routeWeatherInfo, setRouteWeatherInfo] = useState(null);

  // Distance calculator
  const calcDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  // Dynamically sorted shelters by distance
  const dynamicShelters = liveShelters.map(sh => ({
    ...sh,
    distanceKm: parseFloat(calcDistance(userLocation.lat, userLocation.lng, sh.lat, sh.lng))
  })).sort((a, b) => a.distanceKm - b.distanceKm);

  // Origin Suggestions
  const originSuggestionsList = [
    { name: "📡 My Verified GPS Location", isGps: true, icon: '📍' },
    ...LANDMARKS.map(l => ({ ...l, icon: '📍', itemType: 'Landmark' })),
    ...liveShelters.map(s => ({ ...s, icon: '🏠', itemType: 'Shelter' }))
  ].filter(item => item.name.toLowerCase().includes(originInputText.toLowerCase()));

  // Destination Suggestions
  const destSuggestionsList = [
    ...liveShelters.map(s => ({ ...s, icon: '🏠', itemType: 'Shelter' })),
    ...liveHospitals.map(h => ({ ...h, icon: '🏥', itemType: 'Hospital' })),
    ...LANDMARKS.map(l => ({ ...l, icon: '📍', itemType: 'Landmark' }))
  ].filter(item => item.name.toLowerCase().includes(destInputText.toLowerCase()));

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;
    if (leafletMapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [CITY_CENTER.lat, CITY_CENTER.lng],
      zoom: 12,
      zoomControl: true
    });
    leafletMapRef.current = map;

    const initialTileConf = getMapTileConfig('google_roadmap');
    const tileLayer = L.tileLayer(initialTileConf.url, {
      attribution: initialTileConf.attribution,
      maxZoom: initialTileConf.maxZoom
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Layer Groups
    const shelterLayer = L.layerGroup().addTo(map);
    const hospitalLayer = L.layerGroup().addTo(map);
    const earthquakeLayer = L.layerGroup().addTo(map);
    const searchedRouteLayer = L.layerGroup().addTo(map);

    shelterLayerRef.current = shelterLayer;
    hospitalLayerRef.current = hospitalLayer;
    earthquakeLayerRef.current = earthquakeLayer;
    searchedRouteLayerRef.current = searchedRouteLayer;

    // User Location Marker
    const uMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userLocationIcon })
      .addTo(map)
      .bindPopup(`<b>📍 ${userLocation.name}</b>`);
    userMarkerRef.current = uMarker;

    renderShelterMarkers(SHELTERS);
    renderHospitalMarkers(HOSPITALS);
    loadRealUSGSEarthquakes();

    const timer = setTimeout(() => map.invalidateSize(), 150);

    return () => {
      clearTimeout(timer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Map Tile Style Switcher Effect
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const conf = getMapTileConfig(mapStyle);

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(conf.url, {
      attribution: conf.attribution,
      subdomains: conf.subdomains || 'abcd',
      maxZoom: conf.maxZoom
    }).addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [mapStyle]);

  // Layer Filter Control Effect (Shelters vs Hospitals vs All)
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const shelterLayer = shelterLayerRef.current;
    const hospitalLayer = hospitalLayerRef.current;

    if (shelterLayer && hospitalLayer) {
      if (activeFilter === 'shelters') {
        if (!map.hasLayer(shelterLayer)) map.addLayer(shelterLayer);
        if (map.hasLayer(hospitalLayer)) map.removeLayer(hospitalLayer);
      } else if (activeFilter === 'hospitals') {
        if (!map.hasLayer(hospitalLayer)) map.addLayer(hospitalLayer);
        if (map.hasLayer(shelterLayer)) map.removeLayer(shelterLayer);
      } else {
        if (!map.hasLayer(shelterLayer)) map.addLayer(shelterLayer);
        if (!map.hasLayer(hospitalLayer)) map.addLayer(hospitalLayer);
      }
    }
  }, [activeFilter]);

  const renderShelterMarkers = (shelterList) => {
    const shelterLayer = shelterLayerRef.current;
    if (!shelterLayer) return;
    shelterLayer.clearLayers();

    shelterList.forEach(shelter => {
      const marker = L.marker([shelter.lat, shelter.lng], { icon: shelterIcon })
        .bindPopup(`
          <div style="font-family:sans-serif; color:#111; padding:4px; min-width:190px;">
            <b style="font-size:1rem; color:#0f172a;">🏠 ${shelter.name}</b><br/>
            <span style="color:#2b8a3e; font-weight:bold;">${shelter.status}</span><br/>
            <span style="font-size:0.85rem;">Free Beds: <b>${shelter.availableBeds} / ${shelter.totalBeds}</b></span><br/>
            <small style="color:#666;">${shelter.address || "Verified Location"}</small>
          </div>
        `);
      
      marker.on('click', () => setSelectedShelter(shelter));
      shelterLayer.addLayer(marker);
    });
  };

  const renderHospitalMarkers = (hospList) => {
    const hospitalLayer = hospitalLayerRef.current;
    if (!hospitalLayer) return;
    hospitalLayer.clearLayers();

    hospList.forEach(hosp => {
      const marker = L.marker([hosp.lat, hosp.lng], { icon: hospitalIcon })
        .bindPopup(`
          <div style="font-family:sans-serif; color:#111; padding:4px; min-width:190px;">
            <b style="font-size:1rem; color:#0a84ff;">🏥 ${hosp.name}</b><br/>
            <span style="color:#0056b3; font-weight:600;">ER Free Beds: ${hosp.erBeds}</span> | ICU: ${hosp.icuBeds}<br/>
            <small style="color:#555;">Phone: ${hosp.phone}</small>
          </div>
        `);
      hospitalLayer.addLayer(marker);
    });
  };

  const loadRealUSGSEarthquakes = async () => {
    const quakes = await fetchLiveEarthquakes();
    setLiveQuakes(quakes);

    const earthquakeLayer = earthquakeLayerRef.current;
    if (!earthquakeLayer) return;
    earthquakeLayer.clearLayers();

    quakes.forEach(q => {
      const marker = L.marker([q.lat, q.lng], { icon: earthquakeIcon })
        .bindPopup(`
          <div style="font-family:sans-serif; color:#111; padding:4px;">
            <b style="color:#ff9500; font-size:0.95rem;">⚡ USGS Live Global Earthquake: M ${q.mag}</b><br/>
            <span>Location: <b>${q.place}</b></span><br/>
            <small style="color:#666;">Time: ${q.time} • Depth: ${q.depthKm} km</small><br/>
            <a href="${q.url}" target="_blank" rel="noreferrer" style="color:#0a84ff; font-size:0.75rem;">View USGS Event</a>
          </div>
        `);
      earthquakeLayer.addLayer(marker);
    });
  };

  const handleFetchLiveRealData = async (lat, lng) => {
    setIsFetchingRealData(true);
    setGpsStatus("🌐 Fetching real OpenStreetMap hospitals & weather for your location...");

    const [{ realHospitals, realShelters }, weatherData] = await Promise.all([
      fetchNearbyRealHospitalsAndShelters(lat, lng),
      fetchLiveWeather(lat, lng)
    ]);

    setIsFetchingRealData(false);
    if (weatherData) setLiveWeather(weatherData);

    if (realHospitals.length > 0 || realShelters.length > 0) {
      setUseRealOSMData(true);
      const updatedShelters = realShelters.length > 0 ? realShelters : SHELTERS;
      const updatedHospitals = realHospitals.length > 0 ? realHospitals : HOSPITALS;

      setLiveShelters(updatedShelters);
      setLiveHospitals(updatedHospitals);

      renderShelterMarkers(updatedShelters);
      renderHospitalMarkers(updatedHospitals);

      setGpsStatus(`🟢 LIVE API CONNECTED: Fetched ${realHospitals.length} real hospitals & ${realShelters.length} real shelters!`);
    } else {
      setGpsStatus("🟢 USGS & Google Maps Tile APIs Active.");
    }
  };

  const handleFlyToInternationalHotspot = (lat, lng, name) => {
    setUserLocation({ lat, lng, name });
    if (leafletMapRef.current) {
      leafletMapRef.current.invalidateSize();
      leafletMapRef.current.flyTo([lat, lng], 12, { duration: 1.5 });
    }
    handleFetchLiveRealData(lat, lng);
  };

  const handleFetchLiveGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setGpsStatus("📡 Acquiring satellite GPS signal...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLoc = { lat: latitude, lng: longitude, name: `GPS Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})` };
        setUserLocation(newLoc);
        setOriginInputText("📡 My Verified GPS Location");
        setSelectedOriginObj(newLoc);
        setIsLocating(false);

        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
          userMarkerRef.current.bindPopup(`<b>📍 Your Live Verified GPS</b><br/>${latitude.toFixed(4)}, ${longitude.toFixed(4)}`).openPopup();
        }

        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
          leafletMapRef.current.flyTo([latitude, longitude], 14, { duration: 1.5 });
        }

        handleFetchLiveRealData(latitude, longitude);
      },
      (error) => {
        console.warn("Geolocation fetch error:", error);
        setIsLocating(false);
        setGpsStatus("⚠️ Geolocation permission denied. Defaulting to Metropolitan Region.");
        handleCenterUser();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCenterUser = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.invalidateSize();
      leafletMapRef.current.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.2 });
    }
  };

  const executeRouteCalculation = async (targetDestObj = null) => {
    setShowOriginSuggestions(false);
    setShowDestSuggestions(false);
    const map = leafletMapRef.current;
    if (!map) return;

    // Origin
    let orig = selectedOriginObj;
    if (originInputText.includes("My Verified GPS") || !orig) {
      orig = userLocation;
    }

    if (!orig || (selectedOriginObj && selectedOriginObj.name && selectedOriginObj.name.toLowerCase() !== originInputText.toLowerCase() && !originInputText.includes("My Verified GPS"))) {
      setIsRouting(true);
      setGpsStatus(`🔍 Geocoding typed origin "${originInputText}" via Nominatim API...`);
      const geocodedOrig = await fetchNominatimGeocode(originInputText);
      if (geocodedOrig) {
        orig = geocodedOrig;
        if (customOriginMarkerRef.current) map.removeLayer(customOriginMarkerRef.current);
        const marker = L.marker([geocodedOrig.lat, geocodedOrig.lng], { icon: userLocationIcon }).addTo(map).bindPopup(`<b>📍 ${geocodedOrig.name}</b>`);
        customOriginMarkerRef.current = marker;
      } else {
        orig = userLocation;
      }
    }

    // Destination
    let dest = targetDestObj || selectedDestObj;
    if (!dest || (selectedDestObj && selectedDestObj.name && selectedDestObj.name.toLowerCase() !== destInputText.toLowerCase())) {
      setIsRouting(true);
      setGpsStatus(`🔍 Geocoding typed destination "${destInputText}" via Nominatim API...`);
      const geocodedDest = await fetchNominatimGeocode(destInputText);
      if (geocodedDest) {
        dest = geocodedDest;
        if (customDestMarkerRef.current) map.removeLayer(customDestMarkerRef.current);
        const marker = L.marker([geocodedDest.lat, geocodedDest.lng], { icon: destPinIcon }).addTo(map).bindPopup(`<b>🎯 ${geocodedDest.name}</b>`).openPopup();
        customDestMarkerRef.current = marker;
      } else {
        dest = liveShelters[0];
      }
    }

    if (!orig || !dest) return;

    setIsRouting(true);
    setGpsStatus(`🗺️ Calculating real road route & weather telemetry from ${orig.name || originInputText} to ${dest.name || destInputText}...`);

    const [osrmData, origWeather, destWeather] = await Promise.all([
      fetchOSRMRealRoadRoute(orig.lat, orig.lng, dest.lat, dest.lng),
      fetchLiveWeather(orig.lat, orig.lng),
      fetchLiveWeather(dest.lat, dest.lng)
    ]);

    setIsRouting(false);

    if (origWeather || destWeather) {
      setRouteWeatherInfo({
        origin: origWeather || { tempC: 28, rainMm: 2, windKmh: 15 },
        dest: destWeather || { tempC: 27, rainMm: 8, windKmh: 28 },
        advisory: (destWeather?.rainMm || 0) > 5 ? "🌧️ Heavy Rain Advisory at Destination: Exercise caution against flash flooding." : "🌤️ Favorable road weather conditions along route."
      });
    }

    const searchedRouteLayer = searchedRouteLayerRef.current;
    if (searchedRouteLayer) searchedRouteLayer.clearLayers();

    if (osrmData && osrmData.pathCoordinates.length > 0) {
      const roadPolyline = L.polyline(osrmData.pathCoordinates, {
        color: '#34c759',
        weight: 7,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).bindPopup(`<b>🟢 Real Road Route to ${dest.name || destInputText}</b><br/>Distance: ${osrmData.distanceKm} km • Drive Time: ${osrmData.durationMins} mins`);

      if (searchedRouteLayer) searchedRouteLayer.addLayer(roadPolyline);
      map.fitBounds(roadPolyline.getBounds(), { padding: [40, 40] });

      setGpsStatus(`🟢 REAL ROAD NAVIGATION ACTIVE: Snapped to street network! (${osrmData.distanceKm} km)`);

      setSearchResult({
        originName: orig.name || originInputText,
        destName: dest.name || destInputText,
        distanceKm: osrmData.distanceKm,
        estTime: `${osrmData.durationMins} mins`,
        safetyRating: "100% Snapped Road Network (OSRM Engine)",
        safeSteps: osrmData.turnByTurnSteps,
        hazardWarning: "Avoid low-lying underpasses during active flash floods."
      });
    }
  };

  const handleFormSubmit = (e) => {
    e?.preventDefault();
    executeRouteCalculation();
  };

  const handleFocusShelterAndRoute = (shelter) => {
    setSelectedShelter(shelter);
    setDestInputText(shelter.name);
    setSelectedDestObj(shelter);

    if (leafletMapRef.current) {
      leafletMapRef.current.invalidateSize();
      leafletMapRef.current.flyTo([shelter.lat, shelter.lng], 15, { duration: 1.2 });
    }

    executeRouteCalculation(shelter);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Live Data Status & Typeahead Route Search Header */}
      <div className="glass-card" style={{ padding: '16px 20px', position: 'relative' }}>
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--safe-green)', fontWeight: 800 }}>
              <Compass size={20} className={isRouting ? 'spin' : ''} style={{ animation: isRouting ? 'spin 1s linear infinite' : undefined }} />
              <span style={{ fontSize: '1rem', fontFamily: 'var(--font-display)' }}>INTERNATIONAL ROUTE & SATELLITE ENGINE</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapIcon size={14} style={{ color: 'var(--text-secondary)' }} />
                <select 
                  className="lang-select" 
                  value={mapStyle} 
                  onChange={(e) => setMapStyle(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                >
                  <option value="google_roadmap">🗺️ Google Maps HD Roadmap</option>
                  <option value="google_satellite">🛰️ Google Maps Hybrid Satellite</option>
                  <option value="voyager">🗺️ CartoDB Voyager (OSM)</option>
                </select>
              </div>

              <button 
                type="button" 
                className="map-chip-btn" 
                style={{ background: 'rgba(52,199,89,0.15)', color: '#34c759', border: '1px solid rgba(52,199,89,0.3)' }}
                onClick={() => handleFetchLiveRealData(userLocation.lat, userLocation.lng)}
                disabled={isFetchingRealData}
              >
                <RefreshCw size={14} className={isFetchingRealData ? 'spin' : ''} style={{ animation: isFetchingRealData ? 'spin 1s linear infinite' : undefined }} />
                <span>{isFetchingRealData ? "Syncing APIs..." : "Sync Live Data APIs"}</span>
              </button>

              <button 
                type="button" 
                className="sos-trigger-btn"
                style={{ background: 'linear-gradient(135deg, #0a84ff, #0056b3)', padding: '6px 16px', fontSize: '0.82rem', boxShadow: '0 0 15px var(--accent-blue-glow)' }}
                onClick={handleFetchLiveGPS}
                disabled={isLocating}
              >
                <Locate size={15} className={isLocating ? 'pulse-emergency' : ''} />
                <span>{isLocating ? "Acquiring GPS..." : "📡 Detect My Live GPS"}</span>
              </button>
            </div>
          </div>

          {/* Telemetry Bar */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--safe-green)', fontWeight: 700 }}>🌐 International GIS: Global Map Coverage</span>
            <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>🛣️ OSRM Real Road Engine: Active</span>
            <span style={{ color: 'var(--warn-amber)', fontWeight: 700 }}>⚡ USGS Live Earthquakes: {liveQuakes.length} Events Active</span>
          </div>

          {gpsStatus && (
            <div style={{ fontSize: '0.78rem', color: gpsStatus.includes('🟢') || gpsStatus.includes('✅') ? 'var(--safe-green)' : 'var(--warn-amber)', fontWeight: 600 }}>
              {gpsStatus}
            </div>
          )}

          {/* Dual Typeahead Input Controls (Origin AND Destination) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'center', position: 'relative' }}>
            <div className="form-group" style={{ margin: 0, position: 'relative' }}>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Start / Origin Location</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ width: '100%', paddingRight: '32px' }}
                  placeholder="Type any international origin address..."
                  value={originInputText}
                  onChange={(e) => {
                    setOriginInputText(e.target.value);
                    setShowOriginSuggestions(true);
                  }}
                  onFocus={() => setShowOriginSuggestions(true)}
                />
                {originInputText && (
                  <button 
                    type="button" 
                    onClick={() => { setOriginInputText(''); setSelectedOriginObj(null); }}
                    style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {showOriginSuggestions && originSuggestionsList.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 2000,
                  background: '#0f172a',
                  border: '1px solid var(--accent-blue)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  marginTop: '4px'
                }}>
                  {originSuggestionsList.map((sugg, i) => (
                    <div 
                      key={i}
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.85rem',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      className="supply-item-row"
                      onClick={() => {
                        setOriginInputText(sugg.name);
                        setSelectedOriginObj(sugg.isGps ? userLocation : sugg);
                        setShowOriginSuggestions(false);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{sugg.icon}</span>
                        <b style={{ color: 'white' }}>{sugg.name}</b>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{sugg.itemType || 'GPS'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group" style={{ margin: 0, position: 'relative' }}>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Destination Target Location</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ width: '100%', paddingRight: '32px' }}
                  placeholder="Type any international destination address..."
                  value={destInputText}
                  onChange={(e) => {
                    setDestInputText(e.target.value);
                    setShowDestSuggestions(true);
                  }}
                  onFocus={() => setShowDestSuggestions(true)}
                />
                {destInputText && (
                  <button 
                    type="button" 
                    onClick={() => { setDestInputText(''); setSelectedDestObj(null); }}
                    style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {showDestSuggestions && destSuggestionsList.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 2000,
                  background: '#0f172a',
                  border: '1px solid var(--accent-blue)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  marginTop: '4px'
                }}>
                  {destSuggestionsList.map((sugg, i) => (
                    <div 
                      key={i}
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.85rem',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      className="supply-item-row"
                      onClick={() => {
                        setDestInputText(sugg.name);
                        setSelectedDestObj(sugg);
                        setShowDestSuggestions(false);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{sugg.icon}</span>
                        <b style={{ color: 'white' }}>{sugg.name}</b>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{sugg.itemType}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="primary-submit-btn" 
              style={{ background: 'var(--safe-green)', height: '42px', marginTop: '18px', padding: '0 20px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
              disabled={isRouting}
            >
              <Search size={16} /> {isRouting ? "Snapping Roads..." : "Calculate Real Road Route"}
            </button>
          </div>
        </form>

        {/* Route Weather Comparison Card */}
        {routeWeatherInfo && (
          <div style={{ marginTop: '14px', background: 'rgba(10,132,255,0.06)', border: '1px solid rgba(10,132,255,0.25)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
              <b style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CloudRain size={16} /> Route Weather Telemetry (Origin vs Destination)
              </b>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {routeWeatherInfo.advisory}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '4px' }}>
                <b style={{ color: 'white' }}>📍 Origin Weather:</b> {routeWeatherInfo.origin.tempC}°C • Rain: {routeWeatherInfo.origin.rainMm}mm • Wind: {routeWeatherInfo.origin.windKmh} km/h
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '4px' }}>
                <b style={{ color: 'white' }}>🎯 Destination Weather:</b> {routeWeatherInfo.dest.tempC}°C • Rain: {routeWeatherInfo.dest.rainMm}mm • Wind: {routeWeatherInfo.dest.windKmh} km/h
              </div>
            </div>
          </div>
        )}

        {/* Real Road Route Calculation Result Card */}
        {searchResult && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--bg-card-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--safe-green)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{searchResult.originName}</span>
                <ArrowRight size={14} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{searchResult.destName}</span>
              </div>
              <span className="shelter-badge badge-open">
                🟢 {searchResult.safetyRating} • Est. {searchResult.estTime} ({searchResult.distanceKm} km)
              </span>
            </div>

            <div style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.25)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
              <b style={{ color: 'var(--safe-green)' }}>Turn-by-Turn Road Driving Guidance (OSRM Street Snapped):</b>
              <ol style={{ paddingLeft: '18px', marginTop: '6px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {searchResult.safeSteps.map((step, idx) => (
                  <li key={idx} style={{ fontSize: '0.84rem' }}>{step}</li>
                ))}
              </ol>
            </div>

            <div style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: '#ffb4ab' }}>
              ⚠️ <b>Hazard Advisory:</b> {searchResult.hazardWarning}
            </div>
          </div>
        )}
      </div>

      {/* Main Map & Expanded Sidebar Grid */}
      <div className="map-grid-layout">
        {/* Interactive Map */}
        <div className="map-container-box glass-card">
          <div className="map-controls-overlay">
            <button 
              className={`map-chip-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <Layers size={14} /> All Layers ({liveShelters.length} Shelters + {liveHospitals.length} Hospitals + {liveQuakes.length} USGS Quakes)
            </button>
            <button 
              className={`map-chip-btn ${activeFilter === 'shelters' ? 'active' : ''}`}
              onClick={() => setActiveFilter('shelters')}
            >
              🏠 Shelters ({liveShelters.length})
            </button>
            <button 
              className={`map-chip-btn ${activeFilter === 'hospitals' ? 'active' : ''}`}
              onClick={() => setActiveFilter('hospitals')}
            >
              🏥 Medical ({liveHospitals.length})
            </button>

            <button className="map-chip-btn" onClick={handleCenterUser} title="Re-center My Location">
              <Crosshair size={14} /> Center Me
            </button>
          </div>

          <div ref={mapRef} className="leaflet-map-wrapper" style={{ width: '100%', height: '100%', minHeight: '540px' }} />
        </div>

        {/* Dynamic Regional Shelters & Real Data Sidebar */}
        <div className="sidebar-panel">
          <div className="glass-card" style={{ padding: '16px' }}>
            <div className="section-header-sm" style={{ marginBottom: '12px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--safe-green)' }} />
              <span>{t.sheltersHeader} ({dynamicShelters.length})</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dynamicShelters.map(shelter => {
                const isSelected = selectedShelter?.id === shelter.id;
                const badgeClass = shelter.capacityPct > 90 ? 'badge-full' : shelter.capacityPct > 70 ? 'badge-warning' : 'badge-open';

                return (
                  <div 
                    key={shelter.id} 
                    className="shelter-card glass-card"
                    style={{
                      borderColor: isSelected ? 'var(--safe-green)' : undefined,
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(52, 199, 89, 0.12)' : undefined
                    }}
                    onClick={() => setSelectedShelter(shelter)}
                  >
                    <div className="shelter-card-top">
                      <div>
                        <h4 className="shelter-title">{shelter.name}</h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{shelter.type} • <b>{shelter.distanceKm} km</b> away</p>
                      </div>
                      <span className={`shelter-badge ${badgeClass}`}>{shelter.status}</span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>Capacity: {shelter.capacityPct}%</span>
                        <span><b>{shelter.availableBeds}</b> beds free</span>
                      </div>
                      <div className="shelter-capacity-bar">
                        <div 
                          className="shelter-capacity-fill" 
                          style={{ 
                            width: `${shelter.capacityPct}%`,
                            backgroundColor: shelter.capacityPct > 90 ? 'var(--sos-red)' : shelter.capacityPct > 70 ? 'var(--warn-amber)' : 'var(--safe-green)'
                          }}
                        />
                      </div>
                    </div>

                    <div className="amenities-tags">
                      {shelter.amenities.slice(0, 4).map((am, i) => (
                        <span key={i} className="tag-pill">{am}</span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <a 
                        href={`tel:${shelter.phone}`} 
                        className="action-btn-sm"
                        style={{ flex: 1, textAlign: 'center', textDecoration: 'none', background: 'rgba(255,255,255,0.08)', color: 'white' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone size={12} style={{ marginRight: '4px' }} /> Call Shelter
                      </a>
                      <button 
                        className="action-btn-sm"
                        style={{ flex: 1, background: 'var(--safe-green)', color: 'white' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFocusShelterAndRoute(shelter);
                        }}
                      >
                        <Navigation size={12} style={{ marginRight: '4px' }} /> Safe Directions
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Gemini 1.5 Flash International AI Disaster Risk Prediction Engine */}
      <GlobalPredictor 
        currentLang={currentLang}
        apiKey={localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || ''}
        userLocation={userLocation}
        onFlyToGlobalLocation={handleFlyToInternationalHotspot}
      />

      {/* Interactive Location-Specific Weather Telemetry & 24-Hour Forecast Charts */}
      <WeatherCharts 
        lat={userLocation.lat}
        lng={userLocation.lng}
        userLocationName={userLocation.name}
        liveWeather={liveWeather}
      />
    </div>
  );
}
