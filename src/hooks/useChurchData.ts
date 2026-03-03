import { useState, useEffect, useCallback, useMemo } from 'react';

export interface WeeklyData {
  date: string;
  displayDate: string;
  totals: {
    overall: number;
    auditorium: number;
    kids: number;
    team: number;
    decisions: number;
    newGuests: number;
    secondTimeGuests: number;
    vehicles: number;
    chairCount: number;
    baptisms: number;
    dedications: number;
    nextSteps: number;
    familyDinner: number;
  };
  services: {
    name: string;
    overall: number;
    auditorium: number;
    kids: number;
    team: number;
    newGuests: number;
    vehicles: number;
    chairCount: number;
  }[];
}

const parseCSV = (csvText: string): WeeklyData[] => {
  const lines = csvText.split('\n');
  const data: WeeklyData[] = [];
  let currentWeek: WeeklyData | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const row = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/(^"|"$)/g, '').trim());
    const col0 = row[0];
    const col1 = row[1];

    if (col0 === 'Totals' && currentWeek) {
      currentWeek.totals = {
        overall: parseInt(row[1]?.replace(/,/g, '')) || 0,
        auditorium: parseInt(row[2]?.replace(/,/g, '')) || 0,
        kids: parseInt(row[3]?.replace(/,/g, '')) || 0,
        team: parseInt(row[4]?.replace(/,/g, '')) || 0,
        decisions: parseInt(row[5]?.replace(/,/g, '')) || 0,
        newGuests: parseInt(row[6]?.replace(/,/g, '')) || 0,
        secondTimeGuests: parseInt(row[7]?.replace(/,/g, '')) || 0,
        vehicles: parseInt(row[8]?.replace(/,/g, '')) || 0,
        chairCount: parseInt(row[9]?.replace(/,/g, '')) || 0,
        baptisms: parseInt(row[10]?.replace(/,/g, '')) || 0,
        dedications: parseInt(row[11]?.replace(/,/g, '')) || 0,
        nextSteps: parseInt(row[12]?.replace(/,/g, '')) || 0,
        familyDinner: parseInt(row[13]?.replace(/,/g, '')) || 0,
      };
      data.push(currentWeek);
      currentWeek = null; 
    } else if (col0 && (!col1 || col1 === '') && col0 !== 'Totals' && !col0.includes('Attendance')) {
      const parsedDate = new Date(col0);
      if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2000) {
        const y = parsedDate.getFullYear();
        const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const d = String(parsedDate.getDate()).padStart(2, '0');
        currentWeek = {
          date: `${y}-${m}-${d}`,
          displayDate: col0,
          services: [],
          totals: {
            overall: 0, auditorium: 0, kids: 0, team: 0, decisions: 0, newGuests: 0,
            secondTimeGuests: 0, vehicles: 0, chairCount: 0, baptisms: 0, dedications: 0,
            nextSteps: 0, familyDinner: 0
          }
        };
      }
    } else if (currentWeek && col0 && col0 !== 'Totals') {
      if (col1 && !isNaN(parseInt(col1.replace(/,/g, '')))) {
        currentWeek.services.push({
          name: col0,
          overall: parseInt(col1?.replace(/,/g, '')) || 0,
          auditorium: parseInt(row[2]?.replace(/,/g, '')) || 0,
          kids: parseInt(row[3]?.replace(/,/g, '')) || 0,
          team: parseInt(row[4]?.replace(/,/g, '')) || 0,
          newGuests: parseInt(row[6]?.replace(/,/g, '')) || 0,
          vehicles: parseInt(row[8]?.replace(/,/g, '')) || 0,
          chairCount: parseInt(row[9]?.replace(/,/g, '')) || 0,
        });
      }
    }
  }
  return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export function useChurchData() {
  const [rawData, setRawData] = useState<WeeklyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSheetData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sheetId = '1CKFdwYOzRIUW-tlnbxHYN9OgD5CZDj1q4yS95Ui2pbM';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('Network error');
      const text = await response.text();
      if (text.trim().startsWith('<')) throw new Error('Please Publish Sheet to Web');
      setRawData(parseCSV(text));
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Connection timed out. Please try again.');
      } else {
        setError(err.message || 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSheetData();
  }, [fetchSheetData]);

  return { rawData, isLoading, error, refetch: fetchSheetData };
}
