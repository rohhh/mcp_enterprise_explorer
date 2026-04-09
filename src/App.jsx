import React, { useState, useEffect, useMemo } from 'react';
import { Search, Server, Wrench, Menu, X, ChevronDown, ChevronUp, Database, Activity, Code, Info, Layers, Sun, Moon, Loader2, FileJson, Upload, Lightbulb } from 'lucide-react';

// Custom Eye of Horus Icon
const HorusIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 15v6" />
    <path d="M12 16.5c-2 1-4 1.5-6 1.5" />
  </svg>
);

// Helper component for parameter pills (Hovering displays type/default/status)
const ParamPill = ({ param }) => (
  <div className="relative group inline-block mr-2 mb-2">
    <div className={`
      px-3 py-1 rounded-full border text-xs cursor-help transition-colors
      ${param.required 
        ? 'border-slate-500 text-slate-100 font-bold bg-[#111] dark:bg-slate-800' 
        : 'border-slate-700 text-slate-400 font-normal bg-slate-900 dark:bg-slate-950'}
    `}>
      {param.name}
    </div>
    
    {/* Tooltip Overlay */}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-[220px] bg-slate-800 text-slate-200 text-xs rounded-md p-2.5 shadow-xl border border-slate-700 z-50">
      <div className="font-bold text-slate-100 mb-1">{param.name}</div>
      {param.type && param.type !== 'Unknown' && (
        <div className="text-slate-400 mt-1">
          Type: <span className="text-slate-300 font-mono ml-1">{param.type}</span>
        </div>
      )}
      {param.default && (
        <div className="text-slate-400 mt-0.5">
          Default: <span className="text-slate-300 font-mono ml-1">{param.default}</span>
        </div>
      )}
      <div className="text-slate-400 mt-1">
        Status: <span className={param.required ? "text-rose-400 ml-1 font-medium" : "text-emerald-400 ml-1 font-medium"}>
          {param.required ? 'Required' : 'Optional'}
        </span>
      </div>
      
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 transform rotate-45"></div>
    </div>
  </div>
);

export default function App() {
  const [rawJsonData, setRawJsonData] = useState([]);
  const [tools, setTools] = useState([]);
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTool, setExpandedTool] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dataset Selection State
  const [selectedDataset, setSelectedDataset] = useState('healthcare');
  const [isFetchingDataset, setIsFetchingDataset] = useState(false);
  const [loadError, setLoadError] = useState('');

  // State for Tips for Tasking Modal
  const [isTipsOpen, setIsTipsOpen] = useState(false);

  // Fetch the selected JSON dataset from the public folder
  useEffect(() => {
    const fetchDataset = async () => {
      setIsFetchingDataset(true);
      setTools([]);
      setServers([]);
      setRawJsonData([]);
      setLoadError('');
      
      try {
        const filename = selectedDataset === 'healthcare' 
          ? 'healthcare-clinical-tools.json' 
          : 'professional-tools.json';
        
        // Guard against Canvas preview 'blob:' environment which breaks relative fetching
        if (window.location.protocol === 'blob:' || window.origin === 'null') {
          throw new Error('BLOB_ENV');
        }

        const response = await fetch(filename);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRawJsonData(data);
      } catch (error) {
        // Silently handle known preview environment restrictions without throwing console errors
        if (error.message === 'BLOB_ENV' || error.name === 'TypeError') {
          setLoadError(`Preview Mode: Cannot automatically fetch local files in this preview environment. Please use the fallback upload button below to load '${selectedDataset === 'healthcare' ? 'healthcare-clinical-tools.json' : 'professional-tools.json'}'. (This will work perfectly once deployed!)`);
        } else {
          console.error("Error loading dataset:", error);
          setLoadError(`Missing File: Could not find '${selectedDataset === 'healthcare' ? 'healthcare-clinical-tools.json' : 'professional-tools.json'}' in your public folder.`);
        }
      } finally {
        setIsFetchingDataset(false);
      }
    };

    fetchDataset();
  }, [selectedDataset]);

  // Fallback Manual Upload for Preview Environments
  const handleFallbackUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (Array.isArray(json)) {
          setRawJsonData(json);
          setLoadError(''); // Clear error on success
        } else {
          alert("The JSON file must contain an array of tools.");
        }
      } catch (err) {
        alert("Invalid JSON format. Please upload a valid JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = null; 
  };

  // Parse the native JSON payload and dynamically build the server list
  useEffect(() => {
    const parseToolsAndServers = () => {
      if (!rawJsonData || rawJsonData.length === 0) return;

      const serverMap = new Map();
      const parsedTools = rawJsonData.map(tool => {
        const id = tool.name || 'unknown';
        
        // Dynamically assign server based on prefix
        const assignedServer = id.split('_')[0] || 'general';
        const shortName = id.replace(`${assignedServer}_`, '');

        // Track server counts
        if (!serverMap.has(assignedServer)) {
          serverMap.set(assignedServer, {
            id: assignedServer,
            label: assignedServer.charAt(0).toUpperCase() + assignedServer.slice(1).replace('-', ' '),
            count: 0,
            icon: Database
          });
        }
        serverMap.get(assignedServer).count++;

        // Advanced parsing for parameters from JSON Schema
        const parameters = [];
        let properties = tool.inputSchema?.properties || {};
        let requiredProps = tool.inputSchema?.required || [];

        // Support for JSON Schema `$defs` pattern
        if (Object.keys(properties).length === 0 && tool.inputSchema?.$defs) {
          const defs = Object.values(tool.inputSchema.$defs);
          if (defs.length > 0) {
            properties = defs[0].properties || {};
            requiredProps = defs[0].required || [];
          }
        }

        Object.entries(properties).forEach(([key, value]) => {
          let type = value.type || 'Unknown';
          
          if (value.anyOf && Array.isArray(value.anyOf)) {
             const actualType = value.anyOf.find(t => t.type && t.type !== 'null');
             if (actualType) type = actualType.type;
          }

          let defaultVal = '';
          if (value.default !== undefined && value.default !== null) {
            defaultVal = typeof value.default === 'object' ? JSON.stringify(value.default) : String(value.default);
          }

          parameters.push({ 
            name: key, 
            required: requiredProps.includes(key), 
            type: type, 
            default: defaultVal
          });
        });

        const schemaStr = tool.inputSchema ? JSON.stringify(tool.inputSchema, null, 2) : '';

        return {
          id: id,
          name: shortName,
          server: assignedServer,
          description: tool.description?.trim() || 'No description provided.',
          schema: schemaStr,
          parameters: parameters
        };
      });

      // Sort servers by tool count descending
      const dynamicServers = Array.from(serverMap.values()).sort((a, b) => b.count - a.count);

      setTools(parsedTools);
      setServers(dynamicServers);
      setSelectedServer('all'); // Reset server selection on dataset change
    };

    parseToolsAndServers();
  }, [rawJsonData]);

  const filteredTools = useMemo(() => {
    // Normalize query by removing spaces, underscores, and hyphens
    const normalizedQuery = searchQuery.toLowerCase().replace(/[_ \-]/g, '');
    
    return tools.filter(tool => {
      // Normalize target text the exact same way
      const normalizedName = tool.name.toLowerCase().replace(/[_ \-]/g, '');
      const normalizedDesc = tool.description.toLowerCase().replace(/[_ \-]/g, '');
      
      const matchesSearch = normalizedName.includes(normalizedQuery) || 
                            normalizedDesc.includes(normalizedQuery);
                            
      const matchesServer = selectedServer === 'all' ? true : tool.server === selectedServer;
      return matchesSearch && matchesServer;
    });
  }, [tools, searchQuery, selectedServer]);

  const activeServerData = selectedServer === 'all' 
    ? { label: 'All Servers' } 
    : servers.find(s => s.id === selectedServer);

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 dark:bg-black/50 z-20 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Tips for Tasking Modal Overlay */}
      {isTipsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsTipsOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-900/20">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Tips for Tasking</h3>
              </div>
              <button onClick={() => setIsTipsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/50 space-y-6">
              
              {/* Superior Block: Best Practices */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h4 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-emerald-500" /> Best Practices
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>Always add the Brave tool when available (not just to check the date or search for general things), as finding information not covered by other tools can save an entire task.</li>
                  <li>Select the correct category and target for your rubrics; the reviewer will thank you.</li>
                  <li>Add <strong>N/A</strong> to the agent rubrics evaluation if there are no issues.</li>
                  <li>If the agent executed a flawless trajectory but did not include the assistant messages, its maximum score is a 4. Use the error category <strong>"Others"</strong> and add a short explanation: <em>"The trajectory is good, but it is missing the assistant messages."</em></li>
                </ul>
              </div>

              {/* Inferior Block: Tips to avoid fails */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h4 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                   <Activity className="w-4 h-4 text-rose-500" /> Tips to avoid fails
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>Experiment with the tools in the playground to understand what output to expect; this will help you craft the history of your task effectively.</li>
                  <li>Keep your questions focused and avoid being too broad. Always remember that you need to create rubrics for each case. Instead of asking how the universe was born or listing all the stars, ask for the planets in the solar system—or even better, the planets in the solar system larger than Earth. This provides a deterministic request that is easy to evaluate.</li>
                  <li>Check for redundant information across similar tool outputs. If you call one tool and a subsequent call yields the exact same information, it is considered a fail.</li>
                  <li>Always ensure a tool call has a <strong>Tool Selection</strong> rubric, at least one <strong>Query Construction</strong> rubric, and at least one <strong>Multi-Step Planning</strong> rubric (this is often missed). Additionally, include one <strong>Outcome Rubric</strong> per prompt request.</li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar - Servers List */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HorusIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="font-bold text-lg tracking-tight text-slate-800 dark:text-slate-100">Horus MCP Explorer</h1>
          </div>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* ✨ Dataset Dropdown ✨ */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Select Tool Catalog
          </label>
          <div className="relative">
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              disabled={isFetchingDataset}
              className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <option value="healthcare">Healthcare Clinical Tools</option>
              <option value="professional">Professional Tools</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          
          {/* Professional Tools Warning */}
          {selectedDataset === 'professional' && (
            <div className="mt-3 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-md border border-amber-200 dark:border-amber-800/50 leading-relaxed shadow-sm">
              <Info className="w-3.5 h-3.5 inline mr-1 mb-0.5" />
              Some tools have limitations. Check <a href="https://psinghal20.github.io/persona-mock-data/tools/professional/" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-amber-800 dark:hover:text-amber-300">here</a>.
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          <div className="px-3 pb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Connected Servers ({servers.length})
          </div>
          
          {isFetchingDataset ? (
            <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400 text-sm">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-indigo-500" />
              <p>Loading dataset...</p>
            </div>
          ) : servers.length > 0 ? (
            <nav className="space-y-0.5 px-2">
              <button
                onClick={() => {
                  setSelectedServer('all');
                  setSearchQuery('');
                  setSidebarOpen(false);
                  setExpandedTool(null);
                }}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors mb-2
                  ${selectedServer === 'all' 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm border border-indigo-100 dark:border-indigo-800/50' 
                    : 'text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <Layers className={`w-4 h-4 shrink-0 ${selectedServer === 'all' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="truncate">All Servers</span>
                </div>
                <span className={`
                  shrink-0 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full
                  ${selectedServer === 'all' ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}
                `}>
                  {tools.length}
                </span>
              </button>

              {servers.map((server) => {
                const isActive = selectedServer === server.id;
                const Icon = server.icon || Database;
                
                return (
                  <button
                    key={server.id}
                    onClick={() => {
                      setSelectedServer(server.id);
                      setSearchQuery('');
                      setSidebarOpen(false);
                      setExpandedTool(null);
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                      ${isActive 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span className="truncate">{server.label}</span>
                    </div>
                    <span className={`
                      shrink-0 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full
                      ${isActive ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}
                    `}>
                      {server.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          ) : null}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
        {/* Top Header Bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-4 justify-between">
          <div className="flex items-center flex-1 gap-4 max-w-2xl">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                placeholder={`Search tools in ${activeServerData?.label || 'All Servers'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={tools.length === 0 || isFetchingDataset}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-shadow placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* ✨ Tips for Tasking Toggle */}
            <button
              onClick={() => setIsTipsOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg font-medium text-sm transition-colors focus:outline-none"
            >
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">Tips for Tasking</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Server Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                  {activeServerData?.label || 'Catalog View'}
                </h2>
                {selectedServer !== 'all' && tools.length > 0 && !isFetchingDataset && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Server ID: <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono text-xs">{selectedServer}</code>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                <Wrench className="w-4 h-4" />
                <span className="font-medium text-slate-900 dark:text-white">{filteredTools.length}</span> tools available
              </div>
            </div>

            {/* Tools List */}
            {isFetchingDataset ? (
               <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl border-dashed">
                 <Loader2 className="w-12 h-12 text-indigo-500 mx-auto mb-4 animate-spin" />
                 <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200">Loading Catalog...</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Fetching the JSON file from your public folder.</p>
               </div>
            ) : loadError ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl border-dashed">
                <FileJson className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200">Local Fetch Failed</h3>
                <p className="text-sm text-rose-500 dark:text-rose-400 mt-2 max-w-md mx-auto">
                  {loadError}
                </p>
                <label className="mt-6 inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors shadow-sm font-medium">
                  <Upload className="w-4 h-4 mr-2" />
                  Manually Load JSON
                  <input type="file" accept=".json" className="hidden" onChange={handleFallbackUpload} />
                </label>
              </div>
            ) : filteredTools.length > 0 ? (
              <div className="space-y-4 pb-32">
                {filteredTools.map((tool) => (
                  <div 
                    key={tool.id} 
                    className={`
                      bg-white dark:bg-slate-900 border rounded-xl transition-all duration-200
                      ${expandedTool === tool.id ? 'border-indigo-300 dark:border-indigo-600 shadow-md ring-1 ring-indigo-100 dark:ring-indigo-900/50' : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'}
                    `}
                  >
                    {/* Tool Header */}
                    <button 
                      onClick={() => setExpandedTool(expandedTool === tool.id ? null : tool.id)}
                      className={`
                        w-full text-left px-5 py-4 flex items-start justify-between gap-4 focus:outline-none 
                        ${expandedTool === tool.id ? 'rounded-t-xl' : 'rounded-xl'}
                      `}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {selectedServer === 'all' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-wider shrink-0">
                              {tool.server}
                            </span>
                          )}
                          <h3 className="font-semibold text-base truncate text-slate-900 dark:text-slate-100">
                            {tool.name}
                          </h3>
                          {tool.parameters.length > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">
                              Requires Params
                            </span>
                          )}
                        </div>
                        <p className={`text-sm text-slate-500 dark:text-slate-400 ${expandedTool === tool.id ? '' : 'line-clamp-2'}`}>
                          {tool.description}
                        </p>
                      </div>
                      <div className="shrink-0 mt-1 text-slate-400 dark:text-slate-500">
                        {expandedTool === tool.id ? (
                          <ChevronUp className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </button>

                    {/* Expandable Details Area */}
                    {expandedTool === tool.id && (
                      <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pt-4 rounded-b-xl">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          
                          {/* Left Col: Info & Parameters */}
                          <div className="flex flex-col gap-6">
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5" /> General Info
                              </h4>
                              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm">
                                <div className="mb-2">
                                  <span className="text-slate-500 dark:text-slate-400 block text-xs">Full Identifier</span>
                                  <code className="text-slate-800 dark:text-slate-200 font-mono text-[13px]">{tool.id}</code>
                                </div>
                                <div>
                                  <span className="text-slate-500 dark:text-slate-400 block text-xs">Parent Server</span>
                                  <span className="text-slate-800 dark:text-slate-200 text-[13px]">{tool.server}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                               <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5" /> Parameters Info
                              </h4>
                              <div className="bg-[#1a1c23] rounded-lg p-4 shadow-inner">
                                {tool.parameters && tool.parameters.length > 0 ? (
                                  <div>
                                    {tool.parameters.filter(p => p.required).length > 0 && (
                                      <div className="mb-4">
                                        <div className="text-slate-300 text-[13px] mb-2 font-medium">Required Parameters:</div>
                                        <div className="flex flex-wrap">
                                          {tool.parameters.filter(p => p.required).map(p => (
                                            <ParamPill key={p.name} param={p} />
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {tool.parameters.filter(p => !p.required).length > 0 && (
                                      <div>
                                        <div className="text-slate-400 text-[13px] mb-2 font-medium mt-1">Optional Parameters:</div>
                                        <div className="flex flex-wrap">
                                          {tool.parameters.filter(p => !p.required).map(p => (
                                            <ParamPill key={p.name} param={p} />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-slate-500 text-xs font-mono italic flex items-center py-2">
                                    No specific input parameters required.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Col: Schema & Mock Generator */}
                          <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Code className="w-3.5 h-3.5" /> Input Schema
                              </h4>
                              
                            </div>
                            
                            <div className="bg-slate-900 rounded-lg overflow-hidden shadow-inner flex flex-col h-full min-h-[200px]">
                              {/* Original Schema View */}
                              <div className="p-3 overflow-x-auto flex-1">
                                {tool.schema ? (
                                  <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap leading-relaxed h-full">
                                    {tool.schema.replace('Properties: ', '{\n  ').replace(/,/g, ',\n  ') + (tool.schema.includes('Properties:') ? '\n}' : '')}
                                  </pre>
                                ) : (
                                  <div className="text-slate-500 text-xs font-mono italic h-full flex items-center">
                                    No schema definition provided.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
            
          </div>
        </div>
      </main>
    </div>
  );
}