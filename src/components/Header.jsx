import React from 'react';
import { ShieldAlert, Radio, Globe, Sun, Moon, PhoneCall } from 'lucide-react';
import { LANGUAGES, TRANSLATIONS } from '../data/mockDisasterData';

export default function Header({ 
  currentLang, 
  onLangChange, 
  isHighContrast, 
  onToggleHighContrast, 
  onOpenSOS 
}) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  return (
    <header className="main-header">
      <div className="header-top">
        <div className="brand-container">
          <div className="brand-logo-icon pulse-emergency">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="brand-title">{t.appTitle}</h1>
            <p className="brand-tagline">{t.appTagline}</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="sos-trigger-btn" onClick={onOpenSOS}>
            <Radio size={18} className="pulse-emergency" />
            <span>{t.sosButton}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={16} style={{ color: 'var(--text-secondary)' }} />
            <select 
              className="lang-select" 
              value={currentLang} 
              onChange={(e) => onLangChange(e.target.value)}
              aria-label="Select Language"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button 
            className="toggle-btn" 
            onClick={onToggleHighContrast}
            title={isHighContrast ? t.normalMode : t.highContrast}
          >
            {isHighContrast ? <Sun size={16} /> : <Moon size={16} />}
            <span style={{ fontSize: '0.8rem' }}>{isHighContrast ? 'Standard' : 'Contrast'}</span>
          </button>
        </div>
      </div>

      {/* Active Disaster Broadcast Ticker */}
      <div className="crisis-ticker-bar">
        <span className="ticker-badge">
          <span className="live-beacon" style={{ marginRight: '6px' }}></span>
          {t.activeDisasters}
        </span>
        <div className="ticker-text">
          <span>🚨 {t.floodWarning}</span>
          <span>⚡ {t.earthquakeWarning}</span>
          <span>📞 Emergency Hotline Active: Dial 112 or 911 for immediate dispatch.</span>
        </div>
      </div>
    </header>
  );
}
