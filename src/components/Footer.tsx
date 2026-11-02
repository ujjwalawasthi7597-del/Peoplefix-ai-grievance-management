import React from 'react';
import { ShieldCheck, PhoneCall, Clock, CheckCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & mission */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                PF
              </div>
              <span className="font-extrabold text-white text-base">People<span className="text-emerald-400">Fix</span></span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Empowering citizens and municipal departments through AI-assisted grievance classification, automated SLA escalations, and geospatial resolution tracking.
            </p>
          </div>

          {/* Citizen Guarantees */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Citizen Charter</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Transparent SLA Deadlines</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Photo Resolution Evidence</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Full Audit Timeline History</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Privacy-Protected Contact Info</span>
              </li>
            </ul>
          </div>

          {/* Quick Helplines */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Emergency Helplines</h4>
            <div className="space-y-1.5 text-slate-400">
              <p className="flex items-center space-x-2">
                <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
                <span>Road Emergency: 1800-ROADS-911</span>
              </p>
              <p className="flex items-center space-x-2">
                <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
                <span>Water Main Burst: 1800-WATER-FIX</span>
              </p>
              <p className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Control Room: 24/7 Operations</span>
              </p>
            </div>
          </div>

          {/* AI Intelligence Transparency */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">AI Transparency</h4>
            <p className="text-slate-400 leading-relaxed">
              PeopleFix integrates Google Gemini 3.8 Flash for visual damage analysis and text categorization with automated rule-based fallbacks. Recommendations are reviewed by authorized municipal officers.
            </p>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Certified Municipal Platform</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} PeopleFix — AI-Powered Public Grievance Management Platform. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Enterprise Government Edition v1.0 • Built with Node.js & React</p>
        </div>
      </div>
    </footer>
  );
};
