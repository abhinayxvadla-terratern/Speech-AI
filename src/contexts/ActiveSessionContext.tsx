import React, { createContext, useContext, useState, useMemo } from 'react';

interface ActiveSessionContextType {
  isSessionActive: boolean;
  setSessionActive: (active: boolean) => void;
}

const ActiveSessionContext = createContext<ActiveSessionContextType>({
  isSessionActive: false,
  setSessionActive: () => {},
});

export const ActiveSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSessionActive, setSessionActive] = useState<boolean>(false);

  const value = useMemo(
    () => ({ isSessionActive, setSessionActive }),
    [isSessionActive]
  );

  return (
    <ActiveSessionContext.Provider value={value}>
      {children}
    </ActiveSessionContext.Provider>
  );
};

export const useActiveSession = () => useContext(ActiveSessionContext);
