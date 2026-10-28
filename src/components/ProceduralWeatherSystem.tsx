import React, { useState } from 'react';
import { TimeOfDay } from '../game/proceduralScene';
import {
  resolveWeatherProfile,
  WeatherPresetId,
  WeatherProfile,
} from '../game/weatherSystem';

interface ProceduralWeatherSystemProps {
  timeOfDay: TimeOfDay;
  weatherPreset: WeatherPresetId;
  onChangeTimeOfDay: (mode: TimeOfDay) => void;
  onChangeWeatherPreset: (preset: WeatherPresetId) => void;
}

const WEATHER_PRESET_OPTIONS: {
  id: WeatherPresetId;
  label: string;
  shortDesc: string;
  accentHex: string;
}[] = [
  {
    id: 'auto',
    label: 'Auto (Time-Synced)',
    shortDesc: 'Adapts petals, motes & fog to Dawn / Noon / Dusk',
    accentHex: '#d4af37',
  },
  {
    id: 'petals',
    label: 'Sacred Petals',
    shortDesc: 'Falling lotus & blossom petals on warm wind',
    accentHex: '#f472b6',
  },
  {
    id: 'dust_motes',
    label: 'Solar Dust Motes',
    shortDesc: 'Golden prana dust motes & crisp horizon haze',
    accentHex: '#fef08a',
  },
  {
    id: 'spirit_fog',
    label: 'Mystic Spirit Fog',
    shortDesc: 'Low-lying valley mist, twilight fog & spores',
    accentHex: '#c084fc',
  },
];

const TIME_OF_DAY_MODES: { id: TimeOfDay; label: string; weatherHint: string }[] = [
  { id: 'dawn', label: 'Dawn', weatherHint: 'Falling Petals + Light Mist' },
  { id: 'noon', label: 'Noon', weatherHint: 'Golden Dust Motes + Sun Haze' },
  { id: 'twilight', label: 'Dusk', weatherHint: 'Spirit Fog + Ember Petals' },
];

export const ProceduralWeatherSystem: React.FC<ProceduralWeatherSystemProps> = ({
  timeOfDay,
  weatherPreset,
  onChangeTimeOfDay,
  onChangeWeatherPreset,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const profile: WeatherProfile = resolveWeatherProfile(timeOfDay, weatherPreset);
  const windSpeed = Math.hypot(profile.windX, profile.windZ).toFixed(1);

  const renderWeatherGlyph = (kind: WeatherProfile['kind'], color: string) => {
    if (kind === 'petals') {
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3C16.5 6.5 19 11 16.5 16.5C14.5 20.5 9.5 20.5 7.5 16.5C5 11 7.5 6.5 12 3Z"
            stroke={color}
            strokeWidth="1.8"
            fill={color}
            fillOpacity="0.22"
          />
          <path d="M12 7V18" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    }
    if (kind === 'dust_motes') {
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <polygon
            points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9"
            stroke={color}
            strokeWidth="1.7"
            fill={color}
            fillOpacity="0.22"
          />
        </svg>
      );
    }
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 9H20M2 14H18M6 19H22"
          stroke={color}
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <div className="relative flex flex-col items-end" data-testid="procedural-weather-widget">
      {/* Compact Top-Right Weather Pill + Drawer Toggle */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          tabIndex={-1}
          data-testid="weather-toggle-drawer-btn"
          aria-expanded={drawerOpen}
          aria-label={`Weather System: ${profile.title} (${
            weatherPreset === 'auto' ? 'Auto Time-Synced' : 'Custom Override'
          }). Click to configure weather and time of day`}
          onClick={(e) => {
            e.currentTarget.blur();
            setDrawerOpen((prev) => !prev);
          }}
          className="px-2 h-6 font-hud text-xs font-bold tracking-[0.14em] uppercase text-[#f8f5ee] hover:text-[#fef08a] transition-colors cursor-pointer flex items-center gap-1.5"
          title={`Procedural Weather: ${profile.title} — ${profile.subtitle} [Key W]`}
        >
          {renderWeatherGlyph(profile.kind, profile.primaryParticleHex)}
          <span style={{ color: profile.primaryParticleHex }}>{profile.title}</span>
          <span className="font-mono text-[9px] text-[#94a3b8]">
            {weatherPreset === 'auto' ? '[AUTO]' : '[LOCK]'}
          </span>
        </button>
      </div>

      {/* Expandable Procedural Weather & Time-of-Day Control Panel */}
      {drawerOpen && (
        <div
          data-testid="weather-control-panel"
          className="absolute top-full right-0 mt-2 w-[310px] p-3.5 bg-[#060a13]/96 border border-[#d4af37]/45 shadow-[0_16px_45px_rgba(0,0,0,0.92)] text-[#f8f5ee] space-y-3 z-40"
        >
          <div className="flex items-center justify-between border-b border-[#d4af37]/25 pb-2">
            <div>
              <div className="font-hud text-[11px] font-bold uppercase tracking-[0.18em] text-[#d4af37]">
                PROCEDURAL WEATHER SYSTEM
              </div>
              <div className="font-mono text-[9px] text-[#94a3b8]">
                {profile.subtitle}
              </div>
            </div>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Close Weather Panel"
              onClick={(e) => {
                e.currentTarget.blur();
                setDrawerOpen(false);
              }}
              className="px-1.5 py-0.5 font-mono text-[10px] text-[#fda4af] hover:text-white border border-[#fda4af]/30 cursor-pointer"
            >
              [X]
            </button>
          </div>

          {/* Time of Day Selector (Automatically drives weather when in Auto mode) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-[#94a3b8]">
              <span>Time of Day Sky &amp; Lighting</span>
              <span className="text-[#2dd4bf]">Active: {timeOfDay === 'twilight' ? 'Dusk' : timeOfDay}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {TIME_OF_DAY_MODES.map((m) => {
                const isSelected = timeOfDay === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    tabIndex={-1}
                    data-testid={`weather-tod-${m.id}`}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onChangeTimeOfDay(m.id);
                    }}
                    className={`px-2 py-1.5 text-left border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#d4af37] text-[#05070b] border-[#fef08a] font-bold'
                        : 'bg-[#0a111f] hover:bg-[#111c33] text-[#cbd5e1] border-[#d4af37]/30'
                    }`}
                  >
                    <div className="font-hud text-[11px] uppercase tracking-wider">{m.label}</div>
                    <div
                      className={`font-mono text-[8px] truncate ${
                        isSelected ? 'text-[#05070b]/80' : 'text-[#94a3b8]'
                      }`}
                    >
                      {m.weatherHint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weather Mode Selector (Auto Time-Synced vs Manual Override) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-[#94a3b8]">
              <span>Atmospheric Particle &amp; Fog Mode</span>
              <span className="text-[#d4af37]">[Key W]</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {WEATHER_PRESET_OPTIONS.map((opt) => {
                const isSelected = weatherPreset === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    tabIndex={-1}
                    data-testid={`weather-preset-${opt.id}`}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onChangeWeatherPreset(opt.id);
                    }}
                    className={`p-2 text-left border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#101c30] border-[#2dd4bf] text-[#f8f5ee]'
                        : 'bg-[#090f1c] hover:bg-[#0f182c] border-[#d4af37]/25 text-[#cbd5e1]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="font-hud text-[10px] font-bold uppercase tracking-wider truncate"
                        style={{ color: isSelected ? '#2dd4bf' : opt.accentHex }}
                      >
                        {opt.label}
                      </span>
                      {isSelected && (
                        <span className="font-mono text-[8px] text-[#2dd4bf]">●</span>
                      )}
                    </div>
                    <div className="font-mono text-[8px] text-[#94a3b8] leading-tight mt-0.5">
                      {opt.shortDesc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Atmospheric Telemetry Readout */}
          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#d4af37]/20 font-mono text-[9px]">
            <div className="p-1.5 bg-[#09101d] border border-[#d4af37]/20">
              <span className="text-[#64748b] block text-[8px] uppercase">Fog Density</span>
              <span className="text-[#f8f5ee] font-semibold tabular-nums" data-testid="weather-fog-density">
                {(profile.fogDensity * 1000).toFixed(1)}‰
              </span>
            </div>
            <div className="p-1.5 bg-[#09101d] border border-[#d4af37]/20">
              <span className="text-[#64748b] block text-[8px] uppercase">Wind Drift</span>
              <span className="text-[#2dd4bf] font-semibold tabular-nums" data-testid="weather-wind-speed">
                {windSpeed} m/s
              </span>
            </div>
            <div className="p-1.5 bg-[#09101d] border border-[#d4af37]/20">
              <span className="text-[#64748b] block text-[8px] uppercase">3D Particles</span>
              <span className="text-[#fef08a] font-semibold tabular-nums" data-testid="weather-particle-count">
                {profile.activeParticleCount}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
