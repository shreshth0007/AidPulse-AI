import React, { useState } from 'react';
import { X, ShieldAlert, MapPin, Radio, CheckCircle, AlertOctagon } from 'lucide-react';
import { CITY_CENTER, DISASTER_TYPES } from '../data/mockDisasterData';

export default function SOSRescueModal({ isOpen, onClose, onAddIncident }) {
  if (!isOpen) return null;

  const [disasterType, setDisasterType] = useState('Flood');
  const [severity, setSeverity] = useState('Critical');
  const [peopleCount, setPeopleCount] = useState(2);
  const [locationName, setLocationName] = useState('Sector 4, River View Complex');
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const handleSubmitSOS = (e) => {
    e.preventDefault();
    
    const newReport = {
      id: `inc-${Date.now().toString().slice(-4)}`,
      type: disasterType === 'Flood' ? 'Trapped in Rising Water' : 'Emergency Assistance Required',
      disaster: disasterType,
      severity,
      locationName: locationName || 'Current Geolocation',
      lat: CITY_CENTER.lat + (Math.random() - 0.5) * 0.02,
      lng: CITY_CENTER.lng + (Math.random() - 0.5) * 0.02,
      peopleCount: parseInt(peopleCount) || 1,
      details: details || 'Immediate rescue dispatch requested via AidPulse SOS Trigger.',
      timestamp: 'Just now',
      status: 'Rescue En Route',
      verified: true
    };

    onAddIncident(newReport);
    setIsSubmitted(true);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sos-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        {!isSubmitted ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--sos-red)', fontWeight: 800 }}>
                <AlertOctagon size={24} className="pulse-emergency" />
                <span style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>EMERGENCY RESCUE DISPATCH</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Broadcasting your high-priority signal to nearby Disaster Response Teams (NDRF, Coast Guard, Fire Triage).
              </p>
            </div>

            {/* Huge SOS One-Tap Button */}
            <div style={{ textAlign: 'center' }}>
              <button className="sos-big-trigger" onClick={handleSubmitSOS}>
                SOS
              </button>
              <p style={{ fontSize: '0.75rem', color: '#ffb4ab', fontWeight: 600 }}>Tap SOS to Instant Dispatch GPS</p>
            </div>

            {/* Detailed Incident Report Form */}
            <form onSubmit={handleSubmitSOS} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">Disaster Category</label>
                <select className="form-select" value={disasterType} onChange={(e) => setDisasterType(e.target.value)}>
                  <option value="Flood">🌊 Flood / Water Inundation</option>
                  <option value="Earthquake">⚡ Earthquake / Collapse</option>
                  <option value="Fire">🔥 Fire / Explosion</option>
                  <option value="Storm">🌀 Hurricane / Storm Surge</option>
                  <option value="Medical">🏥 Severe Medical SOS</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Urgency Severity</label>
                  <select className="form-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                    <option value="Critical">🔴 Critical (Life Danger)</option>
                    <option value="High">🟠 High (Imminent Risk)</option>
                    <option value="Medium">🟡 Medium (Assistance Needed)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">People Trapped / Affected</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    min="1" 
                    max="50" 
                    value={peopleCount} 
                    onChange={(e) => setPeopleCount(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location / Address Landmark</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Sector 4, River View Apartments"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Additional Details / Medical Needs</label>
                <textarea 
                  className="form-textarea" 
                  rows="2" 
                  placeholder="e.g. Water at balcony level. Need boat rescue for 1 child and 1 elderly."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>

              <button type="submit" className="primary-submit-btn" style={{ marginTop: '8px' }}>
                Transmit Rescue Signal Now
              </button>
            </form>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={64} style={{ color: 'var(--safe-green)', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>SOS RESCUE DISPATCHED!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '12px 0 20px' }}>
              Your emergency signal has been broadcast to Sector 4 Command & Disaster Response Units. Patrol Boat #04 is en route.
            </p>

            <div style={{ background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.3)', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
              <p style={{ fontSize: '0.85rem' }}><b>Dispatch ID:</b> #AID-SOS-{Math.floor(1000 + Math.random() * 9000)}</p>
              <p style={{ fontSize: '0.85rem' }}><b>Status:</b> <span style={{ color: 'var(--safe-green)', fontWeight: 700 }}>Rescue Team Dispatched</span></p>
              <p style={{ fontSize: '0.85rem' }}><b>Estimated Arrival:</b> 8–14 mins</p>
            </div>

            <button 
              className="primary-submit-btn" 
              style={{ background: 'rgba(255,255,255,0.1)', marginTop: '24px' }}
              onClick={onClose}
            >
              Return to Control Center
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
