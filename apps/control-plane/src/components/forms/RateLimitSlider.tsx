import { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export interface RateLimitSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
  description?: string;
}

const PRESET_VALUES = [10, 30, 60, 120, 300, 600];

export function RateLimitSlider({
  value,
  onChange,
  min = 1,
  max = 1000,
  disabled = false,
  label = 'Rate Limit',
  description = 'Requests per minute',
}: RateLimitSliderProps) {
  const [isCustom, setIsCustom] = useState(!PRESET_VALUES.includes(value));

  const handlePresetClick = (presetValue: number) => {
    setIsCustom(false);
    onChange(presetValue);
  };

  const handleCustomChange = (newValue: number) => {
    setIsCustom(true);
    onChange(newValue);
  };

  const getRecommendation = (val: number) => {
    if (val <= 30) return { color: 'text-green-400', text: 'Conservative' };
    if (val <= 120) return { color: 'text-blue-400', text: 'Moderate' };
    if (val <= 300) return { color: 'text-yellow-400', text: 'High' };
    return { color: 'text-red-400', text: 'Very High' };
  };

  const recommendation = getRecommendation(value);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-white">{label}</label>
          {description && (
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-white">{value}</div>
          <div className={clsx('text-xs font-medium', recommendation.color)}>
            {recommendation.text}
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-3">
        <p className="text-xs text-slate-400 uppercase tracking-wide">Quick Presets</p>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_VALUES.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              disabled={disabled}
              className={clsx(
                'rounded-lg border px-3 py-2 text-sm font-medium transition',
                value === preset && !isCustom
                  ? 'border-accent-primary bg-accent-primary/20 text-accent-primary'
                  : 'border-surface-outline/60 bg-surface-base text-slate-200 hover:border-accent-primary/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Custom Value</p>
          <button
            type="button"
            onClick={() => setIsCustom(!isCustom)}
            disabled={disabled}
            className="text-xs text-accent-primary hover:text-accent-primary/80 transition"
          >
            {isCustom ? 'Hide' : 'Show'} Custom
          </button>
        </div>

        <motion.div
          initial={false}
          animate={{ height: isCustom ? 'auto' : 0, opacity: isCustom ? 1 : 0 }}
          className="overflow-hidden"
        >
          <div className="space-y-3 py-2">
            <div className="relative">
              <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => handleCustomChange(Number(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-surface-base rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${((value - min) / (max - min)) * 100}%, rgb(51 65 85) ${((value - min) / (max - min)) * 100}%, rgb(51 65 85) 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>{min}</span>
                <span>{max}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(e) => handleCustomChange(Number(e.target.value))}
                disabled={disabled}
                className="w-24 rounded-lg border border-surface-outline/50 bg-surface-base px-3 py-2 text-sm text-slate-100 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
              />
              <span className="text-sm text-slate-400">req/min</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Usage Examples */}
      <div className="rounded-lg border border-surface-outline/30 bg-surface-base/40 p-3 text-xs text-slate-400">
        <p className="font-medium text-slate-300 mb-1">Usage Examples:</p>
        <ul className="space-y-1">
          <li>• <span className="text-green-400">10-30:</span> Development & testing</li>
          <li>• <span className="text-blue-400">60-120:</span> Production APIs</li>
          <li>• <span className="text-yellow-400">300+:</span> High-traffic applications</li>
        </ul>
      </div>
    </div>
  );
}

export default RateLimitSlider;