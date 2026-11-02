import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.ts';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../types/index.ts';
import {
  MapPin,
  Filter,
  Layers,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface IssueMapPageProps {
  onOpenComplaint: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export const IssueMapPage: React.FC<IssueMapPageProps> = ({ onOpenComplaint, onNavigate }) => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  // Fetch complaints
  const fetchMapComplaints = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const res = await api.map.getComplaints(params);
      setComplaints(res.complaints);
    } catch (err) {
      console.error('Error fetching map complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapComplaints();
  }, [categoryFilter, statusFilter, priorityFilter]);

  // Initialize or update Leaflet map
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current).setView([37.7749, -122.4194], 13);

      // CartoDB Dark Matter / OSM standard tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      leafletMapRef.current = map;
    }

    // Render Markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      complaints.forEach((comp) => {
        if (!comp.location || typeof comp.location.lat !== 'number' || typeof comp.location.lng !== 'number') return;

        // Custom HTML marker pin with status color
        const color =
          comp.status === 'Resolved'
            ? '#10b981'
            : comp.priority === 'Critical'
            ? '#f43f5e'
            : comp.priority === 'High'
            ? '#f59e0b'
            : '#38bdf8';

        const customIcon = L.divIcon({
          className: 'custom-pin',
          html: `<div style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50%; border: 3px solid #0f172a; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 11px;">
            ${comp.category.charAt(0)}
          </div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker([comp.location.lat, comp.location.lng], { icon: customIcon });

        marker.on('click', () => {
          setSelectedComplaint(comp);
        });

        markersLayerRef.current.addLayer(marker);
      });
    }
  }, [complaints]);

  // Statistics
  const total = complaints.length;
  const critical = complaints.filter((c) => c.priority === 'Critical').length;
  const inProgress = complaints.filter((c) => c.status === 'In Progress' || c.status === 'Assigned').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h1 className="text-base font-extrabold text-white">Interactive Municipal Issue Map</h1>
              <span className="text-xs text-slate-400">({total} Geotagged Issues)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live OpenStreetMap visualization of citizen-reported municipal grievances.
            </p>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs w-full md:w-auto">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="Road Damage / Potholes">Road Damage / Potholes</option>
              <option value="Garbage Collection">Garbage Collection</option>
              <option value="Streetlight Failure">Streetlight Failure</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Drainage Problems">Drainage Problems</option>
              <option value="Sewage Overflow">Sewage Overflow</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <button
              onClick={() => onNavigate('report')}
              className="px-3.5 py-1.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition ml-auto md:ml-0 cursor-pointer"
            >
              + Report Pin
            </button>
          </div>
        </div>
      </div>

      {/* Map Body & Drawer */}
      <div className="flex-1 relative flex">
        {/* Full-width Map Canvas */}
        <div ref={mapContainerRef} className="flex-1 h-[calc(100vh-140px)] w-full z-0" />

        {/* Selected Complaint Floating Detail Card */}
        {selectedComplaint && (
          <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:w-96 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-5 shadow-2xl z-30 space-y-3 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {selectedComplaint.complaintId}
              </span>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            {selectedComplaint.imagePreview && (
              <img
                src={selectedComplaint.imagePreview}
                alt="Preview"
                className="rounded-xl h-32 w-full object-cover border border-slate-800"
              />
            )}

            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  selectedComplaint.priority === 'Critical'
                    ? 'bg-rose-500/20 text-rose-300'
                    : selectedComplaint.priority === 'High'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-sky-500/20 text-sky-300'
                }`}>
                  {selectedComplaint.priority} Priority
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  {selectedComplaint.category}
                </span>
              </div>
              <h3 className="font-bold text-white text-sm line-clamp-2">
                {selectedComplaint.title}
              </h3>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 pt-1 border-t border-slate-800">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{selectedComplaint.location.address}</span>
            </div>

            <button
              onClick={() => onOpenComplaint(selectedComplaint.id)}
              className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center space-x-1 cursor-pointer shadow-md"
            >
              <span>View Full Tracking Timeline</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Legend Box */}
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-lg z-20 text-[11px] space-y-1.5 hidden sm:block">
          <div className="font-bold text-white text-[10px] uppercase tracking-wider mb-1">Map Status Pins</div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-slate-900"></span>
            <span className="text-slate-300">Critical Priority</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-slate-900"></span>
            <span className="text-slate-300">High Priority</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-sky-400 ring-2 ring-slate-900"></span>
            <span className="text-slate-300">Medium / Standard</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
            <span className="text-slate-300">Resolved Issue</span>
          </div>
        </div>
      </div>
    </div>
  );
};
