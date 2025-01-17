export const compress = async (data: string): Promise<string> => {
  // Using Base64 + simple RLE compression
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);

  let compressed = '';
  let count = 1;
  let current = bytes[0];

  for (let i = 1; i < bytes.length; i++) {
    if (bytes[i] === current && count < 255) {
      count++;
    } else {
      compressed += `${count},${current};`;
      current = bytes[i];
      count = 1;
    }
  }

  compressed += `${count},${current}`;

  return btoa(compressed);
};

export const decompress = async (compressed: string): Promise<string> => {
  const decoder = new TextDecoder();
  const data = atob(compressed);

  const pairs = data.split(';');
  const bytes: number[] = [];

  for (const pair of pairs) {
    const [count, value] = pair.split(',').map(Number);
    bytes.push(...Array(count).fill(value));
  }

  return decoder.decode(new Uint8Array(bytes));
};
