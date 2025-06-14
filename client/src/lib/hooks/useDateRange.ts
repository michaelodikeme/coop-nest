import { useState, useMemo } from 'react';

export function useDateRange() {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  
  const [startDate, endDate] = useMemo(() => {
    return dateRange;
  }, [dateRange]);
  
  return {
    dateRange,
    setDateRange,
    startDate,
    endDate
  };
}