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
  x: number;
  y: number;
  z: number;
  facing?: string;
  fuel?: number;
  inventory?: Array<any>;
}

export type UninitiatedMachine = {
  id: string;
  type: string;
}

export type Block = {
  id: string;
  x: number;
  y: number;
  z: number;
  type: string;
  is_solid: boolean;
};

export type World = {
  id: string;
  name: string;
  blocks: Array<Block>;
}

interface MachineContextProps {
  machines: Array<Machine>;
  uninitiated: Array<UninitiatedMachine>;
  worlds: Array<World>;
  setMachines: React.Dispatch<React.SetStateAction<any[]>>;
  setUninitiatedMachines: React.Dispatch<React.SetStateAction<any[]>>;
  setWorlds: React.Dispatch<React.SetStateAction<any[]>>;
}

export const DataContext = createContext<MachineContextProps | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [machines, setMachines] = useState<any[]>([]);
  const [uninitiated, setUninitiatedMachines] = useState<any[]>([]);
  const [worlds, setWorlds] = useState<any[]>([]);

  useEffect(() => {
    console.log('DataProvider isAuthenticated:', isAuthenticated);
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

      fetch('/api/get/worlds', {
        method: 'GET',
        credentials: 'include',
      })
      .then((response) => response.json())
      .then((data) => setWorlds(data.worlds))
      .catch((error) => console.error('Error fetching worlds:', error));
    }
  }, [isAuthenticated]);

  return (
    <DataContext.Provider value={{ machines, setMachines, uninitiated, setUninitiatedMachines, worlds, setWorlds }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a MachineProvider');
  }
  return context;
};
