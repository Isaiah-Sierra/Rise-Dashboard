import React, { useState, useMemo } from 'react';
import { WeeklyData } from "@/hooks/useChurchData";
import { Users, TrendingUp, Activity, AlertCircle, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend, BarChart, Bar, ComposedChart } from 'recharts';
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

const SERVICE_COLORS = [BRAND.green, BRAND.teal, '#84cc16', '#14b8a6', BRAND.navy, BRAND.slate];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
        <p className="font-heading font-bold text-slate-900 mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm text-slate-600 flex justify-between gap-4">
            <span>Attendance:</span>
            <span className="font-bold" style={{ color: BRAND.navy }}>{data.overall}</span>
          </p>
          <p className="text-sm text-slate-600 flex justify-between gap-4">
            <span>Total Serve Team:</span>
            <span className="font-bold" style={{ color: BRAND.green }}>{data.team}</span>
          </p>
          <p className="text-sm text-slate-600 flex justify-between gap-4 pb-2 border-b border-slate-100">
            <span>Serve Ratio:</span>
            <span className="font-bold" style={{ color: BRAND.teal }}>{data.ratio}%</span>
          </p>
          {payload.filter((p: any) => p.dataKey !== 'overall' && p.dataKey !== 'team' && p.dataKey !== 'ratio').length > 0 && (
            <div className="pt-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">By Service</p>
              {payload.filter((p: any) => p.dataKey !== 'overall' && p.dataKey !== 'team' && p.dataKey !== 'ratio').map((p: any, i: number) => (
                <p key={i} className="text-xs text-slate-500 flex justify-between gap-4">
                  <span>{p.name}:</span>
                  <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

interface ServeTeamsProps {
  rawData: WeeklyData[];
  activeWeek: WeeklyData | null;
  healthRatios: any;
  setSelectedDate: (date: string) => void;
}

export function ServeTeams({ rawData, activeWeek, healthRatios, setSelectedDate }: ServeTeamsProps) {
  const [trendFilter, setTrendFilter] = useState('6M');
  const [trendCustomStart, setTrendCustomStart] = useState('');
  const [trendCustomEnd, setTrendCustomEnd] = useState('');

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  const { chartData, serviceNames } = useMemo(() => {
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
    
    const sNames = new Set<string>();
    const mappedData = fTrend.map(d => {
      const dataPoint: any = {
        originalDate: d.date,
        name: formatShortDate(d.date),
        team: d.totals.team,
        overall: d.totals.overall,
        ratio: d.totals.overall > 0 ? Math.round((d.totals.team / d.totals.overall) * 100) : 0
      };
      
      if (d.services) {
        d.services.forEach(s => {
          sNames.add(s.name);
          dataPoint[s.name] = s.team;
        });
      }
      
      return dataPoint;
    });
    
    return { chartData: mappedData, serviceNames: Array.from(sNames) };
  }, [rawData, trendFilter, trendCustomStart, trendCustomEnd]);

  const avgServeTeam = useMemo(() => {
    const last12 = rawData.slice(-12);
    return last12.length > 0 ? Math.round(last12.reduce((sum, d) => sum + d.totals.team, 0) / last12.length) : 0;
  }, [rawData]);

  const { teamProjection, teamSlope } = useMemo(() => {
    const last26 = rawData.slice(-26);
    const n = last26.length;
    if (n < 4) return { teamProjection: [], teamSlope: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const forecastData = [];
    
    last26.forEach((w, i) => { 
      const yVal = w.totals.team || 0;
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

    return { teamProjection: forecastData, teamSlope: slope };
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

  const getAvgServeTeam = (endDate: string) => {
    const endIndex = rawData.findIndex(d => d.date === endDate);
    if (endIndex === -1) return 0;
    const last12 = rawData.slice(Math.max(0, endIndex - 11), endIndex + 1);
    return last12.length > 0 ? Math.round(last12.reduce((sum, d) => sum + d.totals.team, 0) / last12.length) : 0;
  };

  const prevAvgServeTeam = prevWeek ? getAvgServeTeam(prevWeek.date) : undefined;
  const lastYearAvgServeTeam = lastYearWeek ? getAvgServeTeam(lastYearWeek.date) : undefined;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center space-x-3 mb-2">
        <Users className="w-6 h-6" style={{ color: BRAND.green }} />
        <div>
          <h2 className="font-heading text-2xl text-slate-900 tracking-tight">Serve Teams Analysis</h2>
          <p className="font-heading text-[10px] text-slate-400 uppercase tracking-widest mt-1">Deep dive into volunteer engagement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          title="Total Volunteers" 
          value={activeWeek.totals.team} 
          icon={Users} 
          color={BRAND.green} 
          prevValue={prevWeek?.totals.team} 
          lastYearValue={lastYearWeek?.totals.team} 
          lastYearDate={lastYearWeek ? formatShortDateYear(lastYearWeek.date) : ''} 
        />
        <KPICard 
          title="Serve Ratio" 
          value={healthRatios.serve} 
          icon={Activity} 
          color={BRAND.teal} 
          prevValue={prevWeek ? Math.round((prevWeek.totals.team / (prevWeek.totals.overall || 1)) * 100) : undefined} 
          lastYearValue={lastYearWeek ? Math.round((lastYearWeek.totals.team / (lastYearWeek.totals.overall || 1)) * 100) : undefined} 
          lastYearDate={lastYearWeek ? formatShortDateYear(lastYearWeek.date) : ''} 
          suffix="%"
        />
        <KPICard 
          title="12-Week Average" 
          value={avgServeTeam} 
          icon={TrendingUp} 
          color={BRAND.navy} 
          prevValue={prevAvgServeTeam} 
          lastYearValue={lastYearAvgServeTeam} 
          lastYearDate={lastYearWeek ? formatShortDateYear(lastYearWeek.date) : ''} 
        />
      </div>

      <Card className="p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h3 className="font-heading text-sm uppercase tracking-widest text-slate-400">Team vs Attendance</h3>
            <p className="text-[10px] font-bold mt-1 uppercase tracking-widest" style={{ color: BRAND.green }}>Engagement Correlation</p>
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
            <ComposedChart 
              data={chartData}
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
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} />
              <YAxis yAxisId="ratio" hide domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: '#F8FAFC'}} />
              
              {serviceNames.length > 0 ? (
                <>
                  {serviceNames.map((name, index) => (
                    <Bar key={name} yAxisId="left" dataKey={name} stackId="team" fill={SERVICE_COLORS[index % SERVICE_COLORS.length]} name={name} maxBarSize={40} legendType="none" onClick={(data: any) => data?.payload?.originalDate && setSelectedDate(data.payload.originalDate)} cursor="pointer" />
                  ))}
                  <Bar yAxisId="left" dataKey="dummy_team_for_legend" fill={BRAND.green} name="Serve Team" legendType="circle" />
                </>
              ) : (
                <Bar yAxisId="left" dataKey="team" fill={BRAND.green} radius={[4, 4, 0, 0]} name="Serve Team" maxBarSize={40} legendType="circle" onClick={(data: any) => data?.payload?.originalDate && setSelectedDate(data.payload.originalDate)} cursor="pointer" />
              )}
              
              <Line yAxisId="right" type="monotone" dataKey="overall" stroke={BRAND.navy} strokeWidth={3} dot={false} activeDot={{r: 6, strokeWidth: 0, cursor: 'pointer', onClick: (_: any, p: any) => p?.payload?.originalDate && setSelectedDate(p.payload.originalDate)}} name="Attendance" legendType="circle" />
              <Line yAxisId="ratio" type="monotone" dataKey="ratio" stroke={BRAND.teal} strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={{r: 6, strokeWidth: 0, cursor: 'pointer', onClick: (_: any, p: any) => p?.payload?.originalDate && setSelectedDate(p.payload.originalDate)}} name="Serve Ratio %" legendType="circle" />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle" 
                wrapperStyle={{ fontFamily: 'Gotham Bold, sans-serif', fontSize: '12px' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8">
          <div className="mb-8">
            <h3 className="font-heading text-sm uppercase tracking-widest text-slate-400">Serve Ratio Trend</h3>
            <p className="text-[10px] font-bold mt-1 uppercase tracking-widest" style={{ color: BRAND.teal }}>% of Adults Serving</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData}
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
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} domain={[0, 'auto']} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontFamily: 'Proxima Nova, sans-serif' }} />
                <Line type="monotone" dataKey="ratio" stroke={BRAND.teal} strokeWidth={4} dot={false} activeDot={{r: 6, strokeWidth: 0, cursor: 'pointer', onClick: (_: any, p: any) => p?.payload?.originalDate && setSelectedDate(p.payload.originalDate)}} name="Serve Ratio %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8">
          <div className="mb-8">
            <h3 className="font-heading text-sm uppercase tracking-widest text-slate-400">Serve Team 12-Week Projection</h3>
            <p className="text-[10px] font-bold mt-1 uppercase tracking-widest" style={{ color: BRAND.green }}>Short-term volunteer planning</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={teamProjection}
                onClick={(e: any) => {
                  if (e?.activePayload?.[0]?.payload?.originalDate && e.activePayload[0].payload.Actual !== null) {
                    setSelectedDate(e.activePayload[0].payload.originalDate);
                  }
                }}
                className="focus:outline-none"
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                <defs>
                  <linearGradient id="colorTeamAct" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BRAND.slate} stopOpacity={0.3}/><stop offset="95%" stopColor={BRAND.slate} stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorTeamProj" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BRAND.green} stopOpacity={0.3}/><stop offset="95%" stopColor={BRAND.green} stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} minTickGap={20} tick={{fill: '#94A3B8', fontSize: 10, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontFamily: 'Proxima Nova, sans-serif' }} />
                <Area type="monotone" dataKey="Actual" stroke={BRAND.slate} strokeWidth={2} fillOpacity={1} fill="url(#colorTeamAct)" activeDot={{r: 6, strokeWidth: 0, cursor: 'pointer', onClick: (_: any, p: any) => p?.payload?.originalDate && setSelectedDate(p.payload.originalDate)}} />
                <Area type="monotone" dataKey="Projected" stroke={BRAND.green} strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorTeamProj)" activeDot={{r: 6, strokeWidth: 0, cursor: 'pointer', onClick: (_: any, p: any) => p?.payload?.originalDate && p.payload.Actual !== null && setSelectedDate(p.payload.originalDate)}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6 border-l-8" style={{ borderLeftColor: Number(healthRatios.serve) < 35 ? BRAND.red : BRAND.teal, backgroundColor: Number(healthRatios.serve) < 35 ? '#FEF2F2' : '#F0FDF4' }}>
        <div className="flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 mt-0.5" style={{ color: Number(healthRatios.serve) < 35 ? BRAND.red : BRAND.teal }} />
          <div>
            <h4 className="font-heading text-sm uppercase tracking-widest" style={{ color: BRAND.navy }}>Volunteer Health Insight</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              A healthy church typically sees 40-50% of its adult attendance engaged in serving. 
              {Number(healthRatios.serve) < 35 
                ? ` Your current ratio is ${healthRatios.serve}%, which places current volunteers at high risk of burnout. Focus heavily on next steps and recruitment.` 
                : ` Your current ratio of ${healthRatios.serve}% indicates a healthy, engaged core team capable of sustaining current growth.`}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
