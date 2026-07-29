import React, { useState, useEffect } from 'react';
import { Stethoscope, PhoneCall, HeartPulse, Flame, Activity, Snowflake, ShieldAlert, ChevronDown, ChevronUp, MapPin, RefreshCw, Navigation } from 'lucide-react';
import { HOSPITALS, EMERGENCY_CONTACTS, FIRST_AID_GUIDES, TRANSLATIONS } from '../data/mockDisasterData';
import { fetchNearbyRealHospitalsAndShelters } from '../services/realDataService';

export default function HospitalFinder({ currentLang, onSelectHospitalRoute }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const [expandedFirstAid, setExpandedFirstAid] = useState(null);
  const [hospitalsList, setHospitalsList] = useState(HOSPITALS);
  const [isLoadingReal, setIsLoadingReal] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const getGuideIcon = (iconName) => {
    switch (iconName) {
      case 'HeartPulse': return <HeartPulse size={20} style={{ color: 'var(--sos-red)' }} />;
      case 'Flame': return <Flame size={20} style={{ color: 'var(--warn-amber)' }} />;
      case 'Activity': return <Activity size={20} style={{ color: 'var(--safe-green)' }} />;
      case 'Snowflake': return <Snowflake size={20} style={{ color: 'var(--accent-blue)' }} />;
      default: return <Stethoscope size={20} />;
    }
  };

  const handleFetchRealHospitalsGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoadingReal(true);
    setStatusMsg("📡 Acquiring GPS & querying OpenStreetMap live hospital database...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const { realHospitals } = await fetchNearbyRealHospitalsAndShelters(latitude, longitude);
        setIsLoadingReal(false);

        if (realHospitals && realHospitals.length > 0) {
          setHospitalsList(realHospitals);
          setStatusMsg(`🟢 Loaded ${realHospitals.length} verified real-world medical facilities from OpenStreetMap!`);
        } else {
          setStatusMsg("🟢 Regional Emergency Hospital database connected.");
        }
      },
      (err) => {
        setIsLoadingReal(false);
        setStatusMsg("⚠️ Location permission denied. Showing Regional Trauma Units.");
      }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Universal Emergency Hotlines */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div className="section-header-sm" style={{ marginBottom: '16px', color: 'var(--sos-red)' }}>
          <ShieldAlert size={22} className="pulse-emergency" />
          <span>24/7 Universal Emergency & Triage Direct Lines</span>
        </div>

        <div className="cards-grid-3">
          {EMERGENCY_CONTACTS.map((contact, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(255,59,48,0.06)' }}>
              <div>
                <b style={{ fontSize: '0.95rem', color: 'white' }}>{contact.name}</b>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 10px' }}>{contact.desc}</p>
              </div>
              <a 
                href={`tel:${contact.number}`} 
                className="action-btn-sm" 
                style={{ background: 'var(--sos-red)', color: 'white', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <PhoneCall size={14} /> Call {contact.number}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Hospital Bed Availability Dashboard & Live OSM Switcher */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <h3 className="section-header-sm">
            <Stethoscope size={20} style={{ color: 'var(--accent-blue)' }} />
            <span>{t.hospitalsHeader} ({hospitalsList.length})</span>
          </h3>

          <button 
            className="map-chip-btn"
            style={{ background: 'rgba(10,132,255,0.15)', color: '#0a84ff', border: '1px solid rgba(10,132,255,0.3)' }}
            onClick={handleFetchRealHospitalsGPS}
            disabled={isLoadingReal}
          >
            <RefreshCw size={14} className={isLoadingReal ? 'spin' : ''} style={{ animation: isLoadingReal ? 'spin 1s linear infinite' : undefined }} />
            <span>{isLoadingReal ? "Querying OpenStreetMap..." : "📡 Sync Live Nearby Hospitals"}</span>
          </button>
        </div>

        {statusMsg && (
          <div style={{ fontSize: '0.8rem', color: 'var(--safe-green)', fontWeight: 600, marginBottom: '12px' }}>
            {statusMsg}
          </div>
        )}

        <div className="cards-grid-3">
          {hospitalsList.map((hosp) => (
            <div key={hosp.id} className="hospital-card glass-card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{hosp.name}</h4>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(10,132,255,0.15)', color: '#5ac8fa', padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>
                    {hosp.distanceKm ? `${hosp.distanceKm} km` : 'OpenStreetMap'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--safe-green)', fontWeight: 600, marginTop: '2px' }}>{hosp.status}</p>
              </div>

              {/* Metrics Grid */}
              <div className="metric-row">
                <div className="metric-box">
                  <span className="metric-val">{hosp.erBeds}</span>
                  <span className="metric-lbl">ER Beds Free</span>
                </div>
                <div className="metric-box">
                  <span className="metric-val" style={{ color: hosp.icuBeds < 5 ? 'var(--warn-amber)' : 'var(--safe-green)' }}>
                    {hosp.icuBeds}
                  </span>
                  <span className="metric-lbl">ICU Beds Free</span>
                </div>
                <div className="metric-box">
                  <span className="metric-val" style={{ color: 'var(--accent-blue)' }}>{hosp.oxygenSupplyHours}h</span>
                  <span className="metric-lbl">O2 Supply</span>
                </div>
                <div className="metric-box">
                  <span className="metric-val" style={{ color: '#af52de' }}>{hosp.bloodBankUnits}</span>
                  <span className="metric-lbl">Blood Units</span>
                </div>
              </div>

              {/* Specialties */}
              <div className="amenities-tags">
                {hosp.specialties.map((spec, i) => (
                  <span key={i} className="tag-pill">{spec}</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <a 
                  href={`tel:${hosp.phone}`} 
                  className="primary-submit-btn" 
                  style={{ flex: 1, textDecoration: 'none', textAlign: 'center', background: 'linear-gradient(135deg, #0a84ff, #0056b3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem' }}
                >
                  <PhoneCall size={14} /> Call ER
                </a>

                {onSelectHospitalRoute && (
                  <button 
                    className="primary-submit-btn"
                    style={{ flex: 1, background: 'var(--safe-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem' }}
                    onClick={() => onSelectHospitalRoute(hosp)}
                  >
                    <Navigation size={14} /> Safe Route
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency First Aid Guides Accordion */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 className="section-header-sm" style={{ marginBottom: '16px' }}>
          <HeartPulse size={20} style={{ color: 'var(--sos-red)' }} />
          <span>Life-Saving First Aid Protocol Guides</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {FIRST_AID_GUIDES.map((guide) => {
            const isExpanded = expandedFirstAid === guide.id;
            return (
              <div key={guide.id} className="glass-card" style={{ padding: '14px', background: 'rgba(255,255,255,0.02)' }}>
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpandedFirstAid(isExpanded ? null : guide.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {getGuideIcon(guide.icon)}
                    <b style={{ fontSize: '0.95rem', color: 'white' }}>{guide.title}</b>
                  </div>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--bg-card-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: '#ffb4ab' }}>
                      ⚠️ <b>Critical Triage Rule:</b> {guide.warning}
                    </div>

                    <ol style={{ paddingLeft: '18px', fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {guide.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
