import React, { useState, useEffect } from 'react';
import { Sparkles, Globe, AlertTriangle, ShieldCheck, Cpu, RefreshCw, CheckCircle2 } from 'lucide-react';
import { generateGlobalDisasterPrediction, getStoredGeminiKey } from '../services/disasterPredictionService';

export default function GlobalPredictor({ currentLang, apiKey, userLocation, onFlyToGlobalLocation }) {
  const defaultRegionName = userLocation?.name || "Local Evacuation Region";
  const defaultLat = userLocation?.lat || 28.6139;
  const defaultLng = userLocation?.lng || 77.2090;

  const [searchRegion, setSearchRegion] = useState(defaultRegionName);
  const [selectedCoords, setSelectedCoords] = useState({ lat: defaultLat, lng: defaultLng });
  const [prediction, setPrediction] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const effectiveKey = getStoredGeminiKey(apiKey);

  const globalPresets = [
    { name: "📡 My GPS / Current Region", lat: defaultLat, lng: defaultLng, isCurrent: true },
    { name: "🇵🇭 Manila, Philippines", lat: 14.5995, lng: 120.9842 },
    { name: "🇺🇸 Miami, Florida", lat: 25.7617, lng: -80.1918 },
    { name: "🇹🇷 Istanbul, Turkey", lat: 41.0082, lng: 28.9784 },
    { name: "🇯🇵 Tokyo, Japan", lat: 35.6762, lng: 139.6503 }
  ];

  const handleRunPrediction = async (regionText = searchRegion, lat = selectedCoords.lat, lng = selectedCoords.lng) => {
    setIsAnalyzing(true);
    const result = await generateGlobalDisasterPrediction(regionText, lat, lng, effectiveKey, currentLang);
    setPrediction(result);
    setIsAnalyzing(false);

    if (lat !== null && lng !== null && onFlyToGlobalLocation) {
      onFlyToGlobalLocation(lat, lng, regionText);
    }
  };

  // Sync with user's actual location changes (GPS detection or map pan)
  useEffect(() => {
    if (userLocation?.name) {
      setSearchRegion(userLocation.name);
      setSelectedCoords({ lat: userLocation.lat, lng: userLocation.lng });
      handleRunPrediction(userLocation.name, userLocation.lat, userLocation.lng);
    }
  }, [userLocation?.lat, userLocation?.lng]);

  const getBadgeStyle = (score, level) => {
    if (score > 65 || (level && level.includes("HIGH")) || (level && level.includes("CRITICAL"))) {
      return {
        bg: 'rgba(255,59,48,0.15)',
        color: 'var(--sos-red)',
        border: '1px solid rgba(255,59,48,0.3)',
        icon: <AlertTriangle size={14} style={{ color: 'var(--sos-red)' }} />
      };
    }
    if (score > 35 || (level && level.includes("MODERATE"))) {
      return {
        bg: 'rgba(255,149,0,0.15)',
        color: 'var(--warn-amber)',
        border: '1px solid rgba(255,149,0,0.3)',
        icon: <AlertTriangle size={14} style={{ color: 'var(--warn-amber)' }} />
      };
    }
    return {
      bg: 'rgba(52,199,89,0.15)',
      color: 'var(--safe-green)',
      border: '1px solid rgba(52,199,89,0.3)',
      icon: <CheckCircle2 size={14} style={{ color: 'var(--safe-green)' }} />
    };
  };

  return (
    <div className="glass-card" style={{ padding: '20px', marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-logo-icon" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #af52de, #0a84ff)' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="section-header-sm" style={{ color: 'white' }}>
              Gemini 1.5 Flash Disaster Risk Prediction Engine
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Real-Time Location Weather & Gemini AI 7-Day Risk Analytics for <b>{searchRegion}</b>
            </p>
          </div>
        </div>

        <span className="shelter-badge badge-open" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(175,82,222,0.15)', color: '#af52de', border: '1px solid rgba(175,82,222,0.3)' }}>
          <Cpu size={14} /> {effectiveKey ? '✨ Gemini 1.5 Flash Live API Active' : '⚡ Weather Telemetry AI Active'}
        </span>
      </div>

      {/* Region Selector Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center', fontWeight: 600 }}>Region Presets:</span>
        {globalPresets.map((preset, idx) => (
          <button 
            key={idx} 
            className="map-chip-btn"
            style={{ fontSize: '0.78rem' }}
            onClick={() => {
              const regionName = preset.isCurrent ? (userLocation?.name || "Current GPS Location") : preset.name;
              setSearchRegion(regionName);
              setSelectedCoords({ lat: preset.lat, lng: preset.lng });
              handleRunPrediction(regionName, preset.lat, preset.lng);
            }}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Search Input Bar for Custom Region */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input 
          type="text" 
          className="form-input" 
          style={{ flex: 1 }}
          placeholder="Type any city, landmark, or country for AI prediction..."
          value={searchRegion}
          onChange={(e) => setSearchRegion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRunPrediction()}
        />
        <button 
          className="primary-submit-btn"
          style={{ width: 'auto', padding: '0 24px', background: 'linear-gradient(135deg, #af52de, #0a84ff)', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => handleRunPrediction()}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
          <span>{isAnalyzing ? "AI Predictive Modeling..." : "Generate 7-Day Prediction"}</span>
        </button>
      </div>

      {/* AI Prediction Result Display */}
      {prediction && (() => {
        const badgeStyle = getBadgeStyle(prediction.riskProbability, prediction.riskLevel);
        return (
          <div style={{ background: 'rgba(175,82,222,0.06)', border: '1px solid rgba(175,82,222,0.25)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Globe size={22} style={{ color: 'var(--accent-purple)' }} />
                <b style={{ fontSize: '1.1rem', color: 'white' }}>{prediction.region}</b>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: badgeStyle.color }}>
                  7-Day Risk Score: {prediction.riskProbability}%
                </div>
                <span 
                  className="shelter-badge"
                  style={{
                    background: badgeStyle.bg,
                    color: badgeStyle.color,
                    border: badgeStyle.border,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {badgeStyle.icon}
                  {prediction.riskLevel}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Predicted Events Timeline */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-card-border)' }}>
                <b style={{ fontSize: '0.85rem', color: 'var(--warn-amber)', display: 'block', marginBottom: '8px' }}>
                  ⚠️ Gemini AI 7-Day Predicted Hazards & Assessment:
                </b>
                <ul style={{ paddingLeft: '18px', fontSize: '0.84rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {prediction.predictedEvents.map((evt, idx) => (
                    <li key={idx}>{evt}</li>
                  ))}
                </ul>
              </div>

              {/* AI Action Plan */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-card-border)' }}>
                <b style={{ fontSize: '0.85rem', color: 'var(--safe-green)', display: 'block', marginBottom: '8px' }}>
                  🛡️ AI Recommended Preparedness Strategy:
                </b>
                <ul style={{ paddingLeft: '18px', fontSize: '0.84rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {prediction.aiMitigationAdvice.map((adv, idx) => (
                    <li key={idx}>{adv}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
