import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, AreaChart, Area, ReferenceLine, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Target, Rocket, AlertTriangle, Info, Clock, DollarSign, Activity, Users, TrendingUp
} from 'lucide-react';
import { WeeklyData } from "@/hooks/useChurchData";
import { BRAND } from "@/constants";

const Card = ({ children, className = '', style = {} }: any) => (
  <div className={`bg-white rounded-3xl shadow-sm border border-slate-100/50 ${className}`} style={{ ...style, borderColor: '#E2E8F0' }}>
    {children}
  </div>
);

interface ProjectionsProps {
  rawData: WeeklyData[];
  activeWeek: WeeklyData | null;
  setSelectedDate: (date: string) => void;
}

export function Projections({ rawData, activeWeek, setSelectedDate }: ProjectionsProps) {
  const [projectionMetric, setProjectionMetric] = useState('overall');
  const [projectionTimeframe, setProjectionTimeframe] = useState('6M'); 
  const [forecastHorizon, setForecastHorizon] = useState('1Y'); 

  const metricLabels: Record<string, string> = { 
    overall: "Attendance", 
    kids: "Rise Kids", 
    team: "Serve Team", 
    guests: "Weekly Guests" 
  };

  const { 
    monthsTo80, 
    projectionData,
    currentMetricAvg,
    metricSlope,
    twelveMonthTarget,
    fiveYearTarget,
    seasonalTrendsData,
  } = useMemo(() => {
    if (rawData.length === 0 || !activeWeek) return { 
      monthsTo80: 0, 
      projectionData: [], currentMetricAvg: 0, metricSlope: 0, twelveMonthTarget: 0, fiveYearTarget: 0,
      seasonalTrendsData: []
    };

    // 6. Helper for specific metric
    const getMetricVal = (w: WeeklyData) => {
      if (projectionMetric === 'kids') return w.totals?.kids || 0;
      if (projectionMetric === 'team') return w.totals?.team || 0;
      if (projectionMetric === 'guests') return (w.totals?.newGuests || 0) + (w.totals?.secondTimeGuests || 0);
      return w.totals?.overall || 0;
    };

    // 7. Seasonal Intelligence
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sTrends = months.map((m, mIdx) => {
      const matches = rawData.filter(d => new Date(d.date).getMonth() === mIdx);
      const val = matches.length > 0 ? Math.round(matches.reduce((sum, w) => sum + getMetricVal(w), 0) / matches.length) : 0;
      return { name: m, Value: val };
    });

    // 8. Projection & Forecasting Logic
    const historicalLookback = projectionTimeframe === '6M' ? 26 : 52;
    const projectionWeeks = rawData.slice(-historicalLookback);
    
    let forecast = [];
    let mTo80: number | string = 0;
    let cMetricAvg = 0;
    let computedSlope = 0;
    let target12Mo = 0;
    let target5Yr = 0;

    // Calculate avg attendance for the year to use in 80% calculation
    const currentActiveYear = activeWeek.date.split('-')[0];
    const hWeeks = rawData.filter(d => d.date.startsWith(currentActiveYear) && d.date <= activeWeek.date);
    const avgAttendance = hWeeks.length > 0 ? Math.round(hWeeks.reduce((sum, w) => sum + (w.totals?.overall || 0), 0) / hWeeks.length) : 0;

    if (projectionWeeks.length >= 4) {
      const n = projectionWeeks.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      
      projectionWeeks.forEach((w, i) => { 
        let yVal = getMetricVal(w);
        sumX += i; sumY += yVal; sumXY += i * yVal; sumX2 += i * i; 
        
        const [y, m, d] = w.date.split('-');
        const dObj = new Date(Number(y), Number(m)-1, Number(d));
        forecast.push({
          originalDate: w.date,
          name: dObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          Actual: yVal,
          Projected: i === n - 1 ? yVal : null,
          Target80: projectionMetric === 'overall' ? Math.round((activeWeek.totals?.chairCount || 0) * 0.8) : null
        });
      });
      
      cMetricAvg = Math.round(sumY / n);
      const denominator = (n * sumX2 - sumX * sumX);
      const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
      computedSlope = slope;
      const intercept = (sumY - slope * sumX) / n;
      const lastDate = new Date(projectionWeeks[n-1].date);
      
      const forecastWeeks = forecastHorizon === '5Y' ? 260 : 52;

      for (let i = 1; i <= forecastWeeks; i++) {
        const forecastDate = new Date(lastDate);
        forecastDate.setDate(lastDate.getDate() + (i * 7));
        const projectedVal = Math.max(0, Math.round(slope * (n + i) + intercept));
        
        const forecastDateStr = `${forecastDate.getFullYear()}-${(forecastDate.getMonth() + 1).toString().padStart(2, '0')}-${forecastDate.getDate().toString().padStart(2, '0')}`;
        forecast.push({
          originalDate: forecastDateStr,
          name: forecastDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          Actual: null,
          Projected: projectedVal,
          Target80: projectionMetric === 'overall' ? Math.round((activeWeek.totals?.chairCount || 0) * 0.8) : null
        });
      }

      target12Mo = Math.max(0, Math.round(slope * (n + 52) + intercept));
      target5Yr = Math.max(0, Math.round(slope * (n + 260) + intercept));
      
      const target80 = (activeWeek?.totals?.chairCount || 0) * 0.8;
      if (target80 > 0 && avgAttendance < target80) {
        let ovrSumY = 0, ovrSumXY = 0;
        projectionWeeks.forEach((w, i) => { 
          ovrSumY += w.totals?.overall || 0; 
          ovrSumXY += i * (w.totals?.overall || 0); 
        });
        const ovrSlope = denominator === 0 ? 0 : (n * ovrSumXY - sumX * ovrSumY) / denominator;
        if (ovrSlope > 0) {
          mTo80 = Math.max(1, Math.round(((target80 - avgAttendance) / ovrSlope) / 4.3));
        } else {
          mTo80 = ">60"; 
        }
      } else if (avgAttendance >= target80) {
        mTo80 = 0;
      }
    }

    return { 
      monthsTo80: mTo80, 
      projectionData: forecast, currentMetricAvg: cMetricAvg, metricSlope: computedSlope,
      twelveMonthTarget: target12Mo, fiveYearTarget: target5Yr,
      seasonalTrendsData: sTrends
    };
  }, [
    rawData, projectionMetric, projectionTimeframe, forecastHorizon, activeWeek
  ]);

  if (!activeWeek) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Box 1: Focus Selector & Timeframe */}
      <Card className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center text-white border-none shadow-lg gap-4" style={{ backgroundColor: BRAND.navy }}>
        <div className="flex items-center space-x-3">
          <Target className="w-6 h-6" style={{ color: BRAND.teal }} />
          <div>
            <h2 className="font-heading text-xl uppercase tracking-tight text-white">Strategic Intelligence</h2>
            <p className="font-heading text-[10px] text-slate-300 mt-1 uppercase tracking-widest">Model future growth trends</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex bg-white/10 p-1 rounded-full shadow-inner w-full sm:w-auto justify-center">
            {['6M', '12M'].map(t => (
              <button 
                key={t} 
                onClick={() => setProjectionTimeframe(t)} 
                className={`px-5 py-2 font-heading text-[10px] uppercase rounded-full transition-all flex-1 sm:flex-none ${projectionTimeframe === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'}`}
              >
                {t === '6M' ? 'Last 6 Months' : 'Last 12 Months'}
              </button>
            ))}
          </div>
          
          <div className="hidden sm:block w-px h-6 bg-white/10" />
          
          <div className="flex flex-wrap bg-white/10 p-1 rounded-full shadow-inner w-full sm:w-auto justify-center">
            {Object.keys(metricLabels).map(m => (
              <button 
                key={m} 
                onClick={() => setProjectionMetric(m)} 
                className={`px-5 py-2 font-heading text-[10px] uppercase rounded-full transition-all flex-1 sm:flex-none ${projectionMetric === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'}`}
              >
                {metricLabels[m]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Box 2: Projections & Current Average */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 flex flex-col justify-between border-t-4" style={{ borderTopColor: BRAND.slate }}>
          <h3 className="font-heading text-[10px] text-slate-400 uppercase mb-4 tracking-widest flex items-center">
            <Activity className="w-4 h-4 mr-2" /> 
            {projectionTimeframe === '6M' ? '6-Month Avg' : '12-Month Avg'}
          </h3>
          <span className="font-heading text-4xl" style={{ color: BRAND.navy }}>{(currentMetricAvg || 0).toLocaleString()}</span>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            Based on trailing {projectionTimeframe === '6M' ? '6' : '12'} months.
          </p>
        </Card>

        <Card className="p-6 flex flex-col justify-between border-t-4" style={{ borderTopColor: BRAND.teal }}>
          <h3 className="font-heading text-[10px] text-slate-400 uppercase mb-4 tracking-widest flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" /> 12 Month Target
          </h3>
          <span className="font-heading text-4xl" style={{ color: BRAND.navy }}>{(twelveMonthTarget || 0).toLocaleString()}</span>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Expected 1-Year {metricLabels[projectionMetric]}.</p>
        </Card>

        <Card className="p-6 flex flex-col justify-between border-t-4" style={{ borderTopColor: BRAND.navy }}>
          <h3 className="font-heading text-[10px] text-slate-400 uppercase mb-4 tracking-widest flex items-center">
            <Rocket className="w-4 h-4 mr-2" /> 5 Year Target
          </h3>
          <span className="font-heading text-4xl" style={{ color: BRAND.navy }}>{(fiveYearTarget || 0).toLocaleString()}</span>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Long-term compound projection.</p>
        </Card>

        <Card className={`p-6 flex flex-col justify-between border-t-4 ${metricSlope < -0.1 ? 'border-t-red-500 bg-red-50/30' : metricSlope > 0.1 ? 'border-t-teal-500 bg-teal-50/30' : 'border-t-slate-400 bg-slate-50'}`}>
          <h3 className="font-heading text-[10px] text-slate-500 uppercase mb-4 tracking-widest flex items-center">
            <Info className="w-4 h-4 mr-2" /> Trend Status
          </h3>
          <span className="font-heading text-xl uppercase tracking-tight" style={{ color: metricSlope < -0.1 ? BRAND.red : metricSlope > 0.1 ? BRAND.teal : BRAND.slate }}>
            {metricSlope < -0.1 ? 'Declining' : metricSlope > 0.1 ? 'Growing' : 'Flat / Stable'}
          </span>
          <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
            {metricSlope < -0.1 ? `Trajectory is downward.` : metricSlope > 0.1 ? `Healthy upward trajectory.` : `Metric is currently plateaued.`}
          </p>
        </Card>
      </div>

      {/* Box 3: Historical + Predictive Area Chart */}
      <Card className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h3 className="font-heading text-lg uppercase tracking-tight" style={{ color: BRAND.navy }}>Predictive Analytics Curve</h3>
            <p className="font-heading text-xs text-slate-400 uppercase tracking-widest mt-2">Targeting: {metricLabels[projectionMetric]}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Chart Horizon Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-full shadow-inner border border-slate-200">
              {['1Y', '5Y'].map(h => (
                <button 
                  key={h} 
                  onClick={() => setForecastHorizon(h)} 
                  className={`px-4 py-2 font-heading text-[10px] uppercase rounded-full transition-all ${forecastHorizon === h ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {h === '1Y' ? '1-Year View' : '5-Year View'}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND.slate, opacity: 0.4 }} /><span className="font-heading text-[10px] uppercase text-slate-400">Historical</span></div>
              <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND.teal }} /><span className="font-heading text-[10px] uppercase text-slate-400">Forecast</span></div>
              {projectionMetric === 'overall' && <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND.red }} /><span className="font-heading text-[10px] uppercase text-slate-400">80% Cap Trigger</span></div>}
            </div>
          </div>
        </div>
        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={projectionData}
              onClick={(e: any) => {
                if (e?.activePayload?.[0]?.payload?.originalDate && e.activePayload[0].payload.Actual !== null) {
                  setSelectedDate(e.activePayload[0].payload.originalDate);
                }
              }}
              className="focus:outline-none"
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BRAND.slate} stopOpacity={0.3}/><stop offset="95%" stopColor={BRAND.slate} stopOpacity={0}/></linearGradient>
                <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BRAND.teal} stopOpacity={0.3}/><stop offset="95%" stopColor={BRAND.teal} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} minTickGap={30} tick={{fill: '#94A3B8', fontSize: 11, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} />
              <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontFamily: 'Proxima Nova, sans-serif' }} />
              <Area type="monotone" dataKey="Actual" stroke={BRAND.slate} strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" activeDot={{r: 6, strokeWidth: 0, cursor: 'pointer', onClick: (_: any, p: any) => p?.payload?.originalDate && setSelectedDate(p.payload.originalDate)}} />
              <Area type="monotone" dataKey="Projected" stroke={BRAND.teal} strokeWidth={4} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorProj)" activeDot={{r: 6, strokeWidth: 0, cursor: 'pointer', onClick: (_: any, p: any) => p?.payload?.originalDate && p.payload.Actual !== null && setSelectedDate(p.payload.originalDate)}} />
              {projectionMetric === 'overall' && (
                <ReferenceLine y={Math.round((activeWeek?.totals?.chairCount || 0) * 0.8)} stroke={BRAND.red} strokeDasharray="5 5" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Box 4: Seasonal Analysis & Constraints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <Card className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-heading text-sm uppercase tracking-widest" style={{ color: BRAND.navy }}>Seasonal Intelligence</h3>
              <p className="font-heading text-xs text-slate-400 uppercase tracking-widest mt-1">Monthly Cycles: {metricLabels[projectionMetric]}</p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={seasonalTrendsData}
                className="focus:outline-none"
                style={{ outline: 'none' }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontFamily: 'Proxima Nova, sans-serif', fontWeight: 700}} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} cursor={{fill: '#F8FAFC'}} />
                <Bar dataKey="Value" fill={BRAND.teal} radius={[6, 6, 0, 0]} maxBarSize={40} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Box 5: Expansion Summary & Realities */}
        <div className="space-y-6 flex flex-col justify-between">
          <Card className={`p-8 border-l-8 ${monthsTo80 > 0 && monthsTo80 < 12 ? 'border-l-red-500' : 'border-l-teal-500'}`}>
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 rounded-2xl bg-slate-50"><AlertTriangle className="w-8 h-8" style={{ color: BRAND.slate }} /></div>
              <div>
                <p className="font-heading text-[10px] text-slate-400 uppercase tracking-widest mb-1">Facility Expansion Trigger</p>
                <h2 className="font-heading text-3xl tracking-tight" style={{ color: BRAND.navy }}>
                  {monthsTo80 === 0 ? "Past 80%" : typeof monthsTo80 === 'string' ? "Stable" : `~${monthsTo80} Months Left`}
                </h2>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Statistical data shows that once a room reaches <strong className="italic" style={{ color: BRAND.navy }}>80% of capacity</strong>, guests begin to feel overcrowded, directly correlating to a plateau in growth.
            </p>
            <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-heading text-[10px] text-slate-500 uppercase tracking-widest">Current 80% Threshold</span>
              <span className="font-heading text-sm" style={{ color: BRAND.navy }}>{Math.round((activeWeek?.totals?.chairCount || 0) * 0.8).toLocaleString()} Adults</span>
            </div>
          </Card>

          <Card className="p-8 flex-1 border-none shadow-md shadow-slate-100/50">
            <h3 className="font-heading text-sm uppercase tracking-widest mb-6" style={{ color: BRAND.navy }}>Strategic Realities</h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg bg-red-50 mt-1"><DollarSign className="w-5 h-5" style={{ color: BRAND.red }} /></div>
                <div>
                  <p className="font-heading text-[11px] uppercase tracking-tight" style={{ color: BRAND.navy }}>Venue Financials</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Renting a space may increase fees. Expansion is subject to owner constraints and availability.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg bg-slate-100 mt-1"><Clock className="w-5 h-5" style={{ color: BRAND.slate }} /></div>
                <div>
                  <p className="font-heading text-[11px] uppercase tracking-tight" style={{ color: BRAND.navy }}>Slot Availability</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">A 3rd service usually requires sub-optimal timing, creating friction for retaining guests long term.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg bg-green-50 mt-1"><Users className="w-5 h-5" style={{ color: BRAND.green }} /></div>
                <div>
                  <p className="font-heading text-[11px] uppercase tracking-tight" style={{ color: BRAND.navy }}>Volunteer Health</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Launching before the team is ready leads to leader burnout. Ensure the Serve Ratio stays high.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
