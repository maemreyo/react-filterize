export const serializeFilters = (filters: Record<string, any>): string => {
  try {
    // Handle special types like Date before serialization
    const processedFilters = Object.entries(filters).reduce(
      (acc, [key, value]) => {
        if (value instanceof Date) {
          acc[key] = value.toISOString();
        } else if (Array.isArray(value) && value[0] instanceof Date) {
          acc[key] = value.map(date => date.toISOString());
        } else {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, any>
    );

    return btoa(JSON.stringify(processedFilters));
  } catch (error) {
    console.error('Error serializing filters:', error);
    return '';
  }
};

export const deserializeFilters = (serialized: string): Record<string, any> => {
  try {
    if (!serialized) return {};

    const parsed = JSON.parse(atob(serialized));

    // Handle special types like Date after deserialization
    return Object.entries(parsed).reduce((acc, [key, value]) => {
      // Check if value is an ISO date string
      if (
        typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/.test(value)
      ) {
        acc[key] = new Date(value);
      }
      // Check if value is an array of ISO date strings
      else if (
        Array.isArray(value) &&
        typeof value[0] === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/.test(value[0])
      ) {
        acc[key] = value.map(dateStr => new Date(dateStr));
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
  } catch (error) {
    console.error('Error deserializing filters:', error);
    return {};
  }
};
