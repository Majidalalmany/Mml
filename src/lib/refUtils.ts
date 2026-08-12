export function generateRefNumber(prefix: string, digits = 4): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - min;
  return `${prefix}-${Math.floor(min + Math.random() * max)}`;
}
