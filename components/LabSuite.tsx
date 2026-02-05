
import React, { useState } from 'react';
import { LabModule, GeochemData, GeochronAge } from '../types';
import QFLPlotter from './QFLPlotter';

interface LabSuiteProps {
  activeModule: LabModule;
  onAnalyze: (type: string, data: any) => void;
}

const LabSuite: React.FC<LabSuiteProps> = ({ activeModule, onAnalyze }) => {
  const [qfl, setQfl] = useState({ q: 0, f: 0, l: 0 });
  const [geochem, setGeochem] = useState<GeochemData>({
    al2o3: 0, cao: 0, na2o: 0, k2o: 0, th: 0, sc: 0, la: 0, zr: 0
  });

  const [geochronAges, setGeochronAges] = useState<GeochronAge[]>([]);
  const [newAge, setNewAge] = useState<Partial<GeochronAge>>({ mineral: 'Zircon', method: 'U-Pb', age: 0, error: 0 });

  const calculateCIA = () => {
    const { al2o3, cao, na2o, k2o } = geochem;
    const sum = (al2o3 || 0) + (cao || 0) + (na2o || 0) + (k2o || 0);
    if (sum === 0) return 0;
    return ((al2o3 || 0) / sum) * 100;
  };

  const addAge = () => {
    if (newAge.age && newAge.error) {
      setGeochronAges([...geochronAges, { ...newAge, id: Math.random().toString(36).substr(2, 9) } as GeochronAge]);
      setNewAge({ mineral: 'Zircon', method: 'U-Pb', age: 0, error: 0 });
    }
  };

  const removeAge = (id: string) => {
    setGeochronAges(geochronAges.filter(a => a.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          const validAges = (Array.isArray(parsed) ? parsed : [parsed]).map(item => ({
            ...item,
            id: Math.random().toString(36).substr(2, 9),
            age: Number(item.age),
            error: Number(item.error)
          }));
          setGeochronAges([...geochronAges, ...validAges]);
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n');
          const headers = lines[0].toLowerCase().split(',');
          const newEntries: GeochronAge[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',');
            const entry: any = { id: Math.random().toString(36).substr(2, 9) };
            headers.forEach((h, idx) => {
              const cleanH = h.trim();
              if (cleanH === 'mineral') entry.mineral = values[idx]?.trim();
              if (cleanH === 'method') entry.method = values[idx]?.trim();
              if (cleanH === 'age') entry.age = parseFloat(values[idx]?.trim());
              if (cleanH === 'error' || cleanH === 'uncertainty') entry.error = parseFloat(values[idx]?.trim());
            });
            if (entry.age && entry.error) newEntries.push(entry as GeochronAge);
          }
          setGeochronAges([...geochronAges, ...newEntries]);
        }
      } catch (err) {
        console.error("Failed to parse geochronology file", err);
      }
    };
    reader.readAsText(file);
  };

  const renderModuleContent = () => {
    switch (activeModule) {
      case LabModule.QFL:
        return (
          <div className="space-y-4">
            <QFLPlotter data={qfl} onChange={setQfl} />
            <button 
              onClick={() => onAnalyze('Dickinson QFL', qfl)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded transition"
            >
              Analyze Provenance
            </button>
          </div>
        );
      
      case LabModule.CIA:
        return (
          <div className="bg-stone-900 p-4 rounded-lg border border-amber-900/30">
            <h3 className="text-amber-500 font-bold mb-4">Chemical Index of Alteration (CIA)</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {['al2o3', 'cao', 'na2o', 'k2o'].map((oxide) => (
                <div key={oxide}>
                  <label className="text-xs text-stone-400 uppercase">{oxide} (wt%)</label>
                  <input
                    type="number"
                    value={geochem[oxide as keyof GeochemData] || ''}
                    onChange={(e) => setGeochem({ ...geochem, [oxide]: parseFloat(e.target.value) })}
                    className="w-full bg-stone-800 border border-stone-700 rounded p-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              ))}
            </div>
            <div className="p-4 bg-stone-950 rounded border border-amber-500/20 text-center">
              <span className="text-stone-400 text-sm">Calculated CIA:</span>
              <div className="text-3xl font-bold text-amber-400">{calculateCIA().toFixed(1)}</div>
            </div>
            <button 
              onClick={() => onAnalyze('CIA and Weathering', { ...geochem, cia: calculateCIA() })}
              className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded transition"
            >
              Interpret Weathering
            </button>
          </div>
        );

      case LabModule.XRD:
      case LabModule.XRF:
      case LabModule.ICPMS:
        return (
          <div className="bg-stone-900 p-6 rounded-lg border border-amber-900/30 text-center">
            <i className="fas fa-file-import text-4xl text-amber-500/50 mb-4"></i>
            <h3 className="text-xl font-bold mb-2">Import {activeModule} Data</h3>
            <p className="text-stone-400 text-sm mb-6">Upload CSV, XLSX, or paste raw tabular data for automated petrological extraction.</p>
            <input type="file" className="hidden" id="lab-file-upload" />
            <label 
              htmlFor="lab-file-upload"
              className="cursor-pointer bg-stone-800 hover:bg-stone-700 border border-stone-600 px-6 py-3 rounded-lg block transition font-medium"
            >
              Choose Data File
            </label>
          </div>
        );

      case LabModule.Orogenic:
        return (
          <div className="space-y-4">
             <div className="bg-stone-900 p-4 rounded-lg border border-amber-900/30">
                <h3 className="text-amber-500 font-bold mb-4">Unroofing Phase Estimation</h3>
                <div className="space-y-3">
                  {['Phase 1 – Sedimentary Cover', 'Phase 2 – Metamorphic Veneer', 'Phase 3 – Crystalline Core'].map((phase, idx) => (
                    <button 
                      key={idx}
                      onClick={() => onAnalyze('Orogenic Unroofing', { phase })}
                      className="w-full text-left p-3 bg-stone-800 hover:bg-amber-900/20 border border-stone-700 rounded transition flex justify-between items-center"
                    >
                      <span>{phase}</span>
                      <i className="fas fa-chevron-right text-xs text-amber-500"></i>
                    </button>
                  ))}
                </div>
             </div>
          </div>
        );

      case LabModule.Geochronology:
        return (
          <div className="space-y-4">
            <div className="bg-stone-900 p-4 rounded-lg border border-amber-900/30">
              <h3 className="text-amber-500 font-bold mb-4 flex items-center gap-2">
                <i className="fas fa-hourglass-half"></i> Geochronology Suite
              </h3>
              
              <div className="space-y-4 mb-6 p-3 bg-stone-800/50 rounded-lg border border-stone-700">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-500 uppercase">Mineral</label>
                    <select 
                      value={newAge.mineral}
                      onChange={e => setNewAge({...newAge, mineral: e.target.value})}
                      className="w-full bg-stone-800 border border-stone-700 rounded p-1 text-xs text-stone-200"
                    >
                      <option>Zircon</option>
                      <option>Muscovite</option>
                      <option>Biotite</option>
                      <option>Apatite</option>
                      <option>Monazite</option>
                      <option>Hornblende</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 uppercase">Method</label>
                    <select 
                      value={newAge.method}
                      onChange={e => setNewAge({...newAge, method: e.target.value as any})}
                      className="w-full bg-stone-800 border border-stone-700 rounded p-1 text-xs text-stone-200"
                    >
                      <option>U-Pb</option>
                      <option>Ar-Ar</option>
                      <option>K-Ar</option>
                      <option>FT</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-500 uppercase">Age (Ma)</label>
                    <input 
                      type="number"
                      value={newAge.age || ''}
                      onChange={e => setNewAge({...newAge, age: parseFloat(e.target.value)})}
                      className="w-full bg-stone-800 border border-stone-700 rounded p-1 text-xs text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 uppercase">± Error</label>
                    <input 
                      type="number"
                      value={newAge.error || ''}
                      onChange={e => setNewAge({...newAge, error: parseFloat(e.target.value)})}
                      className="w-full bg-stone-800 border border-stone-700 rounded p-1 text-xs text-stone-200"
                    />
                  </div>
                </div>
                <button 
                  onClick={addAge}
                  className="w-full bg-amber-900/30 hover:bg-amber-900/50 text-amber-500 border border-amber-900/50 text-xs py-1.5 rounded transition flex items-center justify-center gap-2"
                >
                  <i className="fas fa-plus"></i> Add Age Entry
                </button>
              </div>

              {geochronAges.length > 0 && (
                <div className="mb-4">
                  <div className="max-h-48 overflow-y-auto custom-scrollbar bg-stone-950/50 rounded p-2 border border-stone-800">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="text-stone-500 border-b border-stone-800">
                          <th className="pb-2 font-medium uppercase text-[9px]">Mineral</th>
                          <th className="pb-2 font-medium uppercase text-[9px]">Method</th>
                          <th className="pb-2 font-medium uppercase text-[9px]">Age (Ma)</th>
                          <th className="pb-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {geochronAges.map(age => (
                          <tr key={age.id} className="border-b border-stone-800/50 group">
                            <td className="py-2 text-stone-400 font-medium">{age.mineral}</td>
                            <td className="py-2">
                               <span className={`px-1.5 py-0.5 rounded text-[9px] ${age.method === 'U-Pb' ? 'bg-blue-900/30 text-blue-400' : 'bg-green-900/30 text-green-400'}`}>
                                 {age.method}
                               </span>
                            </td>
                            <td className="py-2 font-mono text-amber-500/80">
                                {age.age.toFixed(1)} <span className="text-[10px] text-stone-600">± {age.error.toFixed(2)}</span>
                            </td>
                            <td className="py-2 text-right">
                              <button onClick={() => removeAge(age.id)} className="text-stone-700 hover:text-red-500 transition px-2">
                                <i className="fas fa-times"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Correlation Insight Preview */}
                  <div className="mt-3 p-3 bg-amber-500/5 rounded border border-amber-500/20">
                    <div className="text-[9px] uppercase tracking-widest text-amber-600 font-bold mb-1">Correlation Preview</div>
                    <div className="text-xs text-stone-400 italic leading-snug">
                       {geochronAges.length} data points spanning {Math.min(...geochronAges.map(a => a.age)).toFixed(1)} to {Math.max(...geochronAges.map(a => a.age)).toFixed(1)} Ma.
                       Potential correlation with {geochronAges.some(a => a.age > 1000) ? 'Proterozoic Basement' : 'Phanerozoic Orogeny'}.
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 mt-4">
                <button 
                  onClick={() => onAnalyze('Geochronology Interpretation', geochronAges)}
                  disabled={geochronAges.length === 0}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded shadow-lg shadow-amber-900/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-clock"></i> Correlate Orogeny
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-stone-800"></div>
                  <span className="text-stone-600 text-[10px] uppercase font-bold">OR</span>
                  <div className="flex-1 h-px bg-stone-800"></div>
                </div>
                <label className="w-full bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 text-center py-2 rounded cursor-pointer transition flex items-center justify-center gap-2 text-xs font-medium">
                  <i className="fas fa-file-csv"></i> Import CSV/JSON
                  <input type="file" className="hidden" accept=".csv,.json" onChange={handleFileUpload} />
                </label>
                <div className="text-[9px] text-stone-600 text-center">Supported: mineral, method, age, error</div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64 text-stone-500">
            Select a module to begin analysis.
          </div>
        );
    }
  };

  return (
    <div className="h-full">
      {renderModuleContent()}
    </div>
  );
};

export default LabSuite;
