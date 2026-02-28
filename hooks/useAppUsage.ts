import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { loadAppUsage, saveAppUsage } from '../storage/storage';

export const useAppUsage = () => {
  const appState = useRef(AppState.currentState);
  const startTime = useRef<Date | null>(null);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App coming to foreground - start tracking
        startTime.current = now;
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App going to background - calculate usage
        if (startTime.current) {
          const endTime = now;
          const minutesUsed = Math.round((endTime.getTime() - startTime.current.getTime()) / 60000);
          
          if (minutesUsed > 0) {
            // Load existing usage data
            const usageData = await loadAppUsage();
            
            // Find today's entry
            const todayIndex = usageData.findIndex((u: { date: string }) => u.date === dateStr);
            
            if (todayIndex >= 0) {
              // Update existing entry
              usageData[todayIndex].minutes += minutesUsed;
            } else {
              // Add new entry
              usageData.push({ date: dateStr, minutes: minutesUsed });
            }
            
            // Keep only last 30 days of data
            const filteredData = usageData.slice(-30);
            
            // Save updated data
            await saveAppUsage(filteredData);
          }
          
          startTime.current = null;
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);
};
