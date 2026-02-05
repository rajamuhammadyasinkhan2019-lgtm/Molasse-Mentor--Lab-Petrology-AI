
import React, { useState, useEffect, useRef } from 'react';
import { LabModule, ChatMessage, AnalysisResult } from './types';
import { REGIONAL_CASES, APP_THEME } from './constants';
import LabSuite from './components/LabSuite';
import { getPetrologicalAdvice, analyzeLabData, editPetrographicImage, searchGeologicalContext } from './services/geminiService';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<LabModule>(LabModule.QFL);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      content: "Greetings. I am Molasse Mentor. I have initialized my multimodal analysis suite. You may now upload thin-section screenshots, PDF reports, or geochemical datasets (CSV/JSON) for integrated petrological interpretation." 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && !uploadedImage) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getPetrologicalAdvice([...messages, userMsg], uploadedImage || undefined);
      setMessages(prev => [...prev, { role: 'model', content: response }]);
      setUploadedImage(null);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: "An error occurred during interpretation. Please check your data inputs." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLabAnalysis = async (type: string, data: any) => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: `[Auto-Analysis Trigger] Analyzing ${type} data: ${JSON.stringify(data)}` }]);
    try {
      const result = await analyzeLabData(type, data);
      setMessages(prev => [...prev, { role: 'model', content: result }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: "Laboratory analysis failed. Ensure data formats are correct." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden text-stone-200">
      {/* Sidebar */}
      <aside className="w-72 bg-stone-900 border-r border-stone-800 flex flex-col">
        <div className="p-6 border-b border-stone-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-amber-900/20">
            <i className="fas fa-microscope text-xl"></i>
          </div>
          <div>
            <h1 className="font-bold text-amber-500 leading-tight">MOLASSE MENTOR</h1>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest">Lab & Petrology AI</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h2 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3 px-2">Analysis Lab</h2>
            <div className="space-y-1">
              {[LabModule.XRD, LabModule.XRF, LabModule.ICPMS, LabModule.DTA, LabModule.CIA, LabModule.Geochronology].map(mod => (
                <button
                  key={mod}
                  onClick={() => setActiveModule(mod)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition flex items-center gap-3 ${activeModule === mod ? 'bg-amber-900/20 text-amber-400 border border-amber-900/50' : 'hover:bg-stone-800 text-stone-400'}`}
                >
                  <i className={`fas ${mod === LabModule.CIA ? 'fa-calculator' : mod === LabModule.Geochronology ? 'fa-hourglass-half' : 'fa-flask-vial'} w-4`}></i>
                  {mod}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3 px-2">Petrography</h2>
            <div className="space-y-1">
              {[LabModule.QFL, LabModule.Orogenic, LabModule.Basins].map(mod => (
                <button
                  key={mod}
                  onClick={() => setActiveModule(mod)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition flex items-center gap-3 ${activeModule === mod ? 'bg-amber-900/20 text-amber-400 border border-amber-900/50' : 'hover:bg-stone-800 text-stone-400'}`}
                >
                  <i className={`fas ${mod === LabModule.QFL ? 'fa-chart-area' : mod === LabModule.Orogenic ? 'fa-layer-group' : 'fa-map-location-dot'} w-4`}></i>
                  {mod}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3 px-2">Regional Library</h2>
            <div className="space-y-2">
              {REGIONAL_CASES.map((basin) => (
                <div 
                  key={basin.name} 
                  className="p-3 bg-stone-950/50 rounded-lg border border-stone-800 hover:border-amber-900/30 transition cursor-pointer group"
                  onClick={() => handleLabAnalysis('Regional Reference', basin)}
                >
                  <div className="text-xs font-bold text-amber-600 group-hover:text-amber-400">{basin.name}</div>
                  <div className="text-[10px] text-stone-500">{basin.region}</div>
                </div>
              ))}
            </div>
          </section>
        </nav>

        <footer className="p-4 border-t border-stone-800 bg-stone-950/50">
          <div className="text-[10px] text-stone-500 uppercase mb-1">Lead Developer</div>
          <div className="text-xs font-medium text-amber-600/80">Muhammad Yasin Khan</div>
          <div className="text-[9px] text-stone-600 mt-2">Molasse Mentor v2.5</div>
        </footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-stone-950 relative">
        {/* Top Header */}
        <header className="h-16 border-b border-stone-900 flex items-center justify-between px-6 bg-stone-950/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-6">
            <div className="text-sm flex items-center gap-2 text-stone-400">
              <i className="fas fa-globe-americas"></i>
              <span className="font-medium">Foreland Basin Map</span>
            </div>
            <div className="text-sm flex items-center gap-2 text-stone-400">
              <i className="fas fa-book-atlas"></i>
              <span className="font-medium">Reference Atlas</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-stone-900 hover:bg-stone-800 border border-stone-800 px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2">
              <i className="fas fa-download"></i> Export Data
            </button>
            <button className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-lg shadow-amber-900/20 transition">
              Final Report
            </button>
          </div>
        </header>

        {/* Dynamic Workspace */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row p-6 gap-6">
          {/* Left Side: Lab Tools */}
          <div className="w-full md:w-[400px] flex flex-col gap-6">
             <div className="flex-1 overflow-y-auto custom-scrollbar">
                <LabSuite activeModule={activeModule} onAnalyze={handleLabAnalysis} />
             </div>
          </div>

          {/* Right Side: Chat AI Advisor */}
          <div className="flex-1 flex flex-col bg-stone-900/50 rounded-xl border border-stone-800 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-stone-800 bg-stone-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <i className="fas fa-robot text-amber-500 text-sm"></i>
                </div>
                <div>
                  <div className="text-sm font-bold text-amber-500">Petrological Advisor</div>
                  <div className="text-[10px] text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Multimodal Suite Active
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-200 border border-stone-700'} shadow-sm`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed font-serif">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-stone-800 border border-stone-700 p-4 rounded-2xl animate-pulse">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-stone-900 border-t border-stone-800">
              {uploadedImage && (
                <div className="mb-3 relative inline-block">
                  <img src={uploadedImage} alt="Upload preview" className="h-20 w-auto rounded border border-amber-500/50" />
                  <button 
                    onClick={() => setUploadedImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
              <form onSubmit={handleSend} className="relative flex items-center gap-2">
                <input
                  type="file"
                  id="image-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <label 
                  htmlFor="image-upload"
                  className="p-3 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded-xl cursor-pointer transition border border-stone-700"
                >
                  <i className="fas fa-camera-retro"></i>
                </label>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask for petrological reasoning or provenance interpretation..."
                  className="flex-1 bg-stone-800 text-sm border border-stone-700 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition shadow-inner"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="p-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition disabled:opacity-50 shadow-lg shadow-amber-900/20"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </div>
  );
};

export default App;
