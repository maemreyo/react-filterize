import { useState, useCallback } from 'react';
import { FilterHistory, FilterHistoryState } from '../types';

export const useFilterHistory = <T extends Record<string, any>>(
  initialState: FilterHistoryState<T>
) => {
  const [history, setHistory] = useState<FilterHistory<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const push = useCallback((newState: FilterHistoryState<T>) => {
    setHistory(curr => ({
      past: [...curr.past, curr.present],
      present: newState,
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory(curr => {
      if (curr.past.length === 0) return curr;

      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(curr => {
      if (curr.future.length === 0) return curr;

      const next = curr.future[0];
      const newFuture = curr.future.slice(1);

      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  return {
    history,
    push,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
};
