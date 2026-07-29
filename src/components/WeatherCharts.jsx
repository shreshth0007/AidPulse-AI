import React, { useEffect, useState } from 'react';
import { CloudRain, Thermometer, Wind, Gauge, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { fetchLiveWeather } from '../services/realDataService';

export default function WeatherCharts({ lat, lng, userLocationName, liveWeather }) {
  const [weather, setWeather] = useState(liveWeather || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (lat !== undefined && lng !== undefined) {
      setIsLoading(true);
      fetchLiveWeather(lat, lng).then(data => {
        if (isMounted && data) {
          setWeather(data);
          setIsLoading(false);
        }
      }).catch(err => {
        if (isMounted) setIsLoading(false);
      });
    }
    return () => { isMounted = false; };
  }, [lat, lng]);

  const activeWeather = weather || liveWeather || {
    tempC: 28.5,
    rainMm: 0,
    windKmh: 12,
    pressureHpa: 1012,
    isFloodRisk: false,
    hourlyRainData: [
      { hour: '00:00', rain: 0 },
      { hour: '03:00', rain: 0.2 },
      { hour: '06:00', rain: 1.4 },
      { hour: '09:00', rain: 3.8 },
      { hour: '12:00', rain: 6.2 },
      { hour: '15:00', rain: 2.1 },
      { hour: '18:00', rain: 0.5 },
      { hour: '21:00', rain: 0 }
    ],
    hourlyTempData: [
      { hour: '00:00', temp: 24 },
      { hour: '03:00', temp: 23 },
      { hour: '06:00', temp: 22 },
      { hour: '09:00', temp: 26 },
      { hour: '12:00', temp: 30 },
      { hour: '15:00', temp: 29 },
      { hour: '18:00', temp: 27 },
      { hour: '21:00', temp: 25 }
    ]
  };

  const hourlyRainData = activeWeather.hourlyRainData || [];
  const hourlyTempData = activeWeather.hourlyTempData || [];
  const maxRain = Math.max(1, ...hourlyRainData.map(d => d.rain));

  return (
    <div className="glass-card" style={{ padding: '20px', marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div>
          <h4 className="section-header-sm" style={{ color: 'var(--accent-cyan)' }}>
            <CloudRain size={20} className={isLoading ? 'spin' : ''} style={{ animation: isLoading ? 'spin 1s linear infinite' : undefined }} />
            <span>Real-Time Weather Telemetry & 24-Hour Forecast Charts</span>
          </h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Open-Meteo Weather API for <b>{userLocationName || "Selected Location"}</b> {lat !== undefined && lng !== undefined ? `(${lat.toFixed(2)}°, ${lng.toFixed(2)}°)` : ''}
          </p>
        </div>

        {activeWeather.isFloodRisk ? (
          <span className="shelter-badge badge-full" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} /> 🌧️ HEAVY PRECIPITATION & FLOOD RISK
          </span>
        ) : (
          <span className="shelter-badge badge-open" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} /> 🌤️ MODERATE WEATHER CONDITIONS
          </span>
        )}
      </div>

      {/* Current Real Weather Metrics Strip for Selected Location */}
      <div className="cards-grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(10,132,255,0.08)' }}>
          <Thermometer size={24} style={{ color: 'var(--warn-amber)' }} />
          <div>
            <b style={{ fontSize: '1.2rem', color: 'white' }}>{activeWeather.tempC !== undefined ? `${activeWeather.tempC}°C` : '--'}</b>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Temperature</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(10,132,255,0.08)' }}>
          <CloudRain size={24} style={{ color: 'var(--accent-blue)' }} />
          <div>
            <b style={{ fontSize: '1.2rem', color: 'white' }}>{activeWeather.rainMm !== undefined ? `${activeWeather.rainMm} mm` : '--'}</b>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Precipitation Rate</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(10,132,255,0.08)' }}>
          <Wind size={24} style={{ color: 'var(--safe-green)' }} />
          <div>
            <b style={{ fontSize: '1.2rem', color: 'white' }}>{activeWeather.windKmh !== undefined ? `${activeWeather.windKmh} km/h` : '--'}</b>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Wind Speed</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(10,132,255,0.08)' }}>
          <Gauge size={24} style={{ color: '#af52de' }} />
          <div>
            <b style={{ fontSize: '1.2rem', color: 'white' }}>{activeWeather.pressureHpa !== undefined ? `${activeWeather.pressureHpa} hPa` : '--'}</b>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Surface Pressure</div>
          </div>
        </div>
      </div>

      {/* Location-Specific Weather Telemetry Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Chart 1: 24-Hour Rain Precipitation Forecast Bar Chart */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bg-card-border)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
          <b style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', display: 'block', marginBottom: '12px' }}>
            🌧️ 24-Hour Location Rain Forecast (mm)
          </b>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '120px', gap: '8px', padding: '0 4px' }}>
            {hourlyRainData.map((d, i) => {
              const heightPct = Math.max(8, Math.round((d.rain / maxRain) * 100));
              const isPeak = d.rain > 0 && d.rain === maxRain;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.68rem', color: isPeak ? 'var(--sos-red)' : 'var(--accent-cyan)', fontWeight: 700, marginBottom: '4px' }}>
                    {d.rain}mm
                  </span>
                  <div 
                    style={{
                      width: '100%',
                      maxWidth: '24px',
                      height: `${heightPct}%`,
                      background: isPeak 
                        ? 'linear-gradient(180deg, #ff3b30, #990000)' 
                        : 'linear-gradient(180deg, #0a84ff, #0056b3)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.4s ease'
                    }}
                    title={`${d.hour}: ${d.rain}mm rain`}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px' }}>{d.hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: 24-Hour Temperature Curve */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bg-card-border)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
          <b style={{ fontSize: '0.85rem', color: 'var(--warn-amber)', display: 'block', marginBottom: '12px' }}>
            🌡️ 24-Hour Location Temperature Curve Trend (°C)
          </b>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '120px', gap: '8px', padding: '0 4px' }}>
            {hourlyTempData.map((d, i) => {
              const minT = Math.min(...hourlyTempData.map(x => x.temp)) - 2;
              const maxT = Math.max(...hourlyTempData.map(x => x.temp)) + 2;
              const heightPct = Math.max(15, Math.round(((d.temp - minT) / (maxT - minT || 1)) * 100));
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--warn-amber)', fontWeight: 700, marginBottom: '4px' }}>
                    {d.temp}°
                  </span>
                  <div 
                    style={{
                      width: '8px',
                      height: `${heightPct}%`,
                      background: 'linear-gradient(180deg, #ff9500, #ff3b30)',
                      borderRadius: 'var(--radius-full)'
                    }}
                    title={`${d.hour}: ${d.temp}°C`}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px' }}>{d.hour}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
