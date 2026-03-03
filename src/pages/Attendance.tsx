import React, { useState, useMemo } from 'react';
import { WeeklyData } from "@/hooks/useChurchData";
import { Users, Baby, TrendingUp, Calendar, AlertTriangle, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, AreaChart, Area } from 'recharts';
import { BRAND } from "@/constants";

const Card = ({ children, className = '', style = {} }: any) => (
  <div className={`bg-white rounded-3xl shadow-sm border border-slate-100/50 ${className}`} style={{ ...style, borderColor: '#E2E8F0' }}>
    {children}
  </div>
);

const calculateTrend = (current: number, previous: number) => {
  if (!previous || previous === 0) return { value: 0, isPositive: true };
  const diff = current - previous;
  const percent = (diff / previous) * 100;
  return {
    value: Math.abs(Math.round(percent)),
    isPositive: percent >= 0
  };
};

const KPICard = ({ title, value, icon: Icon, color, prevValue, lastYearValue, lastYearDate, suffix = '' }: any) => {
  const prevTrend = calculateTrend(value, prevValue);
  const yearTrend = calculateTrend(value, lastYearValue);

  return (
    <Card className="p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500" style={{ backgroundColor: color }} />
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="font-heading text-[10px] text-slate-400 uppercase tracking-widest">{title}</p>
          <h3 className="font-heading text-4xl tracking-tight mt-1" style={{ color: BRAND.navy }}>{value.toLocaleString()}{suffix}</h3>
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>

      <div className="space-y-3">
        {prevValue !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${prevTrend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {prevTrend.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {prevTrend.value}%
              </span>
              <span className="text-slate-400 text-xs">vs last week</span>
            </div>
            <span className="font-heading text-slate-700 text-xs">{prevValue.toLocaleString()}{suffix}</span>
          </div>
        )}
        
        {lastYearValue !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${yearTrend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {yearTrend.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {yearTrend.value}%
              </span>
              <div className="flex flex-col">
                <span className="text-slate-400 text-xs">vs last year</span>
                <span className="text-slate-300 text-[9px]">{lastYearDate}</span>
              </div>
            </div>
            <span className="font-heading text-slate-700 text-xs">{lastYearValue.toLocaleString()}{suffix}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

interface AttendanceProps {
  rawData: WeeklyData[];
  activeWeek: WeeklyData | null;
  setSelectedDate: (date: string) => void;
}

export function Attendance({ rawData, activeWeek, setSelectedDate }: AttendanceProps) {
  const [trendFilter, setTrendFilter] = useState('6M');
  const [trendCustomStart, setTrendCustomStart] = useState('');
  const [trendCustomEnd, setTrendCustomEnd] = useState('');

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  const filteredTrendData = useMemo(() => {
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
    return fTrend.map(d => ({
      originalDate: d.date,
      name: formatShortDate(d.date),
      overall: d.totals.overall,
      auditorium: d.totals.auditorium || d.totals.overall,
      kids: d.totals.kids
    }));
  }, [rawData, trendFilter, trendCustomStart, trendCustomEnd]);

  const { kidsProjection, kidsSlope } = useMemo(() => {
    const last26 = rawData.slice(-26);
    const n = last26.length;
    if (n < 4) return { kidsProjection: [], kidsSlope: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const forecastData = [];
    
    last26.forEach((w, i) => { 
      const yVal = w.totals.kids || 0;
      sumX += i; sumY += yVal; sumXY += i * yVal; sumX2 += i * i; 
      forecastData.push({
        originalDate: w.date,
        name: formatShortDate(w.date),
        Actual: yVal,
        Projected: i === n - 1 ? yVal : null,
      });
    });
    
    const denominator = (n * sumX2 - sumX * sumX);
    const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    const lastDate = new Date(last26[n-1].date);
    
    for (let i = 1; i <= 12; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + (i * 7));
      const forecastDateStr = `${forecastDate.getFullYear()}-${(forecastDate.getMonth() + 1).toString().padStart(2, '0')}-${forecastDate.getDate().toString().padStart(2, '0')}`;
      forecastData.push({
        originalDate: forecastDateStr,
        name: forecastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
        Actual: null,
        Projected: Math.max(0, Math.round(slope * (n + i) + intercept)),
      });
    }

    return { kidsProjection: forecastData, kidsSlope: slope };
  }, [rawData]);

  if (!activeWeek) return null;

  const getPreviousWeek = (currentDate: string) => {
    const currentIndex = rawData.findIndex(d => d.date === currentDate);
    if (currentIndex > 0) return rawData[currentIndex - 1];
    return null;
  };

  const getLastYearWeek = (currentDate: string) => {
    const [year, month, day] = currentDate.split('-');
    const lastYearDate = `${parseInt(year) - 1}-${month}-${day}`;
    
    const exactMatch = rawData.find(d => d.date === lastYearDate);
    if (exactMatch) return exactMatch;

    const targetTime = new Date(parseInt(year) - 1, parseInt(month) - 1, parseInt(day)).getTime();
    let closest = null;
    let minDiff = Infinity;

    for (const d of rawData) {
      const [y, m, dDay] = d.date.split('-');
      if (parseInt(y) === parseInt(year) - 1) {
        const diff = Math.abs(new Date(parseInt(y), parseInt(m) - 1, parseInt(dDay)).getTime() - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = d;
        }
      }
    }
    return closest;
  };

  const prevWeek = getPreviousWeek(activeWeek.date);
  const lastYearWeek = getLastYearWeek(activeWeek.date);
  
  const formatShortDateYear = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const kidsRatio = Math.round((activeWeek.totals.kids / (activeWeek.totals.auditorium || activeWeek.totals.overall || 1)) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center space-x-3 mb-2">
        <Baby className="w-6 h-6" style={{ color: BRAND.teal }} />
        <div>
          <h2 className="font-heading text-2xl text-slate-900 tracking-tight">Attendance & Demographics</h2>
          <p className="font-heading text-[10px] text-slate-400 uppercase tracking-widest mt-1">Deep dive into adult and kids metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          title="Total Attendance" 
          value={activeWeek.totals.overall} 
          icon={Users} 
          color={BRAND.navy} 
          prevValue={prevWeek?.totals.overall} 
          lastYearValue={lastYearWeek?.totals.overall} 
          lastYearDate={lastYearWeek ? formatShortDateYear(lastYearWeek.date) : ''} 
        />
        <KPICard 
          title="Rise Kids" 
          value={activeWeek.totals.kids} 
          icon={Baby} 
          color={BRAND.teal} 
          prevValue={prevWeek?.totals.kids} 
          lastYearValue={lastYearWeek?.totals.kids} 
          lastYearDate={lastYearWeek ? formatShortDateYear(lastYearWeek.date) : ''} 
        />
        <KPICard 
          title="Kids Ratio" 
          value={kidsRatio} 
          icon={TrendingUp} 
          color={BRAND.green} 
          prevValue={prevWeek ? Math.round((prevWeek.totals.kids / (prevWeek.totals.auditorium || prevWeek.totals.overall || 1)) * 100) : undefined} 
          lastYearValue={lastYearWeek ? Math.round((lastYearWeek.totals.kids / (lastYearWeek.totals.auditorium || lastYearWeek.totals.overall || 1)) * 100) : undefined} 
          lastYearDate={lastYearWeek ? formatShortDateYear(lastYearWeek.date) : ''} 
          suffix="%"
        />
      </div>

      <Card className="p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h3 className="font-heading text-sm uppercase tracking-widest text-slate-400">Attendance Trends</h3>
            <p className="text-[10px] font-bold mt-1 uppercase tracking-widest" style={{ color: BRAND.teal }}>Auditorium vs Kids</p>
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
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={filteredTrendData}
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
              <Line type="monotone" dataKey="overall" stroke={BRAND.navy} strokeWidth={4} dot={false} activeDot={{r: 6, strokeWidth: 0, cursor: 'pointer', onClick: (_: any, p: any) => p?.payload?.originalDate && setSelectedDate(p.payload.originalDate)}} name="Overall" />
              <Line type="monotone" dataKey="kids" stroke={BRAND.teal} strokeWidth={4} dot={false} activeDot={{r: 6, strokeWidth: 0, cursor: 'pointer', onClick: (_: any, p: any) => p?.payload?.originalDate && setSelectedDate(p.payload.originalDate)}} name="Rise Kids" />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontFamily: 'Gotham Bold, sans-serif', fontSize: '12px' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8">
          <div className="mb-8">
            <h3 className="font-heading text-sm uppercase tracking-widest text-slate-400">Service Breakdown</h3>
            <p className="text-[10px] font-bold mt-1 uppercase tracking-widest" style={{ color: BRAND.navy }}>Current Week Distribution</p>
          </div>
          <div className="h-[300px]">
            {activeWeek.services && activeWeek.services.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={activeWeek.services}
                  className="focus:outline-none"
                  style={{ outline: 'none' }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} />
                  <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{ borderRadius: '1rem', border: 'none', fontFamily: 'Proxima Nova, sans-serif' }} />
                  <Bar dataKey="auditorium" fill={BRAND.navy} radius={[4, 4, 0, 0]} name="Auditorium" maxBarSize={50} />
                  <Bar dataKey="kids" fill={BRAND.teal} radius={[4, 4, 0, 0]} name="Rise Kids" maxBarSize={50} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontFamily: 'Gotham Bold, sans-serif', fontSize: '12px' }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-heading text-xs uppercase tracking-widest">
                No service breakdown data available for this week.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-8">
          <div className="mb-8">
            <h3 className="font-heading text-sm uppercase tracking-widest text-slate-400">Rise Kids 12-Week Projection</h3>
            <p className="text-[10px] font-bold mt-1 uppercase tracking-widest" style={{ color: BRAND.teal }}>Short-term classroom planning</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={kidsProjection}
                onClick={(e: any) => {
                  if (e?.activePayload?.[0]?.payload?.originalDate && e.activePayload[0].payload.Actual !== null) {
                    setSelectedDate(e.activePayload[0].payload.originalDate);
                  }
                }}
                className="focus:outline-none"
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                <defs>
                  <linearGradient id="colorKidsAct" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BRAND.slate} stopOpacity={0.3}/><stop offset="95%" stopColor={BRAND.slate} stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorKidsProj" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BRAND.teal} stopOpacity={0.3}/><stop offset="95%" stopColor={BRAND.teal} stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} minTickGap={20} tick={{fill: '#94A3B8', fontSize: 10, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontFamily: 'Proxima Nova, sans-serif' }} />
                <Area type="monotone" dataKey="Actual" stroke={BRAND.slate} strokeWidth={2} fillOpacity={1} fill="url(#colorKidsAct)" activeDot={{r: 6, strokeWidth: 0, cursor: 'pointer', onClick: (_: any, p: any) => p?.payload?.originalDate && setSelectedDate(p.payload.originalDate)}} />
                <Area type="monotone" dataKey="Projected" stroke={BRAND.teal} strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorKidsProj)" activeDot={{r: 6, strokeWidth: 0, cursor: 'pointer', onClick: (_: any, p: any) => p?.payload?.originalDate && p.payload.Actual !== null && setSelectedDate(p.payload.originalDate)}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6 border-l-8" style={{ borderLeftColor: kidsSlope > 1 ? BRAND.red : BRAND.teal, backgroundColor: kidsSlope > 1 ? '#FEF2F2' : '#F0FDF4' }}>
        <div className="flex items-start space-x-4">
          <AlertTriangle className="w-6 h-6 mt-0.5" style={{ color: kidsSlope > 1 ? BRAND.red : BRAND.teal }} />
          <div>
            <h4 className="font-heading text-sm uppercase tracking-widest" style={{ color: BRAND.navy }}>Classroom Capacity Insight</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {kidsSlope > 1 
                ? `Rise Kids is experiencing rapid growth (averaging +${kidsSlope.toFixed(1)} kids/week). Ensure volunteer recruitment and classroom space are scaling proportionally to maintain safety ratios.` 
                : `Rise Kids attendance is currently stable. This is an ideal time to focus on volunteer training and curriculum development without the pressure of rapid scaling.`}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
