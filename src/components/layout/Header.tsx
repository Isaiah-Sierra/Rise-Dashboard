import { WeeklyData } from "@/hooks/useChurchData";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/constants";

interface HeaderProps {
  rawData: WeeklyData[];
  selectedDate: string | null;
  setSelectedDate: (date: string) => void;
  isLoading: boolean;
  refetch: () => void;
  activeWeek: WeeklyData | null;
  activeIndex: number;
}

export function Header({ rawData, selectedDate, setSelectedDate, isLoading, refetch, activeWeek, activeIndex }: HeaderProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 flex items-center justify-between">
      <div className="hidden lg:block">
        <h1 className="font-heading text-2xl tracking-tight leading-none" style={{ color: BRAND.navy }}>Overview</h1>
        <p className="font-heading text-[10px] text-slate-400 uppercase tracking-widest mt-1">Weekly Metric Review</p>
      </div>

      <div className="flex items-center space-x-4 ml-auto">
        {/* Date Selector */}
        <div className="relative flex items-center bg-white border border-slate-200 rounded-full shadow-sm">
          <button 
            onClick={() => setIsCalendarOpen(!isCalendarOpen)} 
            className="flex items-center py-2.5 px-5 hover:bg-slate-50 transition-all rounded-l-full"
          >
            <Calendar className="w-4 h-4 mr-2" style={{ color: BRAND.red }} />
            <span className="font-heading text-xs mr-2" style={{ color: BRAND.navy }}>
              {activeWeek?.displayDate || 'Select Week'}
            </span>
            <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform", isCalendarOpen && "rotate-180")} />
          </button>
          
          {isCalendarOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsCalendarOpen(false)} />
              <div className="absolute right-0 top-full mt-2 bg-white w-64 rounded-2xl shadow-xl border border-slate-100 p-2 max-h-[300px] overflow-y-auto z-50">
                <p className="font-heading px-3 py-2 text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Select Sunday</p>
                {[...rawData].reverse().map(w => (
                  <button 
                    key={w.date} 
                    onClick={() => { setSelectedDate(w.date); setIsCalendarOpen(false); }} 
                    className={cn(
                      "w-full text-left p-3 rounded-xl text-xs font-bold transition-colors",
                      w.date === selectedDate 
                        ? "bg-slate-900 text-white" 
                        : "hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    {w.displayDate}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="h-5 w-px bg-slate-200" />
          
          <button 
            onClick={() => activeIndex > 0 && setSelectedDate(rawData[activeIndex-1].date)} 
            disabled={activeIndex <= 0} 
            className="p-2.5 px-3 hover:bg-slate-50 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <button 
            onClick={() => activeIndex < rawData.length -1 && setSelectedDate(rawData[activeIndex+1].date)} 
            disabled={activeIndex >= rawData.length -1 || activeIndex === -1} 
            className="p-2.5 px-3 hover:bg-slate-50 disabled:opacity-30 rounded-r-full transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <button 
          onClick={refetch} 
          className="p-2.5 bg-white text-slate-500 rounded-full shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </button>
      </div>
    </header>
  );
}
