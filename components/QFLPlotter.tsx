
import React, { useMemo } from 'react';
import { QFLData } from '../types';

interface QFLPlotterProps {
  data: QFLData;
  onChange: (data: QFLData) => void;
}

const QFLPlotter: React.FC<QFLPlotterProps> = ({ data, onChange }) => {
  const sum = data.q + data.f + data.l;
  const normalized = useMemo(() => {
    if (sum === 0) return { q: 0, f: 0, l: 0 };
    return {
      q: (data.q / sum) * 100,
      f: (data.f / sum) * 100,
      l: (data.l / sum) * 100,
    };
  }, [data, sum]);

  // SVG dimensions
  const width = 300;
  const height = 260;
  const padding = 20;
  const side = width - 2 * padding;
  const triangleHeight = (Math.sqrt(3) / 2) * side;

  // Vertices (Normalized for SVG coordinates)
  const qVertex = { x: width / 2, y: padding };
  const fVertex = { x: padding, y: padding + triangleHeight };
  const lVertex = { x: width - padding, y: padding + triangleHeight };

  // Convert QFL to XY
  const pointX = padding + (normalized.l / 100) * side + (normalized.q / 100) * (side / 2);
  const pointY = padding + triangleHeight - (normalized.q / 100) * triangleHeight;

  const handleInputChange = (field: keyof QFLData, value: string) => {
    const num = parseFloat(value) || 0;
    onChange({ ...data, [field]: num });
  };

  return (
    <div className="bg-stone-900 p-4 rounded-lg border border-amber-900/30">
      <h3 className="text-amber-500 font-bold mb-4 flex items-center gap-2">
        <i className="fas fa-mountain"></i> Dickinson QFL Plotter
      </h3>
      
      <div className="flex justify-center mb-4">
        <svg width={width} height={height} className="overflow-visible">
          {/* Main Triangle */}
          <path
            d={`M ${qVertex.x} ${qVertex.y} L ${fVertex.x} ${fVertex.y} L ${lVertex.x} ${lVertex.y} Z`}
            fill="rgba(245, 158, 11, 0.05)"
            stroke="#f59e0b"
            strokeWidth="2"
          />
          
          {/* Field Boundaries (simplified) */}
          <line x1={qVertex.x} y1={qVertex.y} x2={width/2} y2={padding + triangleHeight} stroke="rgba(245,158,11,0.2)" strokeDasharray="4" />
          
          {/* Labels */}
          <text x={qVertex.x} y={qVertex.y - 5} textAnchor="middle" fill="#f59e0b" className="text-sm font-bold">Quartz (Q)</text>
          <text x={fVertex.x - 5} y={fVertex.y + 15} textAnchor="middle" fill="#f59e0b" className="text-sm font-bold">Feldspar (F)</text>
          <text x={lVertex.x + 5} y={lVertex.y + 15} textAnchor="middle" fill="#f59e0b" className="text-sm font-bold">Lithics (L)</text>

          {/* Data Point */}
          {sum > 0 && (
            <circle cx={pointX} cy={pointY} r="6" fill="#fbbf24" className="animate-pulse shadow-lg" />
          )}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {['q', 'f', 'l'].map((field) => (
          <div key={field} className="flex flex-col">
            <label className="text-xs text-stone-400 uppercase">{field}</label>
            <input
              type="number"
              value={data[field as keyof QFLData]}
              onChange={(e) => handleInputChange(field as keyof QFLData, e.target.value)}
              className="bg-stone-800 border border-stone-700 rounded p-1 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-2 bg-stone-800 rounded text-xs text-stone-400">
        Normalized: Q:{normalized.q.toFixed(1)}% F:{normalized.f.toFixed(1)}% L:{normalized.l.toFixed(1)}%
      </div>
    </div>
  );
};

export default QFLPlotter;
