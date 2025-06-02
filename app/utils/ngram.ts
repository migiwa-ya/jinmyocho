export function ngram(str: string, n: number): string[] {
  if (n <= 0) return [];
  if (str.length < n) return [str];

  const result: string[] = [];
  for (let i = 0; i <= str.length - n; i++) {
    result.push(str.slice(i, i + n));
  }
  return result;
}
