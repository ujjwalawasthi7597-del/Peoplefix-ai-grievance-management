import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { ComplaintCategory, ComplaintPriority, IAIAnalysisResult } from '../types/index.ts';
import {
  Sparkles,
  MapPin,
  Upload,
  Camera,
  X,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Trash2,
  Zap,
  Droplets,
  Layers,
  AlertCircle,
  Activity,
  Truck,
  LocateFixed,
  HelpCircle,
} from 'lucide-react';

interface NewComplaintPageProps {
  onNavigate: (tab: string) => void;
  onOpenComplaint: (id: string) => void;
}

const CATEGORIES: Array<{
  name: ComplaintCategory;
  icon: any;
  color: string;
  description: string;
}> = [
  { name: 'Road Damage / Potholes', icon: ShieldAlert, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', description: 'Craters, road cave-ins, broken asphalt' },
  { name: 'Garbage Collection', icon: Trash2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', description: 'Overflowing bins, uncollected trash heaps' },
  { name: 'Streetlight Failure', icon: Zap, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', description: 'Dark poles, flickering lights, exposed wire' },
  { name: 'Water Leakage', icon: Droplets, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30', description: 'Pipe burst, gushing drinking water, faulty valves' },
  { name: 'Drainage Problems', icon: Layers, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30', description: 'Clogged storm culverts, waterlogging' },
  { name: 'Sewage Overflow', icon: AlertCircle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', description: 'Manhole overflow, foul odors, biohazard' },
  { name: 'Public Sanitation', icon: Activity, color: 'text-teal-400 bg-teal-500/10 border-teal-500/30', description: 'Public restrooms, unsanitary public spaces' },
  { name: 'Broken Footpaths', icon: Truck, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', description: 'Broken tiles, pedestrian walkway damage' },
  { name: 'Traffic Signal Problems', icon: AlertTriangle, color: 'text-red-400 bg-red-500/10 border-red-500/30', description: 'Faulty signals, broken timers, pedestrian light' },
  { name: 'Other Civic Issues', icon: HelpCircle, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', description: 'Civic safety hazards, public property damage' },
];

export const NewComplaintPage: React.FC<NewComplaintPageProps> = ({ onNavigate, onOpenComplaint }) => {
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [category, setCategory] = useState<ComplaintCategory>('Road Damage / Potholes');
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');

  // AI State
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiResult, setAiResult] = useState<IAIAnalysisResult | null>(null);
  const [aiVisionScanning, setAiVisionScanning] = useState(false);

  // Location State
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string; landmark: string }>({
    lat: 37.7749,
    lng: -122.4194,
    address: '420 Civic Plaza, Central Ward',
    landmark: 'Near City Hall',
  });

  // Duplicate Detection State
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Leaflet map reference
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Initialize or update Leaflet map when entering Step 4
  useEffect(() => {
    if (currentStep === 4 && mapContainerRef.current) {
      const L = (window as any).L;
      if (!L) return;

      if (!leafletMapRef.current) {
        const map = L.map(mapContainerRef.current).setView([location.lat, location.lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        const marker = L.marker([location.lat, location.lng], { draggable: true }).addTo(map);
        marker.on('dragend', async (e: any) => {
          const latlng = e.target.getLatLng();
          setLocation((prev) => ({
            ...prev,
            lat: Number(latlng.lat.toFixed(5)),
            lng: Number(latlng.lng.toFixed(5)),
            address: `Lat ${latlng.lat.toFixed(4)}, Lng ${latlng.lng.toFixed(4)}`,
          }));
        });

        map.on('click', (e: any) => {
          marker.setLatLng(e.latlng);
          setLocation((prev) => ({
            ...prev,
            lat: Number(e.latlng.lat.toFixed(5)),
            lng: Number(e.latlng.lng.toFixed(5)),
            address: `Lat ${e.latlng.lat.toFixed(4)}, Lng ${e.latlng.lng.toFixed(4)}`,
          }));
        });

        leafletMapRef.current = map;
        markerRef.current = marker;
      } else {
        leafletMapRef.current.invalidateSize();
      }
    }
  }, [currentStep, location.lat, location.lng]);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        alert('File size exceeds 8MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setImages((prev) => [...prev, String(reader.result)]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // AI Vision Scan on uploaded photo
  const scanPhotoWithAi = async () => {
    if (images.length === 0) return;
    try {
      setAiVisionScanning(true);
      const res = await api.ai.classifyImage({ image: images[0], description });
      if (res.result) {
        setCategory(res.result.predictedCategory);
        alert(`AI Vision Identified: ${res.result.predictedCategory}\nConfidence: ${Math.round(res.result.confidence * 100)}%\n"${res.result.explanation}"`);
      }
    } catch (err) {
      console.error('Vision scan error:', err);
    } finally {
      setAiVisionScanning(false);
    }
  };

  // Trigger AI Auto-Triage on Description
  const triggerAiAnalysis = async () => {
    if (!description || description.trim().length < 5) {
      alert('Please enter a short description before running AI analysis.');
      return;
    }
    try {
      setAnalyzingAi(true);
      const res = await api.ai.analyzeDescription({
        description,
        title,
        category,
      });

      setAiResult(res.result);
      if (res.result.predictedCategory) {
        setCategory(res.result.predictedCategory);
      }
      if (res.result.suggestedPriority) {
        setPriority(res.result.suggestedPriority);
      }
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setAnalyzingAi(false);
    }
  };

  // Use browser geolocation
  const handleGetGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lng = Number(pos.coords.longitude.toFixed(5));
          setLocation((prev) => ({
            ...prev,
            lat,
            lng,
            address: `Current GPS (${lat}, ${lng})`,
          }));
          if (leafletMapRef.current && markerRef.current) {
            leafletMapRef.current.setView([lat, lng], 15);
            markerRef.current.setLatLng([lat, lng]);
          }
        },
        () => {
          alert('Unable to retrieve location. Please click the map manually.');
        }
      );
    }
  };

  // Check duplicates before final submit
  const checkDuplicatesBeforeReview = async () => {
    try {
      setCheckingDuplicates(true);
      const res = await api.ai.detectDuplicates({
        category,
        title: title || 'Civic Issue',
        description,
        location: { lat: location.lat, lng: location.lng },
      });
      setDuplicates(res.duplicates || []);
    } catch (err) {
      console.error('Error checking duplicates:', err);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  // Final submit
  const handleSubmit = async () => {
    if (!user) {
      onNavigate('login');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');

      const res = await api.complaints.create({
        title: title || `${category} reported at ${location.address}`,
        description,
        category,
        priority,
        location,
        images,
      });

      // Navigate to detail tracking page
      onOpenComplaint(res.complaint.id);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit complaint.');
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Category' },
    { num: 2, label: 'Photos' },
    { num: 3, label: 'Description' },
    { num: 4, label: 'Location' },
    { num: 5, label: 'Review' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Report a Civic Problem</h1>
            <p className="text-xs text-slate-400 mt-0.5">Step {currentStep} of 5: {steps[currentStep - 1].label}</p>
          </div>
          <button
            onClick={() => onNavigate('home')}
            className="text-xs text-slate-400 hover:text-white transition flex items-center space-x-1"
          >
            <span>Cancel</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="grid grid-cols-5 gap-2">
          {steps.map((s) => (
            <div key={s.num} className="space-y-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  s.num <= currentStep
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-slate-800'
                }`}
              />
              <span
                className={`text-[10px] block font-semibold truncate ${
                  s.num === currentStep
                    ? 'text-emerald-400'
                    : s.num < currentStep
                    ? 'text-slate-300'
                    : 'text-slate-600'
                }`}
              >
                {s.num}. {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: CATEGORY SELECTION */}
      {currentStep === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Select Problem Category</h2>
            <p className="text-xs text-slate-400 mt-1">
              Choose the category that best matches the issue. Our AI will verify this using your description and photos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.name;
              return (
                <div
                  key={cat.name}
                  onClick={() => setCategory(cat.name)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start space-x-3.5 ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md'
                      : 'bg-slate-850/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${cat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                        {cat.name}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center space-x-2 transition cursor-pointer"
            >
              <span>Continue to Photos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PHOTOGRAPH UPLOAD */}
      {currentStep === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Upload Problem Photos</h2>
            <p className="text-xs text-slate-400 mt-1">
              Photographic evidence helps municipal teams dispatch the right equipment (up to 4 images, max 8MB each).
            </p>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 text-center bg-slate-850/40 transition">
            <input
              type="file"
              id="photoInput"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <label htmlFor="photoInput" className="cursor-pointer space-y-3 block">
              <div className="w-12 h-12 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  Click to browse photos or drag and drop
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">JPEG, PNG, WEBP up to 8MB</p>
              </div>
            </label>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{images.length} photo(s) selected</span>
                <button
                  onClick={scanPhotoWithAi}
                  disabled={aiVisionScanning}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiVisionScanning ? 'Scanning...' : 'Scan with Gemini AI'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-700 aspect-video bg-slate-800">
                    <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition flex items-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center space-x-2 transition cursor-pointer"
            >
              <span>Continue to Description</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DESCRIPTION & AI TRIAGE */}
      {currentStep === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">Describe the Issue</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Explain the problem in your own words. Use our AI engine to assess priority.
              </p>
            </div>
            <button
              onClick={triggerAiAnalysis}
              disabled={analyzingAi}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 transition flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{analyzingAi ? 'Analyzing with Gemini...' : 'Analyze with AI'}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Issue Headline / Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Deep crater pothole near primary school pedestrian crossing"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Detailed Description & Hazard Severity
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, how long the issue has persisted, and if it poses immediate safety danger to pedestrians, two-wheelers, or children..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* AI Auto-Triage Result Card */}
            {aiResult && (
              <div className="p-4 rounded-xl bg-slate-850 border border-emerald-500/40 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Gemini AI Triage Assessment</span>
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                      {Math.round(aiResult.confidence * 100)}% Confidence
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    Provider: {aiResult.provider}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Recommended Category</span>
                    <span className="font-bold text-emerald-400">{aiResult.predictedCategory}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Suggested Priority</span>
                    <span className={`font-bold ${aiResult.suggestedPriority === 'Critical' ? 'text-rose-400' : 'text-amber-400'}`}>
                      {aiResult.suggestedPriority}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 block">Assigned Dept</span>
                    <span className="font-bold text-sky-400 truncate block">{aiResult.suggestedDepartment}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 italic bg-slate-900/50 p-2 rounded-lg">
                  "{aiResult.reasoning}"
                </p>

                {aiResult.safetyHazardsIdentified && aiResult.safetyHazardsIdentified.length > 0 && (
                  <div className="text-[11px] text-rose-300 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Identified Risks: {aiResult.safetyHazardsIdentified.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Manual Priority Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Urgency Priority (Citizen Assessment)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['Low', 'Medium', 'High', 'Critical'] as ComplaintPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      priority === p
                        ? p === 'Critical'
                          ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                          : p === 'High'
                          ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                          : 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition flex items-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => {
                if (!description.trim()) {
                  alert('Please enter a description.');
                  return;
                }
                setCurrentStep(4);
              }}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center space-x-2 transition cursor-pointer"
            >
              <span>Continue to Location</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: GEOSPATIAL MAP LOCATION */}
      {currentStep === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">Pin the Location</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Drag marker or click anywhere on the OpenStreetMap to place the incident pin.
              </p>
            </div>
            <button
              onClick={handleGetGeolocation}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span>Use My GPS</span>
            </button>
          </div>

          {/* Leaflet Map Canvas */}
          <div className="rounded-2xl overflow-hidden border border-slate-700 h-72 w-full relative z-0">
            <div ref={mapContainerRef} className="h-full w-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Street Address / Zone
              </label>
              <input
                type="text"
                value={location.address}
                onChange={(e) => setLocation({ ...location, address: e.target.value })}
                placeholder="e.g., 420 Oak Street, Ward 4"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Notable Landmark (Optional)
              </label>
              <input
                type="text"
                value={location.landmark}
                onChange={(e) => setLocation({ ...location, landmark: e.target.value })}
                placeholder="e.g., Opposite Primary School Gate B"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-850 rounded-xl text-xs text-slate-400 flex items-center justify-between">
            <span>Coordinates: <strong className="text-white font-mono">{location.lat}, {location.lng}</strong></span>
            <span className="text-[11px] text-emerald-400">✓ Accurate GPS Pin</span>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition flex items-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={async () => {
                await checkDuplicatesBeforeReview();
                setCurrentStep(5);
              }}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center space-x-2 transition cursor-pointer"
            >
              <span>Review & Submit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & DUPLICATE CHECK */}
      {currentStep === 5 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Review Before Final Submission</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify your complaint details and review possible duplicate reports nearby.
            </p>
          </div>

          {/* Duplicate Detection Advisory */}
          {duplicates.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/50 space-y-3">
              <div className="flex items-center space-x-2 text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs font-bold">
                  AI Duplicate Detector: {duplicates.length} similar active complaint(s) found nearby
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                A similar civic issue has already been logged in this vicinity. You may still proceed if this is an independent problem.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {duplicates.map((dup, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono text-emerald-400 font-bold">{dup.complaint.complaintId}</span>
                      <p className="text-slate-300 font-medium">{dup.complaint.title}</p>
                      <span className="text-[10px] text-slate-400">{dup.distanceMeters}m away • {dup.reasons.join(', ')}</span>
                    </div>
                    <button
                      onClick={() => onOpenComplaint(dup.complaint.id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-white shrink-0 ml-3"
                    >
                      View Report
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission Summary Card */}
          <div className="p-5 rounded-xl bg-slate-850/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Category</span>
                <span className="text-sm font-bold text-white">{category}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Assigned Priority</span>
                <span className={`text-xs font-bold ${priority === 'Critical' ? 'text-rose-400' : 'text-amber-400'}`}>
                  {priority} Priority
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Title</span>
              <p className="text-xs font-semibold text-white mt-0.5">{title || `${category} issue`}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Description</span>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Location</span>
                <p className="text-slate-200 mt-0.5">{location.address}</p>
                {location.landmark && <span className="text-[11px] text-slate-400">Landmark: {location.landmark}</span>}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Attached Photos</span>
                <p className="text-slate-200 mt-0.5">{images.length} photo(s) attached</p>
              </div>
            </div>
          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs">
              {submitError}
            </div>
          )}

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition flex items-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/25 flex items-center space-x-2 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Submitting Grievance...' : 'Submit Grievance'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
