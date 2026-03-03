import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, Baby, UserPlus, Heart, 
  TrendingUp, TrendingDown
} from 'lucide-react';
import { WeeklyData } from "@/hooks/useChurchData";
import { BRAND } from "@/constants";

const Card = ({ children, className = '', style = {} }: any) => (
  <div className={`bg-white rounded-3xl shadow-sm border border-slate-100/50 ${className}`} style={{ ...style, borderColor: '#E2E8F0' }}>
    {children}
  </div>
);

const KPICard = ({ title, value, prevWeekVal, yoyValue, yoyDate, icon: Icon, accentColor }: any) => {
  const calcChange = (current: number, previous: number) => {
    if (previous === undefined || previous === null || previous === 0) return null;
    const percent = Math.round(((current - previous) / previous) * 100);
    return {
      percent: Math.abs(percent),
      isPositive: percent > 0,
      isNegative: percent < 0,
      isNeutral: percent === 0,
    };
  };

  const wow = calcChange(value || 0, prevWeekVal || 0);
  const yoy = calcChange(value || 0, yoyValue || 0);

  const renderBadge = (change: any, previousValue: number, label: string, subDate?: string) => {
    if (!change) return null;
    return (
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-[2px]">
          <span className={`flex items-center font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${change.isPositive ? 'text-emerald-700 bg-emerald-50' : change.isNegative ? 'text-rose-700 bg-rose-50' : 'text-slate-500 bg-slate-100'}`}>
            {change.isPositive ? <TrendingUp className="w-2.5 h-2.5 mr-1" /> : change.isNegative ? <TrendingDown className="w-2.5 h-2.5 mr-1" /> : null}
            {change.percent}%
          </span>
        </div>
        <div className="ml-3 flex flex-col">
          <div className="text-[11px] leading-tight text-slate-500 font-medium">
            {label} <span className="font-bold ml-1" style={{ color: BRAND.navy }}>{(previousValue || 0).toLocaleString()}</span>
          </div>
          {subDate && <div className="text-[10px] text-slate-400 font-medium mt-0.5">{String(subDate)}</div>}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-7 overflow-hidden relative shadow-md shadow-slate-100/40">
      <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.04] rounded-full pointer-events-none" style={{ backgroundColor: accentColor }} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="font-heading text-[11px] uppercase tracking-[0.1em] mb-1 text-slate-400">{title}</p>
          <h3 className="font-heading text-4xl tracking-tight" style={{ color: BRAND.navy }}>{(value || 0).toLocaleString()}</h3>
        </div>
        <div className="p-4 rounded-full shadow-sm" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="mt-6 space-y-3 relative z-10">
        {wow ? renderBadge(wow, prevWeekVal, "vs last week") : <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No prior week</span>}
        {yoy && renderBadge(yoy, yoyValue, "vs last year", yoyDate)}
      </div>
    </Card>
  );
};

interface DashboardProps {
  rawData: WeeklyData[];
  selectedDate: string | null;
  setSelectedDate: (date: string) => void;
  activeWeek: WeeklyData | null;
  prevWeek: WeeklyData | null;
  healthRatios: any;
  activeIndex: number;
}

export function Dashboard({ rawData, selectedDate, setSelectedDate, activeWeek, prevWeek, healthRatios, activeIndex }: DashboardProps) {
  const [expandedRows, setExpandedRows] = useState(new Set<string>());
  
  // Tab: Dashboard Independent Filters
  const [highlightsYear, setHighlightsYear] = useState<string | null>(null);
  const [trendFilter, setTrendFilter] = useState('30D');
  const [trendCustomStart, setTrendCustomStart] = useState('');
  const [trendCustomEnd, setTrendCustomEnd] = useState('');
  const [guestRetentionRange, setGuestRetentionRange] = useState('6W');
  const [guestRetentionStartDate, setGuestRetentionStartDate] = useState('');
  const [guestRetentionEndDate, setGuestRetentionEndDate] = useState('');
  
  // Independent Ledger Filters
  const [ledgerFilter, setLedgerFilter] = useState('30D');
  const [ledgerCustomStart, setLedgerCustomStart] = useState('');
  const [ledgerCustomEnd, setLedgerCustomEnd] = useState('');

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  const { 
    lastYearWeek, 
    availableYears, 
    highlightsData, 
    guestDisplayData,
    filteredTrendData,
    filteredLedgerData
  } = useMemo(() => {
    if (rawData.length === 0 || !activeWeek) return { 
      lastYearWeek: { totals: {} } as any, 
      availableYears: [], highlightsData: {} as any, 
      guestDisplayData: [], filteredTrendData: [], filteredLedgerData: []
    };

    // 2. Year Logic
    const yrs = [...new Set(rawData.map(d => d.date.split('-')[0]))].sort((a, b) => Number(b) - Number(a));
    const currentActiveYear = activeWeek.date.split('-')[0];
    const targetHighlightsYear = highlightsYear || currentActiveYear;

    // 3. Last Year Comparison
    const dateParts = activeWeek.date.split('-').map(Number);
    const activeDateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const targetTime = activeDateObj.setFullYear(activeDateObj.getFullYear() - 1);
    const lastYear = rawData.reduce((p, c) => {
      const cTime = new Date(c.date).getTime();
      const pTime = p.date ? new Date(p.date).getTime() : 0;
      return Math.abs(cTime - targetTime) < Math.abs(pTime - targetTime) ? c : p;
    }, { totals: {} } as any);

    // 5. Highlights Data
    const hWeeks = rawData.filter(d => d.date.startsWith(targetHighlightsYear) && d.date <= activeWeek.date);
    const capWeeks = hWeeks.filter(w => (w.totals?.chairCount || 0) > 0);
    const hData = {
      baptisms: hWeeks.reduce((sum, w) => sum + (w.totals?.baptisms || 0), 0),
      nextSteps: hWeeks.reduce((sum, w) => sum + (w.totals?.nextSteps || 0), 0),
      dedications: hWeeks.reduce((sum, w) => sum + (w.totals?.dedications || 0), 0),
      familyDinner: hWeeks.reduce((sum, w) => sum + (w.totals?.familyDinner || 0), 0),
      avgAttendance: hWeeks.length > 0 ? Math.round(hWeeks.reduce((sum, w) => sum + (w.totals?.overall || 0), 0) / hWeeks.length) : 0,
      avgServe: hWeeks.length > 0 ? Math.round(hWeeks.reduce((sum, w) => sum + (w.totals?.team || 0), 0) / hWeeks.length) : 0,
      avgCap: capWeeks.length > 0 ? Math.round(capWeeks.reduce((sum, w) => sum + ((w.totals?.auditorium || w.totals?.overall || 0) / w.totals.chairCount), 0) / capWeeks.length * 100) : 0,
      year: targetHighlightsYear,
      isCurrent: targetHighlightsYear === currentActiveYear
    };

    // 9. Dashboard Trend Filters
    let fTrend = rawData;
    if (trendFilter === 'Custom') {
      fTrend = rawData.filter(d => (d.date >= (trendCustomStart || '0000') && d.date <= (trendCustomEnd || '9999')));
    } else {
      const lD = rawData[rawData.length - 1]?.date;
      if (lD) {
        const [ly, lm, ld] = lD.split('-').map(Number);
        let cS = "";
        const pad = (n: number) => n.toString().padStart(2, '0');
        if (trendFilter === '30D') {
          const cd = new Date(ly, lm - 1, ld); cd.setDate(cd.getDate() - 30);
          cS = `${cd.getFullYear()}-${pad(cd.getMonth() + 1)}-${pad(cd.getDate())}`;
        } else if (trendFilter === 'MTD') cS = `${ly}-${pad(lm)}-01`;
        else if (trendFilter === '6M') {
          const cd = new Date(ly, lm - 1 - 6, ld);
          cS = `${cd.getFullYear()}-${pad(cd.getMonth() + 1)}-${pad(cd.getDate())}`;
        } else if (trendFilter === 'YTD') cS = `${ly}-01-01`;
        if (cS) fTrend = rawData.filter(item => item.date >= cS);
      }
    }

    // 10. Guest Display Logic
    let gDisp = [] as WeeklyData[];
    if (activeIndex !== -1) {
      if (guestRetentionRange === '6W') {
        gDisp = rawData.slice(Math.max(0, activeIndex - 5), activeIndex + 1);
      } else if (guestRetentionRange === 'MTD') {
        gDisp = rawData.filter(d => d.date.startsWith(activeWeek.date.substring(0, 7)) && d.date <= activeWeek.date);
      } else if (guestRetentionRange === '6M') {
        const d6 = new Date(activeWeek.date);
        const s6 = new Date(d6.setMonth(d6.getMonth() - 6)).toISOString().split('T')[0];
        gDisp = rawData.filter(d => d.date >= s6 && d.date <= activeWeek.date);
      } else if (guestRetentionRange === 'Custom') {
        gDisp = rawData.filter(d => d.date >= (guestRetentionStartDate || '0000') && d.date <= (guestRetentionEndDate || '9999'));
      }
    }

    // 11. Dashboard Ledger Filters
    let fLedger = rawData;
    if (ledgerFilter === 'Custom') {
      fLedger = rawData.filter(d => (d.date >= (ledgerCustomStart || '0000') && d.date <= (ledgerCustomEnd || '9999')));
    } else {
      const lD = rawData[rawData.length - 1]?.date;
      if (lD) {
        const [ly, lm, ld] = lD.split('-').map(Number);
        let cS = "";
        const pad = (n: number) => n.toString().padStart(2, '0');
        if (ledgerFilter === '30D') {
          const cd = new Date(ly, lm - 1, ld); cd.setDate(cd.getDate() - 30);
          cS = `${cd.getFullYear()}-${pad(cd.getMonth() + 1)}-${pad(cd.getDate())}`;
        } else if (ledgerFilter === 'MTD') cS = `${ly}-${pad(lm)}-01`;
        else if (ledgerFilter === '6M') {
          const cd = new Date(ly, lm - 1 - 6, ld);
          cS = `${cd.getFullYear()}-${pad(cd.getMonth() + 1)}-${pad(cd.getDate())}`;
        } else if (ledgerFilter === 'YTD') cS = `${ly}-01-01`;
        if (cS) fLedger = rawData.filter(item => item.date >= cS);
      }
    }

    return { 
      lastYearWeek: lastYear, 
      availableYears: yrs, highlightsData: hData, 
      guestDisplayData: gDisp, filteredTrendData: fTrend, filteredLedgerData: fLedger
    };
  }, [
    rawData, selectedDate, highlightsYear, 
    trendFilter, trendCustomStart, trendCustomEnd, 
    guestRetentionRange, guestRetentionStartDate, guestRetentionEndDate,
    ledgerFilter, ledgerCustomStart, ledgerCustomEnd, activeWeek, activeIndex
  ]);

  const toggleRow = (dateStr: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(dateStr)) newExpanded.delete(dateStr);
    else newExpanded.add(dateStr);
    setExpandedRows(newExpanded);
  };

  if (!activeWeek) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Rise Kids', val: `${healthRatios.kids}%`, color: BRAND.teal, title: 'Demographic Balance', desc: 'Ratio of kids to auditorium adults.' },
          { label: 'Serve Rate', val: `${healthRatios.serve}%`, color: BRAND.green, title: 'Core Engagement', desc: 'Ratio of serve team to adults.' },
          { label: 'Guest Cards', val: `${healthRatios.guests}%`, color: BRAND.red, title: 'Connection Rate', desc: 'Welcome cards vs adult attendance.' },
          { label: 'Capacity', val: `${healthRatios.cap}%`, color: BRAND.navy, title: 'Room Utilization', desc: healthRatios.cap > 0 ? `Based on ~${healthRatios.chairsPerSvc} chairs per service.` : 'Chairs not recorded for this week.' },
          { label: 'Parking', val: healthRatios.park > 0 ? healthRatios.park : '-', color: BRAND.slate, title: 'People per Car', desc: 'Predict lot bottlenecks.' }
        ].map((k, i) => (
          <Card key={i} className="p-5 border-t-4 shadow-sm flex flex-col justify-between group" style={{ borderTopColor: k.color }}>
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-heading text-[11px] text-slate-400 uppercase tracking-widest">{k.label}</h4>
              <span className="font-heading text-2xl tracking-tight" style={{ color: k.color }}>{k.val}</span>
            </div>
            <div className="mt-auto">
              <p className="font-heading text-[10px] uppercase tracking-tight mb-1" style={{ color: BRAND.navy }}>{k.title}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">{k.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Attendance" value={activeWeek?.totals?.overall} prevWeekVal={prevWeek?.totals?.overall} yoyValue={lastYearWeek?.totals?.overall} yoyDate={lastYearWeek?.displayDate} icon={Users} accentColor={BRAND.teal} />
        <KPICard title="Rise Kids" value={activeWeek?.totals?.kids} prevWeekVal={prevWeek?.totals?.kids} yoyValue={lastYearWeek?.totals?.kids} yoyDate={lastYearWeek?.displayDate} icon={Baby} accentColor={BRAND.green} />
        <KPICard title="New Guests" value={activeWeek?.totals?.newGuests} prevWeekVal={prevWeek?.totals?.newGuests} yoyValue={lastYearWeek?.totals?.newGuests} yoyDate={lastYearWeek?.displayDate} icon={UserPlus} accentColor={BRAND.red} />
        <KPICard title="Decisions" value={activeWeek?.totals?.decisions} prevWeekVal={prevWeek?.totals?.decisions} yoyValue={lastYearWeek?.totals?.decisions} yoyDate={lastYearWeek?.displayDate} icon={Heart} accentColor={BRAND.navy} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-8 lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h3 className="font-heading text-sm uppercase tracking-widest text-slate-400">Growth Trendlines</h3>
              <p className="text-[10px] font-bold mt-1 uppercase tracking-widest animate-in fade-in" style={{ color: BRAND.teal }}>Click chart to jump to date</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex bg-slate-100 p-1 rounded-full shadow-inner">
                {['30D', 'MTD', '6M', 'YTD', 'All', 'Custom'].map(f => (
                  <button key={f} onClick={() => setTrendFilter(f)} className={`px-4 py-1.5 font-heading text-[10px] rounded-full transition-all ${trendFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{f}</button>
                ))}
              </div>
              {trendFilter === 'Custom' && (
                <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
                  <input type="date" value={trendCustomStart} onChange={(e) => setTrendCustomStart(e.target.value)} className="font-heading text-[10px] uppercase bg-transparent border-none focus:ring-0 text-slate-700 outline-none" />
                  <span className="font-heading text-slate-400 text-[10px]">to</span>
                  <input type="date" value={trendCustomEnd} onChange={(e) => setTrendCustomEnd(e.target.value)} className="font-heading text-[10px] uppercase bg-transparent border-none focus:ring-0 text-slate-700 outline-none" />
                </div>
              )}
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={filteredTrendData.map(d => ({ originalDate: d.date, name: formatShortDate(d.date), val: d.totals?.overall || 0, kids: d.totals?.kids || 0, team: d.totals?.team || 0 }))}
                onClick={(e: any) => {
                  if (e?.activePayload?.[0]?.payload?.originalDate) {
                    setSelectedDate(e.activePayload[0].payload.originalDate);
                  }
                }}
                className="focus:outline-none"
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontFamily: 'Proxima Nova, sans-serif' }} />
                <Line type="monotone" dataKey="val" stroke={BRAND.navy} strokeWidth={4} dot={false} activeDot={{r: 6, strokeWidth: 0, cursor: 'pointer', onClick: (_: any, p: any) => p?.payload?.originalDate && setSelectedDate(p.payload.originalDate)}} name="Overall" />
                <Line type="monotone" dataKey="kids" stroke={BRAND.teal} strokeWidth={4} dot={false} activeDot={{r: 6, strokeWidth: 0, cursor: 'pointer', onClick: (_: any, p: any) => p?.payload?.originalDate && setSelectedDate(p.payload.originalDate)}} name="Rise Kids" />
                <Line type="monotone" dataKey="team" stroke={BRAND.green} strokeWidth={4} dot={false} activeDot={{r: 6, strokeWidth: 0, cursor: 'pointer', onClick: (_: any, p: any) => p?.payload?.originalDate && setSelectedDate(p.payload.originalDate)}} name="Serve Team" />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontFamily: 'Gotham Bold, sans-serif', fontSize: '12px' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card className="p-8 flex flex-col justify-center relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
            <span className="font-heading text-[10px] uppercase tracking-widest mb-1 text-slate-400">Attendance</span>
            <span className="font-heading text-4xl tracking-tighter" style={{ color: BRAND.navy }}>{(activeWeek?.totals?.overall || 0).toLocaleString()}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart
              className="focus:outline-none"
              style={{ outline: 'none' }}
            >
              <Pie data={[{ name: 'Auditorium', value: activeWeek?.totals?.auditorium || activeWeek?.totals?.overall || 0 }, { name: 'Rise Kids', value: activeWeek?.totals?.kids || 0 }, { name: 'Serve Team', value: activeWeek?.totals?.team || 0 }]} innerRadius={90} outerRadius={120} paddingAngle={8} dataKey="value" stroke="none">
                <Cell fill={BRAND.navy} /><Cell fill={BRAND.teal} /><Cell fill={BRAND.green} />
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontFamily: 'Proxima Nova, sans-serif' }} />
              <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontFamily: 'Gotham Bold, sans-serif', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-8 lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h3 className="font-heading text-sm uppercase tracking-widest text-slate-400">Guest Retention Data</h3>
            <div className="flex flex-wrap gap-2">
              <div className="flex bg-slate-100 p-1 rounded-full shadow-inner">
                {['6W', 'MTD', '6M', 'Custom'].map(r => (
                  <button key={r} onClick={() => setGuestRetentionRange(r)} className={`px-4 py-1.5 font-heading text-[10px] rounded-full transition-all ${guestRetentionRange === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{r}</button>
                ))}
              </div>
              {guestRetentionRange === 'Custom' && (
                <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
                  <input type="date" value={guestRetentionStartDate} onChange={(e) => setGuestRetentionStartDate(e.target.value)} className="font-heading text-[10px] uppercase bg-transparent border-none focus:ring-0 text-slate-700 outline-none" />
                  <span className="font-heading text-slate-400 text-[10px]">to</span>
                  <input type="date" value={guestRetentionEndDate} onChange={(e) => setGuestRetentionEndDate(e.target.value)} className="font-heading text-[10px] uppercase bg-transparent border-none focus:ring-0 text-slate-700 outline-none" />
                </div>
              )}
            </div>
          </div>
          <div className="h-64 mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={guestDisplayData.map(d => ({ originalDate: d.date, name: formatShortDate(d.date), '1st Time': d.totals?.newGuests || 0, '2nd Time': d.totals?.secondTimeGuests || 0 }))}
                onClick={(e: any) => {
                  if (e?.activePayload?.[0]?.payload?.originalDate) {
                    setSelectedDate(e.activePayload[0].payload.originalDate);
                  }
                }}
                className="focus:outline-none"
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} />
                <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{ borderRadius: '1rem', border: 'none', fontFamily: 'Proxima Nova, sans-serif' }} />
                <Bar dataKey="1st Time" fill={BRAND.red} radius={[4, 4, 0, 0]} maxBarSize={40} onClick={(data: any) => data?.originalDate && setSelectedDate(data.originalDate)} cursor="pointer" />
                <Bar dataKey="2nd Time" fill={BRAND.teal} radius={[4, 4, 0, 0]} maxBarSize={40} onClick={(data: any) => data?.originalDate && setSelectedDate(data.originalDate)} cursor="pointer" />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontFamily: 'Gotham Bold, sans-serif', fontSize: '12px' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8 text-white flex flex-col justify-between border-none shadow-xl" style={{ backgroundColor: BRAND.navy }}>
          <div className="flex justify-between items-start mb-8">
            <h3 className="font-heading text-sm uppercase tracking-widest text-slate-300">Ministry Highlights</h3>
            <select value={highlightsData.year || ''} onChange={(e) => setHighlightsYear(e.target.value)} className="font-heading text-[11px] uppercase text-white rounded-full px-3 py-1 outline-none border border-white/20" style={{ backgroundColor: BRAND.slate }}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="space-y-6">
            <div>
              <p className="font-heading text-[10px] text-slate-400 uppercase mb-1 tracking-wider">Avg Attendance (YTD)</p>
              <span className="font-heading text-4xl leading-none" style={{ color: BRAND.teal }}>{highlightsData.avgAttendance?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="font-heading text-[10px] text-slate-400 uppercase mb-1 tracking-wider">Avg Serve Team</p>
                <span className="font-heading text-2xl text-white">{highlightsData.avgServe?.toLocaleString() || 0}</span>
              </div>
              <div className="text-right">
                <p className="font-heading text-[10px] text-slate-400 uppercase mb-1 tracking-wider">Avg Capacity</p>
                <span className="font-heading text-2xl" style={{ color: BRAND.green }}>{highlightsData.avgCap || 0}%</span>
              </div>
            </div>
          </div>
          <div className="h-px bg-white/10 w-full mb-6 mt-6" />
          <div className="grid grid-cols-2 gap-y-6">
            <div><p className="font-heading text-[10px] text-slate-400 uppercase">Baptisms (Total)</p><p className="font-heading text-xl text-white">{highlightsData.baptisms?.toLocaleString() || 0}</p></div>
            <div><p className="font-heading text-[10px] text-slate-400 uppercase">Next Steps (Total)</p><p className="font-heading text-xl text-white">{highlightsData.nextSteps?.toLocaleString() || 0}</p></div>
            <div><p className="font-heading text-[10px] text-slate-400 uppercase">Dedications (Total)</p><p className="font-heading text-xl text-white">{highlightsData.dedications?.toLocaleString() || 0}</p></div>
            <div><p className="font-heading text-[10px] text-slate-400 uppercase">Family Dinner</p><p className="font-heading text-xl text-white">{highlightsData.familyDinner?.toLocaleString() || 0}</p></div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-[10px] text-slate-400 italic font-heading uppercase tracking-widest">
              {highlightsData.isCurrent ? `metrics through ${formatShortDate(activeWeek?.date || '')}.` : `total year metrics for ${highlightsData.year}.`}
            </p>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden border-none shadow-lg">
        <div className="p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style={{ backgroundColor: BRAND.slate }}>
          <div>
            <h3 className="font-heading text-lg tracking-tight uppercase">Data Ledger</h3>
            <p className="font-heading text-[10px] text-slate-400 uppercase tracking-widest mt-1">Full Historical Audit</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex bg-black/20 p-1 rounded-full shadow-inner border border-white/5">
              {['30D', 'MTD', '6M', 'YTD', 'All', 'Custom'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setLedgerFilter(f)} 
                  className={`px-4 py-1.5 font-heading text-[10px] rounded-full transition-all ${ledgerFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            {ledgerFilter === 'Custom' && (
              <div className="flex items-center space-x-2 bg-black/20 border border-white/10 rounded-full px-3 py-1 shadow-sm">
                <input type="date" value={ledgerCustomStart} onChange={(e) => setLedgerCustomStart(e.target.value)} className="font-heading text-[10px] uppercase bg-transparent border-none focus:ring-0 text-slate-200 outline-none" style={{ colorScheme: 'dark' }} />
                <span className="font-heading text-slate-400 text-[10px]">to</span>
                <input type="date" value={ledgerCustomEnd} onChange={(e) => setLedgerCustomEnd(e.target.value)} className="font-heading text-[10px] uppercase bg-transparent border-none focus:ring-0 text-slate-200 outline-none" style={{ colorScheme: 'dark' }} />
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left bg-white">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-heading text-[10px] uppercase tracking-widest text-slate-400">
                <th className="p-6">Week Ending</th>
                <th className="p-6 text-right">Attendance</th>
                <th className="p-6 text-right">Rise Kids %</th>
                <th className="p-6 text-right">Serve Rate</th>
                <th className="p-6 text-right">Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...filteredLedgerData].reverse().map(w => {
                const ledgerAudBase = w.totals?.auditorium || w.totals?.overall || 1;
                return (
                  <React.Fragment key={w.date}>
                    <tr onClick={() => toggleRow(w.date)} className={`cursor-pointer hover:bg-slate-50 transition-colors ${w.date === selectedDate ? 'bg-blue-50/20' : ''}`}>
                      <td className="p-6 font-bold" style={{ color: BRAND.navy }}>{w.displayDate}</td>
                      <td className="p-6 text-right font-black" style={{ color: BRAND.slate }}>{(w.totals?.overall || 0).toLocaleString()}</td>
                      <td className="p-6 text-right font-bold" style={{ color: BRAND.teal }}>{(((w.totals?.kids || 0) / ledgerAudBase) * 100).toFixed(1)}%</td>
                      <td className="p-6 text-right font-bold" style={{ color: BRAND.green }}>{(((w.totals?.team || 0) / ledgerAudBase) * 100).toFixed(1)}%</td>
                      <td className="p-6 text-right font-bold" style={{ color: BRAND.red }}>{w.totals?.chairCount > 0 ? Math.round(((w.totals?.auditorium || 0) / w.totals.chairCount) * 100) : 0}%</td>
                    </tr>
                    {expandedRows.has(w.date) && (w.services || []).map((s, idx) => {
                      const sAudBase = s.auditorium || s.overall || 1;
                      return (
                        <tr key={idx} className="bg-slate-50/60 text-xs text-slate-500 italic">
                          <td className="p-4 pl-12 font-medium">{s.name}</td>
                          <td className="p-4 text-right font-bold">{(s.overall || 0).toLocaleString()}</td>
                          <td className="p-4 text-right font-medium">{(((s.kids || 0) / sAudBase) * 100).toFixed(1)}%</td>
                          <td className="p-4 text-right font-medium">{(((s.team || 0) / sAudBase) * 100).toFixed(1)}%</td>
                          <td className="p-4 text-right font-medium">{s.chairCount > 0 ? Math.round(((s.auditorium || 0) / s.chairCount) * 100) + '%' : '-'}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
