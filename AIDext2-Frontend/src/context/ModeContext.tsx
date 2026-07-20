// ModeContext.tsx

import { createContext, useContext, useState} from "react";
import type { ReactNode } from "react";

type ModeContextType = {
  useLocal: boolean;
  setUseLocal: React.Dispatch<React.SetStateAction<boolean>>;
};

const ModeContext = createContext<ModeContextType | undefined>(undefined);

type ModeProviderProps = {
  children: ReactNode;
};

export function ModeProvider({ children }: ModeProviderProps) {
  const [useLocal, setUseLocal] = useState(true);

  return (
    <ModeContext.Provider value={{ useLocal, setUseLocal }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);

  if (!context) {
    throw new Error("useMode must be used inside a ModeProvider");
  }

  return context;
}