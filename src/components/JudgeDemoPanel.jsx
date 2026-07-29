import React, { useState } from 'react';
import { Award, ShieldAlert, Volume2, Sparkles, Printer, ChevronUp, ChevronDown, Check } from 'lucide-react';

export default function JudgeDemoPanel({ onTriggerSOS, onTestAIQuery, onTriggerSiren }) {
  const [isOpen, setIsOpen] = useState(true);
  const [sirenActive, setSirenActive] = useState(false);

  const handleToggleSiren = () => {
    const nextState = !sirenActive;
    setSirenActive(nextState);
    if (onTriggerSiren) onTriggerSiren(nextState);
  };

  return (
    <div className="judge-demo-panel glass-card">
      <div 
        className="judge-panel-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} style={{ color: '#ffd700' }} />
          <b style={{ fontSize: '0.85rem', color: '#ffffff' }}>🏆 Hackathon Judge Demo Suite</b>
        </div>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {isOpen && (
        <div className="judge-panel-body">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            1-Click Interactive Showcase Buttons for Judging & Presentations:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              className="judge-action-btn sos"
              onClick={onTriggerSOS}
            >
              <ShieldAlert size={14} /> 1. Simulate Instant SOS Rescue Signal
            </button>

            <button 
              className="judge-action-btn ai"
              onClick={() => onTestAIQuery("Trapped in Sector 4 flood with rising water! Need evacuation route and shelter.")}
            >
              <Sparkles size={14} /> 2. Test Gemini 1.5 Triage Reasoning
            </button>

            <button 
              className={`judge-action-btn ${sirenActive ? 'siren-on' : 'siren'}`}
              onClick={handleToggleSiren}
            >
              <Volume2 size={14} /> {sirenActive ? "Stop Emergency Siren Alarm" : "3. Play Crisis Audio Siren Alarm"}
            </button>

            <button 
              className="judge-action-btn print"
              onClick={() => window.print()}
            >
              <Printer size={14} /> 4. Export Command Crisis Report (PDF)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
