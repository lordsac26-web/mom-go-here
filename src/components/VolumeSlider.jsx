import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';

export default function VolumeSlider({ label, value, onChange, disabled = false, muted = false, onMuteToggle }) {
  const getVolumeIcon = () => {
    if (muted || value === 0) return <VolumeX size={20} className="text-red-500" />;
    if (value < 0.33) return <Volume size={20} className="text-yellow-500" />;
    if (value < 0.66) return <Volume1 size={20} className="text-blue-500" />;
    return <Volume2 size={20} className="text-green-500" />;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-lg font-bold text-foreground">{label}</label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-muted-foreground">{Math.round(value * 100)}%</span>
          {onMuteToggle && (
            <button
              onClick={onMuteToggle}
              disabled={disabled}
              className={`p-2 rounded-lg transition-all ${
                muted
                  ? 'bg-red-600 text-white'
                  : 'bg-muted text-foreground hover:bg-primary/20'
              } disabled:opacity-50`}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {getVolumeIcon()}
            </button>
          )}
        </div>
      </div>

      {/* Visual volume bar with gradient */}
      <div className="relative h-8 bg-muted rounded-lg overflow-hidden border-2 border-border">
        <div
          className="absolute left-0 top-0 h-full rounded-lg transition-all duration-100"
          style={{
            width: `${value * 100}%`,
            background: muted
              ? 'repeating-linear-gradient(90deg, #dc2626, #dc2626 2px, transparent 2px, transparent 6px)'
              : `linear-gradient(to right, 
                  ${value < 0.33 ? '#eab308' : value < 0.66 ? '#3b82f6' : '#22c55e'},
                  ${value < 0.33 ? '#fbbf24' : value < 0.66 ? '#60a5fa' : '#4ade80'})`,
          }}
        />
        {/* Percentage text overlay */}
        <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-foreground opacity-70">
          {Math.round(value * 100)}%
        </span>
      </div>

      {/* Interactive slider */}
      <input
        type="range"
        min="0"
        max="100"
        value={value * 100}
        onChange={(e) => onChange(e.target.value / 100)}
        disabled={disabled || muted}
        className="w-full h-3 rounded-lg appearance-none bg-muted cursor-pointer accent-primary disabled:opacity-50"
        style={{
          background: disabled || muted
            ? 'hsl(var(--muted))'
            : `linear-gradient(to right, 
                hsl(var(--primary)) 0%, 
                hsl(var(--primary)) ${value * 100}%, 
                hsl(var(--muted)) ${value * 100}%, 
                hsl(var(--muted)) 100%)`,
        }}
      />

      {/* Quick preset buttons */}
      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => onChange(0.25)}
          disabled={disabled || muted}
          className={`flex-1 min-w-12 px-2 py-1 rounded text-xs font-bold transition-all ${
            Math.abs(value - 0.25) < 0.05
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-muted/80'
          } disabled:opacity-50`}
        >
          25%
        </button>
        <button
          onClick={() => onChange(0.5)}
          disabled={disabled || muted}
          className={`flex-1 min-w-12 px-2 py-1 rounded text-xs font-bold transition-all ${
            Math.abs(value - 0.5) < 0.05
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-muted/80'
          } disabled:opacity-50`}
        >
          50%
        </button>
        <button
          onClick={() => onChange(0.75)}
          disabled={disabled || muted}
          className={`flex-1 min-w-12 px-2 py-1 rounded text-xs font-bold transition-all ${
            Math.abs(value - 0.75) < 0.05
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-muted/80'
          } disabled:opacity-50`}
        >
          75%
        </button>
        <button
          onClick={() => onChange(1)}
          disabled={disabled || muted}
          className={`flex-1 min-w-12 px-2 py-1 rounded text-xs font-bold transition-all ${
            Math.abs(value - 1) < 0.05
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-muted/80'
          } disabled:opacity-50`}
        >
          Max
        </button>
      </div>
    </div>
  );
}