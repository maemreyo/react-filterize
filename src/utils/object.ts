export const isEmpty = (obj: Record<string, any>): boolean => {
  return !obj || Object.keys(obj).length === 0;
};

export function areObjectsEqual(obj1: any, obj2: any): boolean {
  if (!obj1 || !obj2) return false;

  try {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  } catch (e) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    return keys1.every(key => obj1[key] === obj2[key]);
  }
}

export function areDepArraysEqual(
  prevDeps: any[],
  currentDeps: any[]
): boolean {
  if (!prevDeps || !currentDeps) return false;
  if (prevDeps.length !== currentDeps.length) return false;

  try {
    return JSON.stringify(prevDeps) === JSON.stringify(currentDeps);
  } catch (e) {
    return prevDeps.every((dep, index) => {
      const prev = dep;
      const current = currentDeps[index];

      if (
        typeof prev === 'object' &&
        prev !== null &&
        typeof current === 'object' &&
        current !== null
      ) {
        const prevKeys = Object.keys(prev);
        const currentKeys = Object.keys(current);

        if (prevKeys.length !== currentKeys.length) return false;

        return prevKeys.every(key => prev[key] === current[key]);
      }

      return prev === current;
    });
  }
}

export function areFiltersEqual(
  prevFilters: any,
  currentFilters: any
): boolean {
  if (!prevFilters || !currentFilters) return false;

  try {
    return JSON.stringify(prevFilters) === JSON.stringify(currentFilters);
  } catch (e) {
    const prevKeys = Object.keys(prevFilters);
    const currentKeys = Object.keys(currentFilters);

    if (prevKeys.length !== currentKeys.length) return false;

    return prevKeys.every(key => prevFilters[key] === currentFilters[key]);
  }
}
