export const serializeFilters = (
  filters: Record<string, any>,
  encodeUrlFilters: boolean = true
): string => {
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

    // Encode or return filters as query string depending on encodeUrlFilters
    if (encodeUrlFilters) {
      return btoa(JSON.stringify(processedFilters));
    } else {
      const queryString = new URLSearchParams(
        processedFilters as Record<string, string>
      ).toString();
      return queryString;
    }
  } catch (error) {
    console.error('Error serializing filters:', error);
    return '';
  }
};

export const deserializeFilters = (
  serialized: string,
  encodeUrlFilters: boolean = true
): Record<string, any> => {
  try {
    if (!serialized) return {};
    let parsed: Record<string, any> = {};

    // Deserialize filters according to encoding setting
    if (encodeUrlFilters) {
      parsed = JSON.parse(atob(serialized));
    } else {
      const urlParams = new URLSearchParams(serialized);
      urlParams.forEach((value, key) => {
        parsed[key] = value;
      });
    }

    // Handle special types like Date after deserialization
    return Object.entries(parsed).reduce((acc, [key, value]) => {
      if (
        typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/.test(value)
      ) {
        acc[key] = new Date(value);
      } else if (
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
