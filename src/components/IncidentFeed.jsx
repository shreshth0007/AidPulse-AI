import React, { useState } from 'react';
import { Radio, ShieldAlert, CheckCircle, Clock, MapPin, PlusCircle, AlertTriangle } from 'lucide-react';
import { TRANSLATIONS } from '../data/mockDisasterData';

export default function IncidentFeed({ incidents, onOpenSOS, currentLang }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filteredIncidents = incidents.filter(inc => {
    if (filterSeverity === 'all') return true;
    return inc.severity.toLowerCase() === filterSeverity.toLowerCase();
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 className="section-header-sm">
            <Radio size={22} className="pulse-emergency" style={{ color: 'var(--sos-red)' }} />
            <span>{t.reportsHeader}</span>
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Real-time crowdsourced disaster incidents & rescue team responses in Sector 4 Region.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            className="lang-select"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="all">All Severity Levels</option>
            <option value="critical">🔴 Critical Only</option>
            <option value="high">🟠 High Urgency</option>
          </select>

          <button className="sos-trigger-btn" onClick={onOpenSOS}>
            <PlusCircle size={16} /> Submit New Report / SOS
          </button>
        </div>
      </div>

      {/* Incidents List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredIncidents.map((inc) => {
          const isCritical = inc.severity === 'Critical';
          return (
            <div 
              key={inc.id} 
              className="glass-card"
              style={{
                padding: '18px',
                borderLeft: `5px solid ${isCritical ? 'var(--sos-red)' : 'var(--warn-amber)'}`,
                background: isCritical ? 'rgba(255,59,48,0.04)' : undefined
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white' }}>{inc.type}</h4>
                    <span 
                      className="shelter-badge"
                      style={{
                        background: isCritical ? 'rgba(255,59,48,0.15)' : 'rgba(255,149,0,0.15)',
                        color: isCritical ? '#ff3b30' : '#ff9500',
                        border: `1px solid ${isCritical ? 'rgba(255,59,48,0.3)' : 'rgba(255,149,0,0.3)'}`
                      }}
                    >
                      {inc.severity} Severity
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <MapPin size={14} style={{ color: 'var(--accent-blue)' }} />
                    <span>{inc.locationName}</span>
                    <span>•</span>
                    <Clock size={14} />
                    <span>{inc.timestamp}</span>
                  </div>
                </div>

                <span 
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: inc.status === 'Rescue En Route' ? 'rgba(52,199,89,0.15)' : 'rgba(255,149,0,0.15)',
                    color: inc.status === 'Rescue En Route' ? 'var(--safe-green)' : 'var(--warn-amber)'
                  }}
                >
                  {inc.status}
                </span>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: '12px 0 10px' }}>
                "{inc.details}"
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span>Affected People: <b>{inc.peopleCount} Persons</b></span>
                <span style={{ color: 'var(--safe-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={14} /> GPS Verified by Emergency Dispatch
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
