import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Upload, Sliders, Play, Search, Filter, ArrowLeft, ArrowRight, 
  RotateCw, ZoomIn, ZoomOut, Save, RotateCcw, AlertCircle, CheckCircle2, 
  Layers, Edit3, History, Download, Compass, Plus, Trash2, Check, X,
  FileCheck, ShieldAlert, Sun, Moon, Database, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Project, Document, Extraction, FocusConstraint, Category, 
  Correction, DiagramData, BoundingBox 
} from './types';
import { CATEGORY_META, DEMO_USERS } from './data/demoData';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AuditTrailModal } from './components/AuditTrailModal';

export default function App() {
  // Theme and UI States
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentUser, setCurrentUser] = useState(DEMO_USERS[0]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('prj-alpha');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocId, setActiveDocId] = useState<string>('');
  const [activePage, setActivePage] = useState<number>(1);
  const [activeTab, setActiveTab2] = useState<'blueprint' | 'relationship'>('blueprint');

  // Focus box state
  const [focusList, setFocusList] = useState<FocusConstraint[]>([]);
  const [newFocusText, setNewFocusText] = useState('');
  const [newFocusTag, setNewFocusTag] = useState<'Columns' | 'MEP' | 'Materials' | 'Exclusion' | 'PageRange' | 'General' | 'Zoning'>('General');
  const [newFocusCategory, setNewFocusCategory] = useState<Category>('Structural');
  const [isFocusCollapsed, setIsFocusCollapsed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([
    'Spatial', 'Structural', 'MEP', 'Materials', 'Regulatory', 'Cost'
  ]);
  const [sortBy, setSortBy] = useState<'confidence' | 'page' | 'category' | 'time'>('confidence');

  // Interactive Highlighting States
  const [selectedExtraction, setSelectedExtraction] = useState<Extraction | null>(null);
  const [hoveredExtraction, setHoveredExtraction] = useState<Extraction | null>(null);
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  
  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Zoom / Viewport controls
  const [zoomLevel, setZoomLevel] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Modals & Auditing
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // New Project popup state
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // Mock Upload state
  const [isUploading, setIsUploading] = useState(false);

  // Keyboard shortcut modal
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const viewContainerRef = useRef<HTMLDivElement>(null);

  // Theme effect
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Load Initial Data
  useEffect(() => {
    fetchProjects();
    fetchFocusConstraints();
    fetchCorrections();
  }, [activeProjectId]);

  useEffect(() => {
    if (activeProjectId) {
      fetchDocuments();
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (activeDocId) {
      fetchExtractions();
    }
  }, [activeDocId]);

  // Fetch helpers
  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
      if (data.length > 0 && !activeProjectId) {
        setActiveProjectId(data[0].id);
      }
    } catch (e) {
      addToast('error', 'Database Connection Error', 'Failed to retrieve projects from PostgreSQL.');
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/documents`);
      const data = await res.json();
      setDocuments(data);
      if (data.length > 0) {
        setActiveDocId(data[0].id);
        setActivePage(1);
      } else {
        setActiveDocId('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFocusConstraints = async () => {
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/focus`);
      const data = await res.json();
      setFocusList(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCorrections = async () => {
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/corrections`);
      const data = await res.json();
      setCorrections(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchExtractions = async () => {
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/extractions?documentId=${activeDocId}`);
      if (res.ok) {
        const data = await res.json();
        setExtractions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Keyboard Navigation shortcuts rule 10
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing when user is typing in inputs or textareas
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      } else if (e.key === 'f' || e.key === 'F') {
        // Focus search query
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      } else if (e.key === '?') {
        setIsHelpOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePage, documents, activeDocId]);

  const addToast = (type: 'success' | 'warning' | 'info' | 'error', title: string, message: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      message
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Focus Box management
  const handleAddFocus = async () => {
    if (!newFocusText.trim()) return;
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/focus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newFocusText,
          tag: newFocusTag,
          category: ['Columns', 'MEP', 'Materials', 'Zoning'].includes(newFocusTag) ? newFocusCategory : undefined
        })
      });
      if (res.ok) {
        const newConstraint = await res.json();
        setFocusList(prev => [...prev, newConstraint]);
        setNewFocusText('');
        addToast('success', 'Focus Constraint Saved', 'Applied pre-analysis focus bias to the pipeline model.');
      }
    } catch (err) {
      addToast('error', 'Storage Failure', 'Could not save focus box item to PostgreSQL.');
    }
  };

  const handleDeleteFocus = async (id: string) => {
    try {
      const res = await fetch(`/api/focus/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFocusList(prev => prev.filter(f => f.id !== id));
        addToast('info', 'Constraint Removed', 'Focus priority list updated.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AI OCR Pipeline analysis simulation/runner
  const handleTriggerAnalysis = async () => {
    if (isAnalyzing || !activeDocId) return;

    setIsAnalyzing(true);
    setAnalysisProgress(15);
    addToast('info', 'Initializing Pipeline', 'Preprocessing PDF layers against active Focus constraints...');

    // Progress updates
    const intervals = [
      { p: 40, ms: 800, msg: 'Indexing localized page coordinate geometry...' },
      { p: 70, ms: 1600, msg: 'Executing Vision LLM structural parser...' },
      { p: 90, ms: 2400, msg: 'Filtering spatial classifications & weighing scores...' }
    ];

    intervals.forEach(({ p, ms, msg }) => {
      setTimeout(() => {
        setAnalysisProgress(p);
      }, ms);
    });

    try {
      const activeProjectObj = projects.find(p => p.id === activeProjectId);
      const activeDocObj = documents.find(d => d.id === activeDocId);
      const activePageObj = activeDocObj?.pages.find(p => p.pageNumber === activePage);

      const focusNotesText = focusList
        .filter(f => f.isActive)
        .map(f => `[${f.tag}] ${f.text}`)
        .join('; ');

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProjectId,
          documentId: activeDocId,
          pageNumber: activePage,
          focusNotes: focusNotesText || undefined
        })
      });

      if (res.ok) {
        const result = await res.json();
        setAnalysisProgress(100);
        setTimeout(() => {
          setIsAnalyzing(false);
          setAnalysisProgress(0);
          fetchExtractions();
          fetchCorrections();
          addToast(
            'success', 
            'Extraction Completed', 
            `Successfully cataloged ${result.count} data elements from page ${activePage}.`
          );
        }, 300);
      } else {
        throw new Error('Analysis request failed');
      }
    } catch (e: any) {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      addToast('error', 'Processor Error', 'Vision pipeline aborted, check Gemini key bindings.');
    }
  };

  // Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
          owner: currentUser.name
        })
      });

      if (res.ok) {
        const created = await res.json();
        setProjects(prev => [created, ...prev]);
        setActiveProjectId(created.id);
        setNewProjectName('');
        setNewProjectDesc('');
        setIsNewProjectOpen(false);
        addToast('success', 'New Space Initialized', `Project ${created.code} successfully set up.`);
      }
    } catch (err) {
      addToast('error', 'PostgreSQL Failure', 'Unable to execute schema transaction.');
    }
  };

  // Mock File upload drag and drop (Rule 3.3 Usability)
  const handleFileUploadMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    executeUploadSequence(file.name, file.size);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      executeUploadSequence(file.name, file.size);
    }
  };

  const executeUploadSequence = async (fileName: string, sizeBytes: number) => {
    setIsUploading(true);
    addToast('info', 'Architectural Package Uploading', `Decompiling ${fileName}...`);

    setTimeout(async () => {
      try {
        const sizeFormatted = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
        const res = await fetch(`/api/projects/${activeProjectId}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName,
            fileSize: sizeFormatted,
            pageCount: 3,
            pages: [
              { pageNumber: 1, title: 'Ground Floor Structural & Excavation Set', drawingType: 'floor_plan', dimensions: { width: 1000, height: 750 } },
              { pageNumber: 2, title: 'Level 2 Structural Pillars & Partition Spec', drawingType: 'structural_grid', dimensions: { width: 1000, height: 750 } },
              { pageNumber: 3, title: 'HVAC Air Terminal Flow Schedule', drawingType: 'mep_layout', dimensions: { width: 1000, height: 750 } },
            ]
          })
        });

        if (res.ok) {
          const freshDoc = await res.json();
          addToast('success', 'Uploaded Successfully', `${fileName} integrated list as local drawing reference.`);
          setIsUploading(false);
          fetchDocuments();
        }
      } catch (err) {
        setIsUploading(false);
        addToast('error', 'Upload Blocked', 'Storage error integrating vector blueprint PDF.');
      }
    }, 1500);
  };

  // Inline correction submission
  const handleStartEditing = (ext: Extraction) => {
    setEditingId(ext.id);
    setEditValue(ext.value);
  };

  const handleSaveCorrection = async (extId: string) => {
    if (!editValue.trim()) return;

    try {
      const res = await fetch(`/api/extractions/${extId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: editValue,
          status: 'corrected',
          user: currentUser.name
        })
      });

      if (res.ok) {
        const updatedExt = await res.json();
        setExtractions(prev => prev.map(e => e.id === extId ? updatedExt : e));
        setEditingId(null);
        fetchCorrections();
        addToast('success', 'PostgreSQL Safe-Sync', 'Manually verified update saved. Audit log recorded.');
      }
    } catch (e) {
      addToast('error', 'Audit Sync Error', 'PostgreSQL transaction aborted.');
    }
  };

  // Render bounding highlighting triggers
  const handleSelectExtraction = (ext: Extraction) => {
    setSelectedExtraction(ext);
    setActivePage(ext.pageNumber);
    
    // Smooth zoom animation simulation
    setZoomLevel(125);
    const calculatedPan = {
      x: -((ext.bbox.x + ext.bbox.width / 2) - 50) * 4,
      y: -((ext.bbox.y + ext.bbox.height / 2) - 50) * 3
    };
    setPanOffset(calculatedPan);
    addToast('info', 'Auto-Focused Source Bounding Coordinates', `Moved drawing view to page ${ext.pageNumber}, focus offset ${ext.bbox.x}%, ${ext.bbox.y}%`);
  };

  const handlePrevPage = () => {
    if (activePage > 1) {
      setActivePage(activePage - 1);
    }
  };

  const handleNextPage = () => {
    const currentDoc = documents.find(d => d.id === activeDocId);
    if (currentDoc && activePage < currentDoc.pageCount) {
      setActivePage(activePage + 1);
    }
  };

  // Preset filter controls
  const toggleCategorySelection = (cat: Category) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Sorting extractions logic
  const sortedExtractions = [...extractions]
    .filter(e => {
      const matchesSearch = e.value.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            e.elementId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            e.pageNumber.toString() === searchQuery;
      const matchesCat = selectedCategories.includes(e.category);
      const matchesPage = activePage ? e.pageNumber === activePage : true;
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'page') return a.pageNumber - b.pageNumber;
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      return new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime();
    });

  // Calculate counts for categories filter pills
  const getCategoryCount = (cat: Category) => {
    return extractions.filter(e => e.category === cat).length;
  };

  // Vector Blueprint Canvas Drag & Move features
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoomLevel(100);
    setPanOffset({ x: 0, y: 0 });
  };

  // CSV & JSON Data Export (Rule 4 deliverables)
  const handleExportCSV = () => {
    const headers = ['id', 'elementId', 'page', 'category', 'value', 'confidence', 'status'];
    const rows = extractions.map(e => [
      e.id,
      e.elementId || '',
      e.pageNumber,
      e.category,
      `"${e.value.replace(/"/g, '""')}"`,
      `${e.confidence}%`,
      e.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ArchiDoc_Extractions_${activeProjectId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Exporter Process complete', 'CSV table structure downloaded successfully.');
  };

  const activeDoc = documents.find(d => d.id === activeDocId);
  const currentProject = projects.find(p => p.id === activeProjectId);

  return (
    <div id="archidoc-workspace" className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden select-none">
      
      {/* LEFT SIDEBAR - PDF Pages + Focus Box Pre-Analysis Panel */}
      <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-72'} border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 transition-all duration-300 overflow-hidden`}>
        
        {/* Workspace Brand Header */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm tracking-tighter">
              A
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h1 className="text-xs font-bold uppercase tracking-tight">ArchiDoc AI</h1>
                <p className="text-[9px] text-slate-400 font-mono">v2.4 PostgreSQL Live</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            title="Collapse Sidebar"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>

        {/* Current Space Selector */}
        {!isSidebarCollapsed && (
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">PROJECT SPACE</span>
            <div className="flex items-center gap-2 mt-1">
              <select
                value={activeProjectId}
                onChange={(e) => {
                  setActiveProjectId(e.target.value);
                  resetView();
                }}
                className="flex-1 bg-white dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-2 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.code} — {p.name.slice(0, 20)}...</option>
                ))}
              </select>
              <button
                onClick={() => setIsNewProjectOpen(true)}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                title="Create New Project Space"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Scrolling thumbnail pre-views (Rule 1) */}
        <div className="flex-1 overflow-hidden flex flex-col p-3">
          <div className="flex items-center justify-between mb-2">
            {!isSidebarCollapsed ? (
              <>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Page Gallery</h3>
                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                  {activeDoc?.pageCount || 0} Pages Loaded
                </span>
              </>
            ) : (
              <FileText className="w-5 h-5 mx-auto text-slate-400" />
            )}
          </div>

          {!isSidebarCollapsed ? (
            <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[30vh] pr-1.5">
              {activeDoc?.pages.map((p) => {
                const isActive = p.pageNumber === activePage;
                return (
                  <button
                    key={p.pageNumber}
                    onClick={() => {
                      setActivePage(p.pageNumber);
                      addToast('info', `Switched Page Viewer`, `Loaded ${p.title}`);
                    }}
                    className={`relative text-left aspect-[4/3] rounded-lg border-2 p-1.5 flex flex-col justify-between transition-all group ${
                      isActive 
                        ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-900/10 shadow-sm' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-full h-8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded flex flex-col items-center justify-center text-[9px] text-slate-400 font-bold">
                      P. 0{p.pageNumber}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[9px]">
                      <span className="font-mono font-bold text-slate-500">0{p.pageNumber}</span>
                      {isActive && <span className="text-indigo-600 font-extrabold uppercase text-[8px]">ACTIVE</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 overflow-y-auto max-h-[30vh]">
              {activeDoc?.pages.map((p) => (
                <button
                  key={p.pageNumber}
                  onClick={() => setActivePage(p.pageNumber)}
                  className={`w-10 h-10 rounded border-2 flex items-center justify-center font-bold text-xs ${
                    p.pageNumber === activePage 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {p.pageNumber}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Drag and Drop Box Area (Rule 3.3 and Rule 10 upload block) */}
        {!isSidebarCollapsed && (
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="mx-3 mb-2 p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all rounded-xl text-center shrink-0"
          >
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1 group-hover:text-indigo-500" />
            <span className="block text-[10px] font-bold text-slate-700 dark:text-slate-300">Drag Vector Drawing</span>
            <span className="block text-[8px] text-slate-400 mt-0.5">Or PDF click picker (Max 50MB)</span>
            <label className="inline-block mt-2 px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-indigo-600 text-[9px] font-bold uppercase rounded cursor-pointer transition-colors">
              Browse PDF
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileUploadMock} 
                className="hidden" 
              />
            </label>
          </div>
        )}

        {/* Pre-Analysis Constraints Panel (Rule 2) */}
        {!isSidebarCollapsed && (
          <div className="p-3 bg-indigo-950 text-indigo-100 border-t-2 border-indigo-500 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider">AI Focus Box</h3>
              </div>
              <button
                onClick={() => setIsFocusCollapsed(!isFocusCollapsed)}
                className="text-[9px] underline text-indigo-300 hover:text-white"
              >
                {isFocusCollapsed ? 'Show List' : 'Hide List'}
              </button>
            </div>

            <p className="text-[9px] text-indigo-300 leading-normal italic mb-3">
              "Focus notes guide OCR neural models to weigh priority dimensions on spatial layouts."
            </p>

            <AnimatePresence>
              {!isFocusCollapsed && (
                <div className="space-y-2 max-h-[16vh] overflow-y-auto mb-3 scrollbar-none">
                  {focusList.map((f) => (
                    <div 
                      key={f.id}
                      className="p-1 px-2 text-[10px] bg-slate-900 border border-indigo-500/20 rounded flex items-start gap-1 justify-between group"
                    >
                      <div className="flex-1 min-w-0 pr-1">
                        <span className="inline-block px-1 py-0.2 bg-indigo-500 text-white text-[8px] font-bold rounded uppercase mr-1">
                          {f.tag}
                        </span>
                        <span className="text-slate-300 text-[10px] italic leading-tight select-text">"{f.text}"</span>
                      </div>
                      <button
                        onClick={() => handleDeleteFocus(f.id)}
                        className="text-slate-500 hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Constraint"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Focus Input Form */}
            <div className="space-y-1.5 mt-2 pt-2 border-t border-indigo-800">
              <input
                type="text"
                placeholder="Focus columns, ignore desks..."
                value={newFocusText}
                onChange={(e) => setNewFocusText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFocus()}
                className="w-full text-[10px] bg-slate-900 border border-indigo-500/30 rounded px-1.5 py-1 text-slate-100 focus:outline-none focus:border-indigo-400 shrink-0"
              />
              <div className="flex gap-1">
                <select
                  value={newFocusTag}
                  onChange={(e: any) => setNewFocusTag(e.target.value)}
                  className="bg-slate-900 border border-indigo-500/30 text-[9px] rounded p-0.5 px-1 focus:outline-none shrink-0"
                >
                  <option value="General">General</option>
                  <option value="Columns">Columns</option>
                  <option value="MEP">MEP Spec</option>
                  <option value="Materials">Materials</option>
                  <option value="Exclusion">Exclusion</option>
                  <option value="Zoning">Zoning</option>
                </select>
                <button
                  onClick={handleAddFocus}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[9px] uppercase rounded py-1 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Focus
                </button>
              </div>
            </div>
          </div>
        )}

      </aside>

      {/* CENTER STAGE CONTAINER - Vector plan, navigation, simulations, diagram renderer */}
      <main className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 relative overflow-hidden" onMouseUp={handleMouseUp}>
        
        {/* Document Metadata Menu header bar */}
        <header className="h-12 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 shrink-0 select-text">
          <div className="flex items-center gap-3">
            <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[280px]">
                {activeDoc?.name || 'Loading drawing pack...'}
              </div>
              <p className="text-[10px] text-slate-400">
                Page {activePage} — {activeDoc?.pages.find(p => p.pageNumber === activePage)?.title || 'A-101 Set'}
              </p>
            </div>
            
            {/* Quick nav buttons */}
            <div className="flex items-center gap-1 ml-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg p-0.5">
              <button 
                onClick={handlePrevPage}
                disabled={activePage <= 1}
                className="p-1 hover:bg-white dark:hover:bg-slate-700 hover:text-black dark:hover:text-white rounded transition-colors disabled:opacity-45"
                title="Previous Page (Left Arrow)"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold px-1.5 text-slate-700 dark:text-slate-300 select-none">
                0{activePage} / 0{activeDoc?.pageCount || 5}
              </span>
              <button 
                onClick={handleNextPage}
                disabled={!activeDoc || activePage >= activeDoc.pageCount}
                className="p-1 hover:bg-white dark:hover:bg-slate-700 hover:text-black dark:hover:text-white rounded transition-colors disabled:opacity-45"
                title="Next Page (Right Arrow)"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 select-none">
            {/* Simulation Runner Controls */}
            <button
              onClick={handleTriggerAnalysis}
              disabled={isAnalyzing || !activeDocId}
              className={`text-[10px] font-bold uppercase tracking-wider rounded-xl py-1.5 px-3 flex items-center gap-1.5 shadow-sm transition-all ${
                isAnalyzing 
                  ? 'bg-indigo-600 text-white animate-pulse' 
                  : 'bg-slate-900 border border-slate-700 hover:bg-indigo-600 hover:text-white text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              {isAnalyzing ? `Analyzing AI (${analysisProgress}%)` : `Rerun AI OCR`}
            </button>

            {/* Tab switchers */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab2('blueprint')}
                className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                  activeTab === 'blueprint' 
                    ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Blueprint Path
              </button>
              <button
                onClick={() => setActiveTab2('relationship')}
                className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                  activeTab === 'relationship' 
                    ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Relationship Scheme
              </button>
            </div>

            {/* Utility View adjustments */}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-1.5 lg:p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              title="Theme Toggle"
            >
              {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            <button 
              onClick={() => setIsHelpOpen(true)}
              className="p-1.5 lg:p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:text-slate-400"
              title="Keyboard Shortcuts Guide"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Dynamic central grid box display */}
        <div 
          ref={viewContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          className="flex-1 relative flex items-center justify-center p-4 lg:p-8 cursor-grab active:cursor-grabbing overflow-hidden bg-slate-950/20 dark:bg-slate-950"
        >
          {/* Blueprint plan background view (Rule 4 detail highlights) */}
          {activeTab === 'blueprint' ? (
            <div 
              style={{
                transform: `scale(${zoomLevel / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className="relative w-full max-w-3xl aspect-[1.4/1] bg-white dark:bg-slate-950 shadow-2xl border border-slate-300 dark:border-slate-800 select-none rounded bg-grid-pattern transition-transform"
            >
              
              {/* Scale ruler vector layout */}
              <svg 
                viewBox="0 0 1000 750" 
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                {/* Cad/Vector Grid Drawing (Rule 6 HTML5 Canvas/SVG details matching High density guidelines) */}
                <g stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} strokeWidth="0.8">
                  <path d="M 50 50 h 900 v 650 h -900 z" fill="none" />
                  {/* Grid Lines */}
                  {Array.from({ length: 9 }).map((_, i) => (
                    <line key={`v-${i}`} x1={100 + i * 100} y1="50" x2={100 + i * 100} y2="700" />
                  ))}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <line key={`h-${i}`} x1="50" y1={100 + i * 100} x2="950" y2={100 + i * 100} />
                  ))}
                </g>

                {/* Simulated Complex Cadet Blueprint Grid Lines relative to pages (Rule 10) */}
                {activePage === 1 && (
                  <g stroke="currentColor" className="text-slate-400 dark:text-slate-600 opacity-60">
                    <rect x="180" y="240" width="340" height="300" fill="none" strokeWidth="2" />
                    <rect x="580" y="110" width="300" height="200" fill="none" strokeWidth="2" />
                    <circle cx="350" cy="390" r="120" fill="none" strokeWidth="1" strokeDasharray="3,3" />
                  </g>
                )}
                {activePage === 2 && (
                  <g stroke="currentColor" className="text-slate-400 dark:text-slate-600 opacity-60" strokeWidth="1.5">
                    {/* Columns grid intersections */}
                    {Array.from({ length: 4 }).map((_, colIdx) => (
                      <g key={colIdx}>
                        <text x={140 + colIdx * 240} y="40" className="text-[12px] font-mono fill-slate-500 font-bold">GRID A-{colIdx+1}</text>
                        <line x1={150 + colIdx * 250} y1="50" x2={150 + colIdx * 250} y2="700" strokeDasharray="6,6" />
                      </g>
                    ))}
                    {/* Columns nodes visual overlay */}
                    <circle cx="150" cy="220" r="22" fill="none" stroke="#f59e0b" strokeWidth="2" />
                    <circle cx="400" cy="220" r="22" fill="none" stroke="#f59e0b" strokeWidth="2" />
                    <rect x="380" y="480" width="240" height="40" fill="none" stroke="#ef4444" strokeWidth="2" />
                  </g>
                )}
                {activePage === 3 && (
                  <g stroke="#a855f7" className="opacity-75" strokeWidth="2" fill="none">
                    <path d="M 120 150 h 400 v 100 h 200 v 260 H 220" />
                    <rect x="120" y="150" width="100" height="80" fill="rgba(168, 85, 247, 0.05)" />
                    <text x="130" y="240" fill="#a855f7" stroke="none" className="text-[10px] font-mono font-bold">AHU-01 EXPANSION</text>
                  </g>
                )}
                {activePage === 4 && (
                  <g stroke="#10b981" strokeWidth="2" fill="none" className="opacity-75">
                    {/* Details and section cuts */}
                    <line x1="250" y1="180" x2="550" y2="450" />
                    <line x1="250" y1="450" x2="550" y2="180" strokeDasharray="4" />
                  </g>
                )}
                {activePage === 5 && (
                  <g stroke="currentColor" className="text-slate-400 dark:text-slate-600 opacity-60" strokeWidth="1">
                    {/* Schedule tables */}
                    <rect x="100" y="150" width="800" height="450" fill="none" />
                    <line x1="100" y1="250" x2="900" y2="250" />
                    <line x1="100" y1="350" x2="900" y2="350" />
                    <line x1="100" y1="450" x2="900" y2="450" />
                  </g>
                )}

                {/* Render bounding highlighted region targets from database (Rule 4 coordinate offsets) */}
                {extractions
                  .filter(e => e.pageNumber === activePage)
                  .map((e) => {
                    const isSelected = selectedExtraction?.id === e.id;
                    const isHovered = hoveredExtraction?.id === e.id;
                    const colorHex = CATEGORY_META[e.category]?.hex || '#6366f1';
                    
                    // Coordinates conversion for 1000x750 viewport
                    const x = (e.bbox.x / 100) * 1000;
                    const y = (e.bbox.y / 100) * 750;
                    const w = (e.bbox.width / 100) * 1000;
                    const h = (e.bbox.height / 100) * 750;

                    return (
                      <g 
                        key={e.id}
                        className="cursor-pointer group pointer-events-auto"
                        onClick={(evt) => {
                          evt.stopPropagation();
                          setSelectedExtraction(e);
                        }}
                        onMouseEnter={() => setHoveredExtraction(e)}
                        onMouseLeave={() => setHoveredExtraction(null)}
                      >
                        {/* Shrimpy glow boundary */}
                        <rect
                          x={x - 4}
                          y={y - 4}
                          width={w + 8}
                          height={h + 8}
                          rx="4"
                          fill="none"
                          stroke={colorHex}
                          strokeWidth={isSelected ? "4" : isHovered ? "2" : "1"}
                          className="transition-all duration-200"
                          strokeDasharray={isSelected ? "none" : "5, 5"}
                        />
                        {/* Background light fill */}
                        <rect
                          x={x}
                          y={y}
                          width={w}
                          height={h}
                          fill={colorHex}
                          fillOpacity={isSelected ? 0.15 : isHovered ? 0.08 : 0.03}
                          rx="2"
                          className="transition-all duration-200"
                        />
                        {/* Mini text badge anchor */}
                        {(isSelected || isHovered) && (
                          <g>
                            <rect
                              x={x}
                              y={y - 20}
                              width={Math.max(80, (e.elementId?.length || 4) * 8 + 12)}
                              height="18"
                              rx="3"
                              fill={colorHex}
                            />
                            <text
                              x={x + 6}
                              y={y - 8}
                              fill="#ffffff"
                              className="text-[9px] font-mono font-bold"
                              stroke="none"
                            >
                              {e.elementId || e.category}
                            </text>
                          </g>
                        )}
                        {/* Low confidence attention indicator (Rule 7) */}
                        {e.confidence < 70 && (
                          <circle
                            cx={x + w}
                            cy={y}
                            r="6"
                            className="fill-red-500 animate-ping"
                          />
                        )}
                      </g>
                    );
                })}
              </svg>

              {/* Status Layer indicators */}
              <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 p-2 rounded-lg flex items-center gap-2 select-text text-[10px] pointer-events-auto max-w-[250px]">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                <span className="font-mono text-slate-500">
                  UTM-X: 589201.2 E / Y: 4503892.4 N
                </span>
              </div>

              {/* Legend pill box */}
              <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-700 p-2 rounded-lg flex flex-col gap-1 text-[10px] pointer-events-auto">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">LEGEND CATEGORY</span>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {Object.values(CATEGORY_META).map(cat => (
                    <div key={cat.id} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded" style={{ backgroundColor: cat.hex }} />
                      <span className="font-sans text-slate-500 font-medium">{cat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            
            /* Relationship Scheme layout network visualizer (Rule 6 simple 2D diagram matching specific rules) */
            <div className="relative w-full max-w-2xl aspect-[1.4/1] bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-800 rounded-xl p-4 lg:p-6 shadow-2xl flex flex-col pointer-events-auto select-none">
              <div className="flex items-center justify-between mb-4 border-b border-indigo-100 dark:border-slate-800 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    Spatial & MEP Topological Network Schematic
                  </h4>
                  <p className="text-[9px] text-slate-400">Generated on-demand using vector dimensions and adjoining attributes</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                    Auto-Valid
                  </span>
                </div>
              </div>

              {/* Grid SVG canvas draw node relationships */}
              <div className="flex-1 border border-dashed border-indigo-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-lg relative overflow-hidden">
                <svg className="absolute inset-0 w-full h-full">
                  {/* Draw connection edges path lines */}
                  <g stroke="#818cf8" strokeWidth="2" strokeDasharray="3,3" opacity="0.6">
                    <line x1="150" y1="180" x2="350" y2="180" />
                    <line x1="350" y1="180" x2="550" y2="180" />
                    <line x1="150" y1="180" x2="150" y2="300" />
                    <line x1="350" y1="180" x2="350" y2="300" />
                    <line x1="350" y1="300" x2="550" y2="300" />
                  </g>

                  {/* Nodes Render representation */}
                  {/* Space RM-101 */}
                  <g transform="translate(70, 140)" className="cursor-pointer">
                    <rect width="130" height="50" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
                    <text x="12" y="20" fill="#1e3a8a" className="text-[10px] font-bold">RM-101: Atrium</text>
                    <text x="12" y="36" fill="#3b82f6" className="text-[8px] font-mono">Area: 450.5m²</text>
                  </g>

                  {/* Corridor */}
                  <g transform="translate(280, 140)" className="cursor-pointer">
                    <rect width="130" height="50" rx="6" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="2" />
                    <text x="12" y="20" fill="#4c1d95" className="text-[10px] font-bold">COR-A: North Exit</text>
                    <text x="12" y="36" fill="#8b5cf6" className="text-[8px] font-mono">Width: 2400mm</text>
                  </g>

                  {/* Structural Columns */}
                  <g transform="translate(70, 260)" className="cursor-pointer">
                    <rect width="130" height="50" rx="6" fill="#fffbeb" stroke="#d97706" strokeWidth="2" />
                    <text x="12" y="20" fill="#78350f" className="text-[10px] font-bold">COL-C1 Grid A-1</text>
                    <text x="12" y="36" fill="#d97706" className="text-[8px] font-mono">450x450mm Concrete</text>
                  </g>

                  <g transform="translate(280, 260)" className="cursor-pointer">
                    <rect width="130" height="50" rx="6" fill="#fffbeb" stroke="#d97706" strokeWidth="2" />
                    <text x="12" y="20" fill="#78350f" className="text-[10px] font-bold">COL-C2 Grid B-1</text>
                    <text x="12" y="36" fill="#d97706" className="text-[8px] font-mono">450x450mm Concrete</text>
                  </g>

                  {/* MEP equipment */}
                  <g transform="translate(480, 140)" className="cursor-pointer">
                    <rect width="150" height="50" rx="6" fill="#faf5ff" stroke="#a855f7" strokeWidth="2" />
                    <text x="12" y="20" fill="#581c87" className="text-[10px] font-bold">AHU-01 Mechanical</text>
                    <text x="12" y="36" fill="#a855f7" className="text-[8px] font-mono">12,000 CFM Loop</text>
                  </g>

                  <g transform="translate(480, 260)" className="cursor-pointer">
                    <rect width="150" height="50" rx="6" fill="#faf5ff" stroke="#a855f7" strokeWidth="2" />
                    <text x="12" y="20" fill="#581c87" className="text-[10px] font-bold">DUCT-SA1 Supply Trunk</text>
                    <text x="12" y="36" fill="#a855f7" className="text-[8px] font-mono">800x450mm Galvanized</text>
                  </g>
                </svg>
              </div>

              {/* Action layout */}
              <div className="mt-4 flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 p-2 rounded-lg text-xs">
                <span className="text-slate-500 font-mono font-bold uppercase text-[9px]">
                  Schema exports supported for DXF/CAD mapping systems
                </span>
                <button
                  onClick={() => addToast('success', 'Exporter Process Success', 'Topological drawing system downloaded to local directory.')}
                  className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold uppercase text-[9px] rounded hover:opacity-90"
                >
                  Export PNG Layout
                </button>
              </div>

            </div>
          )}

          {/* Quick HUD Navigation tools layer (Rule 10 desktop layout) */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl flex items-center gap-3 shadow-xl pointer-events-auto select-none">
            
            <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span>Zoom <strong>{zoomLevel}%</strong></span>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setZoomLevel(prev => Math.min(300, prev + 25))}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={resetView}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200"
                title="Reset View offset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

            <button 
              onClick={handleTriggerAnalysis}
              className="p-1.5 px-3 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl hover:bg-indigo-700 flex items-center gap-1"
            >
              Analyze Page
            </button>
          </div>

        </div>

        {/* Diagonal Diagnostics Footer Bar (Rule 10 and high density branding rules) */}
        <footer className="h-8 bg-slate-950 text-white flex items-center px-4 justify-between shrink-0 select-text">
          <div className="flex items-center gap-4 text-[9px] font-mono text-slate-400">
            <span>DATABASE: PostgreSQL Active</span>
            <span>INDEXED: query_lat_lng_v2</span>
            <span>GRID: Universal Transverse Mercator (UTM) Zone 18N</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Diagnostics: Nominal Secure
          </div>
        </footer>

      </main>

      {/* RIGHT SIDEBAR - Extraction stream, metadata, edits & audits */}
      <aside className="w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 overflow-hidden">
        
        {/* Extraction Stream Header Filter Search Box */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2 select-none">
            <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-tight">
              Extraction Feed
            </h2>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-lg flex items-center gap-1 transition-all"
            >
              <History className="w-3.5 h-3.5" />
              Audit Logs ({corrections.length})
            </button>
          </div>

          {/* Core Search input (Rule 5) */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-input"
              type="text"
              placeholder="Search keyword, code or page... (Press F)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filtering Pillars grid tabs (Rule 3 list categories) */}
          <div className="space-y-1 select-none">
            <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">FILTER BY DATA DOMAIN</span>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(CATEGORY_META) as Category[]).map((catName) => {
                const isSelected = selectedCategories.includes(catName);
                const count = getCategoryCount(catName);
                return (
                  <button
                    key={catName}
                    onClick={() => toggleCategorySelection(catName)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-all flex items-center gap-1 border ${
                      isSelected 
                        ? 'bg-slate-900 border-slate-900 text-white' 
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: CATEGORY_META[catName].hex }} 
                    />
                    {catName}
                    {count > 0 && <span className="opacity-75 font-mono text-[8px]">({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 text-[10px] border-t border-slate-100 dark:border-slate-800/80 pt-2 select-none">
            <span className="text-slate-500 text-[9px]">
              Active: <strong>{sortedExtractions.length} matches</strong>
            </span>
            
            {/* Sorting trigger rules */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent text-[10px] font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="confidence">Confidence Score</option>
                <option value="page">Page Order</option>
                <option value="category">Category</option>
                <option value="time">Date Extracted</option>
              </select>
            </div>
          </div>

        </div>

        {/* Structured Extraction Stream (Rule 4 deliverables core highlight component) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-950/40 select-text">
          {sortedExtractions.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl select-none">
              <Sliders className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">No active matches found</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                Adjust drawing page sequence or create a Focus Box tag to process additional items.
              </p>
            </div>
          ) : (
            sortedExtractions.map((item) => {
              const isSelected = selectedExtraction?.id === item.id;
              const isEditing = editingId === item.id;
              const isLowConfidence = item.confidence < 70;
              const catMeta = CATEGORY_META[item.category];

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredExtraction(item)}
                  onMouseLeave={() => setHoveredExtraction(null)}
                  className={`bg-white dark:bg-slate-900 border-2 rounded-xl shadow-sm transition-all overflow-hidden ${
                    isSelected 
                      ? 'border-indigo-600 bg-indigo-50/10 ring-2 ring-indigo-600/10' 
                      : isLowConfidence 
                        ? 'border-red-400/90 hover:border-red-500' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="p-3">
                    {/* Badge top card bar */}
                    <div className="flex items-center justify-between mb-2 text-[9px] select-none">
                      <div className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.5 font-sans font-extrabold uppercase rounded-md text-[8px] border shrink-0 ${
                          catMeta?.color || 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}>
                          {item.category}
                        </span>
                        {item.elementId && (
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold px-1 py-0.2 rounded text-slate-700 dark:text-slate-300">
                            {item.elementId}
                          </span>
                        )}
                      </div>

                      {/* Confidence and Warnings badges (Rule 7 manual overrides indicator) */}
                      <div className="flex items-center gap-1.5">
                        {isLowConfidence ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 font-bold border border-rose-300/40 flex items-center gap-0.5">
                            <ShieldAlert className="w-3 h-3 text-rose-500" />
                            REVIEW
                          </span>
                        ) : null}

                        <span className={`font-mono font-bold text-[10px] ${
                          item.confidence >= 90 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {item.confidence}% Confidence
                        </span>
                      </div>
                    </div>

                    {/* Inline Content Title Section */}
                    {isEditing ? (
                      <div className="space-y-1.5">
                        <textarea
                          rows={2}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full text-xs p-1.5 border border-amber-400 dark:border-amber-600 rounded bg-amber-500/5 dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-100 focus:outline-none"
                        />
                        <div className="flex justify-end gap-1 select-none">
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 px-2 border border-slate-200 dark:border-slate-700 rounded text-[9px] hover:bg-slate-50 font-bold uppercase"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveCorrection(item.id)}
                            className="p-1 px-2.5 bg-slate-950 dark:bg-slate-800 hover:bg-indigo-600 text-white rounded text-[9px] font-bold uppercase flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" /> Save Safe
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-xs font-mono text-slate-800 dark:text-slate-200 leading-normal font-semibold break-words">
                          {item.value}
                        </h4>

                        {/* Audit status check flags */}
                        <div className="mt-1 flex items-center gap-1 text-[9px] select-none text-slate-400">
                          {item.status === 'corrected' ? (
                            <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Corrected & Verified (PostgreSQL Locked)
                            </span>
                          ) : (
                            <span>Database safe reference</span>
                          )}
                        </div>
                      </>
                    )}

                    {/* Source Miniature crop box (Rule 4 critical thumbnails) */}
                    {!isEditing && (
                      <div className="mt-3 flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        {/* Thumbnail Cropped Preview Section */}
                        <div 
                          onClick={() => handleSelectExtraction(item)}
                          className="relative w-11 h-11 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center overflow-hidden cursor-zoom-in group shrink-0"
                          title={`Click to view source on Page ${item.pageNumber}`}
                        >
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            <rect width="100" height="100" fill={theme === 'dark' ? '#0f172a' : '#f8fafc'} />
                            <g stroke={catMeta?.hex || '#94a3b8'} strokeWidth="1.5">
                              <circle cx="50" cy="50" r="30" fill="none" />
                              <line x1="10" y1="50" x2="90" y2="50" strokeDasharray="3" />
                              <line x1="50" y1="10" x2="50" y2="90" strokeDasharray="3" />
                            </g>
                          </svg>
                          <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors" />
                          <div className="absolute bottom-0 right-0 left-0 bg-slate-950/80 text-white text-[7px] text-center uppercase tracking-tighter">
                            PAGE 0{item.pageNumber}
                          </div>
                        </div>

                        {/* Text navigation anchors */}
                        <div className="flex-1 min-w-0 flex items-center justify-between">
                          <div className="min-w-0 pr-1">
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-tight">Source Area Coordinates</span>
                            <button
                              onClick={() => handleSelectExtraction(item)}
                              className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline truncate block"
                              title="Focus & Center Bounding Box in primary vector viewport"
                            >
                              Page 0{item.pageNumber} Coordinates Box
                            </button>
                          </div>

                          <div className="flex gap-1 shrink-0 select-none">
                            <button
                              onClick={() => handleStartEditing(item)}
                              className="p-1 border border-slate-200 dark:border-slate-700 hover:border-slate-400 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400"
                              title="Inline overrides correction edit (Rule 7)"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CAD Layout Export Footers */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 select-none">
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="flex-1 bg-slate-900 border border-slate-800 dark:bg-slate-800 hover:bg-slate-850 dark:hover:bg-slate-700 text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV Schema
            </button>
            <button
              onClick={() => {
                const drawingJSON = JSON.stringify(extractions, null, 2);
                const blob = new Blob([drawingJSON], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const l = document.createElement('a');
                l.href = url;
                l.download = `ArchiDoc_CAD_Vector_${activeProjectId}.json`;
                l.click();
                addToast('success', 'CAD Compilation Export Done', 'Vector blueprint dictionary compiled.');
              }}
              className="flex-1 bg-white border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Compile CAD JSON
            </button>
          </div>
        </div>

      </aside>

      {/* NEW PROJECT SPACE POPUP MODAL (Rule 8 DB metadata schema helper) */}
      <AnimatePresence>
        {isNewProjectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 select-text">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-indigo-500" />
                  Configure Project Workspace (PostgreSQL)
                </h3>
                <button 
                  onClick={() => setIsNewProjectOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4 pt-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Workspace Commercial Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Skyline Business Mall Complex"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Description Scope</label>
                  <textarea
                    rows={3}
                    placeholder="Provide materials grid detail, number of floors, structural notes etc."
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsNewProjectOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Discard setup
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Commit Schema
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* KEYBOARD SHORTCUTS HELP GUIDE MODAL */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 select-text">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-500" />
                  Power Users Commands Guide
                </h3>
                <button onClick={() => setIsHelpOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 pt-3 text-xs leading-normal">
                <p className="text-slate-500">Keyboard bindings facilitate efficient navigability inside drawings packages:</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Previous Page</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border rounded font-mono text-[10px]">Left Arrow</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Next Page</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border rounded font-mono text-[10px]">Right Arrow</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Focus Search Bar</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border rounded font-mono text-[10px]">F</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Launch Help Overlay</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border rounded font-mono text-[10px]">?</kbd>
                  </div>
                </div>
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl mt-2 text-[10px] text-indigo-600 dark:text-indigo-400">
                  <strong>Tip:</strong> Drag blueprints around using your pointer to view detailed section zoom coordinates.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AUDIT LOG DATABASE POPUP MODAL (Rule 7 and Deliverables schema) */}
      <AuditTrailModal 
        isOpen={isAuditModalOpen} 
        onClose={() => setIsAuditModalOpen(false)} 
        corrections={corrections} 
        projectName={currentProject?.name || 'Main Project'}
      />

      {/* TOAST NOTIFIER SYSTEM (Rule 10 completeness) */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

    </div>
  );
}
