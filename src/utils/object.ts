// Helper function to check if object is empty
export const isEmpty = (obj: Record<string, any>): boolean => {
  return !obj || Object.keys(obj).length === 0;
};
