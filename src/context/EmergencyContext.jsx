import { createContext, useContext, useState, useCallback } from 'react';

const EmergencyContext = createContext(null);

const INITIAL_STATE = {
  symptoms: '',
  severity: 'LOW',
  riskLevel: 'LOW',
  snakeType: null,
  confidence: null,
  selectedSymptoms: [],
  detectionDone: false,
  isSnakebite: null,
  venomous: null,
  rawClass: null,
};

export function EmergencyProvider({ children }) {
  const [emergency, setEmergency] = useState(INITIAL_STATE);

  const updateEmergency = useCallback((updates) => {
    setEmergency((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetEmergency = useCallback(() => {
    setEmergency(INITIAL_STATE);
  }, []);

  return (
    <EmergencyContext.Provider value={{ ...emergency, updateEmergency, resetEmergency }}>
      {children}
    </EmergencyContext.Provider>
  );
}

export function useEmergency() {
  const ctx = useContext(EmergencyContext);
  if (!ctx) throw new Error('useEmergency must be used within EmergencyProvider');
  return ctx;
}
