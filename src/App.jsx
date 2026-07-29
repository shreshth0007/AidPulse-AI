import React, { useState } from 'react';
import Header from './components/Header';
import EmergencyMap from './components/EmergencyMap';
import AIChatbot from './components/AIChatbot';
import SOSRescueModal from './components/SOSRescueModal';
import HospitalFinder from './components/HospitalFinder';
import SupplyChecklist from './components/SupplyChecklist';
import IncidentFeed from './components/IncidentFeed';

import { 
  MapPin, 
  Bot, 
  Radio, 
  Stethoscope, 
  PackageCheck 
} from 'lucide-react';

import { INITIAL_INCIDENTS, TRANSLATIONS } from './data/mockDisasterData';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [currentLang, setCurrentLang] = useState('en');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [selectedShelterContext, setSelectedShelterContext] = useState(null);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const handleAddIncident = (newIncident) => {
    setIncidents(prev => [newIncident, ...prev]);
  };

  const handleSelectShelterInChat = (shelter) => {
    setSelectedShelterContext(shelter);
    setActiveTab('ai');
  };

  return (
    <div className={`app-container ${isHighContrast ? 'high-contrast-mode' : ''}`}>
      {/* Header */}
      <Header 
        currentLang={currentLang}
        onLangChange={setCurrentLang}
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
        onOpenSOS={() => setIsSOSOpen(true)}
      />

      {/* Tab Navigation */}
      <nav className="nav-tabs-bar">
        <button 
          className={`nav-tab-item ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <MapPin size={18} />
          <span>{t.tabMap}</span>
        </button>

        <button 
          className={`nav-tab-item ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          <Bot size={18} />
          <span>{t.tabAI}</span>
        </button>

        <button 
          className={`nav-tab-item ${activeTab === 'sos' ? 'active' : ''}`}
          onClick={() => setActiveTab('sos')}
        >
          <Radio size={18} style={{ color: 'var(--sos-red)' }} />
          <span>{t.tabSOS}</span>
        </button>

        <button 
          className={`nav-tab-item ${activeTab === 'medical' ? 'active' : ''}`}
          onClick={() => setActiveTab('medical')}
        >
          <Stethoscope size={18} />
          <span>{t.tabMedical}</span>
        </button>

        <button 
          className={`nav-tab-item ${activeTab === 'supplies' ? 'active' : ''}`}
          onClick={() => setActiveTab('supplies')}
        >
          <PackageCheck size={18} />
          <span>{t.tabSupplies}</span>
        </button>
      </nav>

      {/* Main Container Views */}
      <main className="main-content">
        {activeTab === 'map' && (
          <EmergencyMap 
            currentLang={currentLang}
            onSelectShelterInChat={handleSelectShelterInChat}
          />
        )}

        {activeTab === 'ai' && (
          <AIChatbot 
            currentLang={currentLang}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenSOS={() => setIsSOSOpen(true)}
            selectedShelterContext={selectedShelterContext}
          />
        )}

        {activeTab === 'sos' && (
          <IncidentFeed 
            incidents={incidents}
            onOpenSOS={() => setIsSOSOpen(true)}
            currentLang={currentLang}
          />
        )}

        {activeTab === 'medical' && (
          <HospitalFinder 
            currentLang={currentLang}
          />
        )}

        {activeTab === 'supplies' && (
          <SupplyChecklist 
            currentLang={currentLang}
          />
        )}
      </main>

      {/* Global One-Tap SOS Modal */}
      <SOSRescueModal 
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        onAddIncident={handleAddIncident}
      />

      {/* Footer */}
      <footer className="main-footer">
        <p><b>AidPulse AI</b> — Smart Disaster Response & Life-Saving System • Emergency Hotline 112 / 911</p>
      </footer>
    </div>
  );
}
