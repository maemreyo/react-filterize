import { useCallback } from 'react';
import { useFilterHistory as useBaseFilterHistory } from './useFilterHistory';
import { serializeFilters } from '../utils/serialization';

export const useEnhancedFilterHistory = ({ filters, options }) => {
  const {
    history,
    push: pushHistory,
    undo: undoHistory,
    redo: redoHistory,
    canUndo,
    canRedo,
  } = useBaseFilterHistory({
    filters,
    timestamp: Date.now(),
  });

  const updateHistoryForFilters = useCallback(
    (newFilters: any) => {
      if (options.url || options.url.key) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(
          options.url.key,
          serializeFilters(newFilters, options.encode)
        );
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.pushState({}, '', newUrl);
      }
    },
    [options]
  );

  const undo = useCallback(() => {
    undoHistory();
    const previousState = history.past[history.past.length - 1];
    if (previousState) {
      options.setFilters(previousState.filters);
      updateHistoryForFilters(previousState.filters);
    }
  }, [history.past, undoHistory, updateHistoryForFilters, options]);

  const redo = useCallback(() => {
    redoHistory();
    const nextState = history.future[0];
    if (nextState) {
      options.setFilters(nextState.filters);
      updateHistoryForFilters(nextState.filters);
    }
  }, [history.future, redoHistory, updateHistoryForFilters, options]);

  return {
    history: {
      undo,
      redo,
      canUndo,
      canRedo,
      current: history.present,
      past: history.past,
      future: history.future,
    },
  };
};
