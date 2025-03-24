/**
 * Converts a full name to initials.
 * For example, "Sheikh Shariar Nehal" becomes "SSN"
 * 
 * @param name The full name to convert to initials
 * @returns The initials as a string
 */
export function getInitials(name?: string): string {
  if (!name) return 'N/A';
  
  // Split the name by spaces and get the first letter of each part
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('');
} 