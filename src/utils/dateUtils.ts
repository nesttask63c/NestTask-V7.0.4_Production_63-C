export function getDaysInWeek(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  
  return days;
}

export function formatDate(date: Date, format: string): string {
  const options: Intl.DateTimeFormatOptions = {};
  
  if (format.includes('EEE')) options.weekday = 'short';
  if (format.includes('d')) options.day = 'numeric';
  if (format.includes('MMMM')) options.month = 'long';
  if (format.includes('yyyy')) options.year = 'numeric';
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

export function isOverdue(dueDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(dueDate);
  taskDate.setHours(0, 0, 0, 0);
  return taskDate < today;
}

/**
 * Checks if two dates are the same day
 * @param date1 First date to compare
 * @param date2 Second date to compare
 * @returns True if both dates represent the same day, false otherwise
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}