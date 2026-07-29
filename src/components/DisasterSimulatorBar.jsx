import React from 'react';
import { Sliders, Droplets, Activity, Flame, Wind, Sparkles } from 'lucide-react';
import { CRISIS_SCENARIOS } from '../data/mockDisasterData';

export default function DisasterSimulatorBar({ activeScenarioId, onSelectScenario }) {
  return (
    <div className="simulator-bar glass-card">
      <div className="simulator-label">
        <Sparkles size={16} style={{ color: 'var(--warn-amber)' }} />
        <span><b>Crisis Scenario Simulator:</b></span>
      </div>

      <div className="simulator-buttons">
        <button
          className={`sim-btn ${activeScenarioId === 'flood' ? 'active flood' : ''}`}
          onClick={() => onSelectScenario('flood')}
        >
          <Droplets size={15} /> 🌊 Cat 4 Flood & River Overflow
        </button>

        <button
          className={`sim-btn ${activeScenarioId === 'earthquake' ? 'active quake' : ''}`}
          onClick={() => onSelectScenario('earthquake')}
        >
          <Activity size={15} /> ⚡ Mag 7.2 Major Earthquake
        </button>

        <button
          className={`sim-btn ${activeScenarioId === 'fire' ? 'active fire' : ''}`}
          onClick={() => onSelectScenario('fire')}
        >
          <Flame size={15} /> 🔥 Industrial Wildfire & Chemical
        </button>
      </div>
    </div>
  );
}
