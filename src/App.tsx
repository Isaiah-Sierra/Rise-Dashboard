/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from "react";
import { useChurchData } from "./hooks/useChurchData";
import { Sidebar, TabType } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { Dashboard } from "./pages/Dashboard";
import { Attendance } from "./pages/Attendance";
import { ServeTeams } from "./pages/ServeTeams";
import { GuestExperience } from "./pages/GuestExperience";
import { Projections } from "./pages/Projections";
import { RefreshCw } from "lucide-react";

export default function App() {
  const { rawData, isLoading, error, refetch } = useChurchData();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (rawData.length > 0 && (!selectedDate || !rawData.find(d => d.date === selectedDate))) {
      setSelectedDate(rawData[rawData.length - 1].date);
    }
  }, [rawData, selectedDate]);

  const { activeWeek, activeIndex, prevWeek, healthRatios } = useMemo(() => {
    if (rawData.length === 0) return { activeWeek: null, activeIndex: -1, prevWeek: null, healthRatios: {} };

    const foundWeek = rawData.find(d => d.date === selectedDate);
    const active = foundWeek || rawData[rawData.length - 1];
    const idx = rawData.findIndex(d => d.date === active.date);
    const prev = idx > 0 ? rawData[idx - 1] : null;

    const audBase = active.totals?.auditorium || active.totals?.overall || 1;
    const teamBase = active.totals?.team || 0;
    const kidsBase = active.totals?.kids || 0;
    const guestBase = (active.totals?.newGuests || 0) + (active.totals?.secondTimeGuests || 0);
    const chairBase = active.totals?.chairCount || 0;
    
    const ratios = {
      kids: ((kidsBase / audBase) * 100).toFixed(1),
      serve: ((teamBase / audBase) * 100).toFixed(1),
      guests: ((guestBase / audBase) * 100).toFixed(1),
      cap: chairBase > 0 ? Math.round(((active.totals?.auditorium || 0) / chairBase) * 100) : 0,
      park: active.totals?.vehicles > 0 ? ((active.totals?.overall || 0) / active.totals.vehicles).toFixed(1) : 0,
      chairsPerSvc: (active.services?.length || 0) > 0 ? Math.round(chairBase / active.services.length) : chairBase
    };

    return { activeWeek: active, activeIndex: idx, prevWeek: prev, healthRatios: ratios };
  }, [rawData, selectedDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <RefreshCw className="w-10 h-10 animate-spin mb-4 text-slate-900" />
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Connecting to Rise Cloud...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans p-6 text-center">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg max-w-md">
          <h2 className="font-bold mb-2">Error Loading Data</h2>
          <p className="text-sm">{error}</p>
          <button onClick={refetch} className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-md text-sm font-medium hover:bg-rose-700 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header 
          rawData={rawData} 
          selectedDate={selectedDate} 
          setSelectedDate={setSelectedDate} 
          isLoading={isLoading} 
          refetch={refetch}
          activeWeek={activeWeek}
          activeIndex={activeIndex}
        />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && <Dashboard rawData={rawData} selectedDate={selectedDate} setSelectedDate={setSelectedDate} activeWeek={activeWeek} prevWeek={prevWeek} healthRatios={healthRatios} activeIndex={activeIndex} />}
            {currentTab === 'attendance' && <Attendance rawData={rawData} activeWeek={activeWeek} setSelectedDate={setSelectedDate} />}
            {currentTab === 'serve' && <ServeTeams rawData={rawData} activeWeek={activeWeek} healthRatios={healthRatios} setSelectedDate={setSelectedDate} />}
            {currentTab === 'guests' && <GuestExperience rawData={rawData} activeWeek={activeWeek} setSelectedDate={setSelectedDate} />}
            {currentTab === 'projections' && <Projections rawData={rawData} activeWeek={activeWeek} setSelectedDate={setSelectedDate} />}
          </div>
        </main>
      </div>
    </div>
  );
}
