import { FilterConfig, ValueTypeKey } from '../types';

export const detectCircularDependencies = <T extends ValueTypeKey>(
  f: FilterConfig<T>[]
): void => {
  const graph: Record<string, string[]> = {};
  f.forEach(config => {
    graph[config.key] = Object.keys(config.dependencies || {});
  });

  const visited: Record<string, boolean> = {};
  const recursionStack: Record<string, boolean> = {};

  const hasCycle = (node: string): boolean => {
    visited[node] = true;
    recursionStack[node] = true;

    for (const neighbor of graph[node]) {
      if (!visited[neighbor] && hasCycle(neighbor)) {
        return true;
      } else if (recursionStack[neighbor]) {
        return true;
      }
    }

    recursionStack[node] = false;
    return false;
  };

  for (const node in graph) {
    if (!visited[node] && hasCycle(node)) {
      throw new Error(`Circular dependency detected involving filter: ${node}`);
    }
  }
};
