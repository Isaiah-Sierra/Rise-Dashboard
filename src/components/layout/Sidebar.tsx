import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Baby, Heart, TrendingUp, Menu, X } from "lucide-react";
import { useState } from "react";
import { BRAND } from "@/constants";

export type TabType = 'dashboard' | 'attendance' | 'serve' | 'guests' | 'projections';

interface SidebarProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
}

export function Sidebar({ currentTab, setCurrentTab }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance & Kids', icon: Baby },
    { id: 'serve', label: 'Serve Teams', icon: Users },
    { id: 'guests', label: 'Guest Experience', icon: Heart },
    { id: 'projections', label: 'Projections', icon: TrendingUp },
  ] as const;

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <img src="https://images.squarespace-cdn.com/content/v1/586c2259579fb3ccd8b5cd4a/1503978477490-86FAD7OFE2UR0K75OXH2/Icon.png?format=1500w" className="w-8 h-8 object-contain" alt="Rise" />
          <span className="font-heading text-lg text-slate-900" style={{ color: BRAND.navy }}>Lead Team Dashboard</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="hidden lg:flex items-center space-x-3 p-6">
            <img src="https://images.squarespace-cdn.com/content/v1/586c2259579fb3ccd8b5cd4a/1503978477490-86FAD7OFE2UR0K75OXH2/Icon.png?format=1500w" className="w-10 h-10 object-contain" alt="Rise" />
            <span className="font-heading text-lg leading-tight" style={{ color: BRAND.navy }}>Lead Team<br/>Dashboard</span>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCurrentTab(tab.id as TabType);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors font-heading",
                    isActive 
                      ? "bg-slate-900 text-white" 
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  )}
                  style={isActive ? { backgroundColor: BRAND.navy } : {}}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
