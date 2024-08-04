// context/MachineContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import useAuth from '../hooks/useAuth';

// TODO: Use openAPI to generate these types
export type Machine = {
  id: string;
  name: string;
  type: string;
  world_id: string;
  connected: boolean;
}

export type UninitiatedMachine = {
  id: string;
  type: string;
}

interface MachineContextProps {
  machines: Array<Machine>;
  uninitiated: Array<UninitiatedMachine>;
  setMachines: React.Dispatch<React.SetStateAction<any[]>>;
  setUninitiatedMachines: React.Dispatch<React.SetStateAction<any[]>>;
}

export const MachineContext = createContext<MachineContextProps | undefined>(undefined);

export const MachineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [machines, setMachines] = useState<any[]>([]);
  const [uninitiated, setUninitiatedMachines] = useState<any[]>([]);

  useEffect(() => {
    console.log('MachineProvider isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      fetch('/api/get/machines', {
        method: 'GET',
        credentials: 'include',
      })
      .then((response) => response.json())
      .then((data) => {
        setMachines(data.machines);
        setUninitiatedMachines(data.uninitiated);
      })
      .catch((error) => console.error('Error fetching machines:', error));
    }
  }, [isAuthenticated]);

  return (
    <MachineContext.Provider value={{ machines, setMachines, uninitiated, setUninitiatedMachines }}>
      {children}
    </MachineContext.Provider>
  );
};

export const useMachines = () => {
  const context = useContext(MachineContext);
  if (!context) {
    throw new Error('useMachines must be used within a MachineProvider');
  }
  return context;
};
