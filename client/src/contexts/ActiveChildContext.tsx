import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Child } from '@shared/schema';

interface ActiveChildContextType {
  children: Child[];
  activeChildId: string | null;
  activeChild: Child | null;
  setActiveChildId: (id: string) => void;
  isLoading: boolean;
}

const ActiveChildContext = createContext<ActiveChildContextType | undefined>(undefined);

const STORAGE_KEY = 'toddl_active_child_id';
const PENDING_TIMEOUT_MS = 10000;

export function ActiveChildProvider({ children: childrenProp, userId }: { children: ReactNode; userId: string | null }) {
  const [activeChildId, setActiveChildIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY);
    }
    return null;
  });

  const pendingSelectionRef = useRef<{ id: string; timestamp: number } | null>(null);

  const { data: childrenData = [], isLoading: queryLoading, isFetching, dataUpdatedAt } = useQuery<Child[]>({
    queryKey: ['/api/children'],
    enabled: !!userId,
  });
  
  // Consider loading if: query is loading OR we're waiting for userId (query not enabled yet)
  // This prevents false "0 children" state when query hasn't run yet
  const isLoading = queryLoading || !userId;

  const setActiveChildId = useCallback((id: string) => {
    pendingSelectionRef.current = { id, timestamp: Date.now() };
    setActiveChildIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  useEffect(() => {
    if (isFetching || isLoading) {
      return;
    }

    if (childrenData.length === 0) {
      setActiveChildIdState(null);
      localStorage.removeItem(STORAGE_KEY);
      pendingSelectionRef.current = null;
      return;
    }

    const currentChildExists = activeChildId && childrenData.some(c => c.id === activeChildId);
    
    if (currentChildExists) {
      pendingSelectionRef.current = null;
      return;
    }

    if (pendingSelectionRef.current) {
      const pending = pendingSelectionRef.current;
      const pendingExists = childrenData.some(c => c.id === pending.id);
      
      if (pendingExists) {
        setActiveChildIdState(pending.id);
        localStorage.setItem(STORAGE_KEY, pending.id);
        pendingSelectionRef.current = null;
        return;
      }

      const elapsed = Date.now() - pending.timestamp;
      if (elapsed < PENDING_TIMEOUT_MS) {
        return;
      }

      pendingSelectionRef.current = null;
    }

    const savedId = localStorage.getItem(STORAGE_KEY);
    const savedChildExists = savedId && childrenData.some(c => c.id === savedId);
    
    if (savedChildExists) {
      setActiveChildIdState(savedId);
    } else {
      const firstChildId = childrenData[0].id;
      setActiveChildIdState(firstChildId);
      localStorage.setItem(STORAGE_KEY, firstChildId);
    }
  }, [childrenData, activeChildId, isFetching, isLoading, dataUpdatedAt]);

  useEffect(() => {
    if (!userId) {
      setActiveChildIdState(null);
      localStorage.removeItem(STORAGE_KEY);
      pendingSelectionRef.current = null;
    }
  }, [userId]);

  const activeChild = useMemo(() => 
    childrenData.find(c => c.id === activeChildId) || null,
    [childrenData, activeChildId]
  );

  return (
    <ActiveChildContext.Provider
      value={{
        children: childrenData,
        activeChildId,
        activeChild,
        setActiveChildId,
        isLoading,
      }}
    >
      {childrenProp}
    </ActiveChildContext.Provider>
  );
}

export function useActiveChild() {
  const context = useContext(ActiveChildContext);
  if (context === undefined) {
    throw new Error('useActiveChild must be used within an ActiveChildProvider');
  }
  return context;
}
