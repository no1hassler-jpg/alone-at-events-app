export function formatEventDate(isoDate: string): { weekday: string; day: string; month: string } {
  const date = new Date(`${isoDate}T00:00:00`);
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
  const day = date.toLocaleDateString('en-GB', { day: '2-digit' });
  const month = date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  return { weekday, day, month };
}
