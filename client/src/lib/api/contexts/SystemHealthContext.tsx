import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiService } from '@/lib/api/apiService';
import type { HealthStatus } from '@/types/auth.types';

interface SystemHealthContextType {
  healthStatus: HealthStatus | null;
  isHealthy: boolean;
  isDegraded: boolean;
  isUnhealthy: boolean;
  lastChecked: Date | null;
}

export const SystemHealthContext = createContext<SystemHealthContextType | undefined>(undefined);

export function SystemHealthProvider({ children }: { children: React.ReactNode }) {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  // Check system health on mount and periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await apiService.checkHealth();
        setHealthStatus(health);
        setLastChecked(new Date());
      } catch (error) {
        console.error('Health check failed:', error);
      }
    };
    
    // Initial check
    checkHealth();
    
    // Set up polling (every 30 seconds)
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const value = {
    healthStatus,
    isHealthy: healthStatus?.status === 'healthy',
    isDegraded: healthStatus?.status === 'degraded',
    isUnhealthy: healthStatus?.status === 'unhealthy',
    lastChecked
  };
  
  return (
    <SystemHealthContext.Provider value={value}>
      {children}
    </SystemHealthContext.Provider>
  );
}

export function useSystemHealth() {
  const context = useContext(SystemHealthContext);
  if (context === undefined) {
    throw new Error('useSystemHealth must be used within a SystemHealthProvider');
  }
  return context;
}