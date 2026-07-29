import React, { useState } from 'react';
import { PackageCheck, Users, Printer, Download, CheckSquare, Square, Droplets, Flame, Wind, Activity, Snowflake } from 'lucide-react';
import { DISASTER_TYPES, SUPPLY_TEMPLATES, TRANSLATIONS } from '../data/mockDisasterData';

export default function SupplyChecklist({ currentLang }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  
  const [selectedDisaster, setSelectedDisaster] = useState('flood');
  const [familySize, setFamilySize] = useState(4);
  const [checkedItems, setCheckedItems] = useState({});

  const supplyList = SUPPLY_TEMPLATES[selectedDisaster] || SUPPLY_TEMPLATES.flood;

  const toggleCheck = (idx) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const totalItems = supplyList.length;
  const completedItems = Object.values(checkedItems).filter(Boolean).length;
  const progressPct = Math.round((completedItems / totalItems) * 100);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Controls Header */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 className="section-header-sm">
              <PackageCheck size={22} style={{ color: 'var(--safe-green)' }} />
              <span>{t.suppliesHeader}</span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Tailored 72-hour survival preparedness kit based on disaster type & family count.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="lang-select" onClick={handlePrint}>
              <Printer size={16} /> Print Kit List
            </button>
          </div>
        </div>

        {/* Disaster Type Buttons */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
          {DISASTER_TYPES.map((d) => (
            <button
              key={d.id}
              className="map-chip-btn"
              style={{
                background: selectedDisaster === d.id ? d.color : 'rgba(255,255,255,0.05)',
                color: 'white',
                border: '1px solid var(--bg-card-border)',
                padding: '8px 16px'
              }}
              onClick={() => {
                setSelectedDisaster(d.id);
                setCheckedItems({});
              }}
            >
              {d.name}
            </button>
          ))}
        </div>

        {/* Family Size Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '20px', background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontWeight: 600 }}>
            <Users size={18} />
            <span>{t.familySize}:</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="icon-action-btn" 
              style={{ width: '32px', height: '32px', fontSize: '1.1rem' }} 
              onClick={() => setFamilySize(Math.max(1, familySize - 1))}
            >
              -
            </button>
            <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{familySize} People</span>
            <button 
              className="icon-action-btn" 
              style={{ width: '32px', height: '32px', fontSize: '1.1rem' }} 
              onClick={() => setFamilySize(familySize + 1)}
            >
              +
            </button>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
            💧 Required Water Supply: <b>{familySize * 4 * 3} Liters</b> (3-Day Min)
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Emergency Kit Packing Progress</span>
            <span style={{ color: progressPct === 100 ? 'var(--safe-green)' : 'var(--accent-blue)' }}>
              {completedItems} / {totalItems} Packed ({progressPct}%)
            </span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', color: 'white' }}>
          Essential Supplies Checklist ({selectedDisaster.toUpperCase()})
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {supplyList.map((item, idx) => {
            const isDone = !!checkedItems[idx];
            return (
              <div 
                key={idx} 
                className="supply-item-row"
                onClick={() => toggleCheck(idx)}
              >
                {isDone ? (
                  <CheckSquare size={20} style={{ color: 'var(--safe-green)', flexShrink: 0 }} />
                ) : (
                  <Square size={20} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                )}

                <div style={{ flex: 1 }}>
                  <span className={`supply-item-text ${isDone ? 'done' : ''}`} style={{ fontSize: '0.92rem', fontWeight: 500 }}>
                    {item.item}
                  </span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.category}</div>
                </div>

                {item.essential && (
                  <span className="tag-pill" style={{ background: 'rgba(255,59,48,0.15)', color: '#ff7970', border: '1px solid rgba(255,59,48,0.3)' }}>
                    HIGH PRIORITY
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
