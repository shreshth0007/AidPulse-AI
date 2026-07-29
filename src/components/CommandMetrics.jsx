import React from 'react';
import { Activity, ShieldAlert, Droplets, Users, Bed, Anchor, Cpu } from 'lucide-react';

export default function CommandMetrics({ activeScenario }) {
  const scenario = activeScenario || {
    severityLevel: "LEVEL 4 EXTREME",
    waterLevel: "+2.8m Above Threshold",
    shelteredCount: 1840,
    availableBeds: 456,
    activePatrols: 18
  };

  return (
    <div className="command-metrics-bar">
      <div className="metric-chip glow-red">
        <div className="chip-icon red">
          <ShieldAlert size={18} className="pulse-emergency" />
        </div>
        <div className="chip-data">
          <span className="chip-val red">{scenario.severityLevel}</span>
          <span className="chip-label">Crisis Status</span>
        </div>
      </div>

      <div className="metric-chip">
        <div className="chip-icon blue">
          <Droplets size={18} />
        </div>
        <div className="chip-data">
          <span className="chip-val blue">{scenario.waterLevel}</span>
          <span className="chip-label">Flood Sensor Baseline</span>
        </div>
      </div>

      <div className="metric-chip">
        <div className="chip-icon green">
          <Users size={18} />
        </div>
        <div className="chip-data">
          <span className="chip-val green">{scenario.shelteredCount.toLocaleString()}</span>
          <span className="chip-label">People Sheltered</span>
        </div>
      </div>

      <div className="metric-chip">
        <div className="chip-icon green">
          <Bed size={18} />
        </div>
        <div className="chip-data">
          <span className="chip-val green">{scenario.availableBeds}</span>
          <span className="chip-label">Available Emergency Beds</span>
        </div>
      </div>

      <div className="metric-chip">
        <div className="chip-icon purple">
          <Anchor size={18} />
        </div>
        <div className="chip-data">
          <span className="chip-val purple">{scenario.activePatrols} Deployed</span>
          <span className="chip-label">Rescue Boats & Helis</span>
        </div>
      </div>

      <div className="metric-chip">
        <div className="chip-icon cyan">
          <Cpu size={18} />
        </div>
        <div className="chip-data">
          <span className="chip-val cyan">Gemini 1.5 Flash</span>
          <span className="chip-label">Agent Latency 118ms</span>
        </div>
      </div>
    </div>
  );
}
