// Allowed RU email domains and admin emails
export const ALLOWED_DOMAINS = ['rishihood.edu.in', 'nst.rishihood.edu.in', 'lxos.edu'];

// Admin and exception emails (not requiring verification/domain check)
export const ADMIN_EXCEPTIONS = [
  'admin@lxos.edu',
  'lx@lxos.edu',
  'clubhead@lxos.edu',
  'finance@lxos.edu',
];

// Import RU data for email verification
import ruDataRaw from '../all RU data 2 (1).json' with { type: 'json' };

// Ensure ruData is an array (handle both direct array and nested data.array structure)
const ruData = Array.isArray(ruDataRaw) 
  ? ruDataRaw 
  : Array.isArray(ruDataRaw?.data) 
    ? ruDataRaw.data 
    : [];

// Function to check if email exists in RU data
function emailExistsInRUData(email: string): boolean {
  if (!ruData.length) {
    console.log('[clerk-config] RU data not loaded');
    return false;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const found = ruData.some(record => 
    record?.email?.toLowerCase().trim() === normalizedEmail
  );
  
  console.log('[clerk-config] Email in RU data?', found, 'Email:', normalizedEmail);
  return found;
}

// Function to check if email is allowed
export function isEmailAllowed(email: string): boolean {
  if (!email) {
    console.log('[clerk-config] No email provided');
    return false;
  }

  const normalizedEmail = email.toLowerCase().trim();
  
  // Check if it's an admin exception
  if (ADMIN_EXCEPTIONS.includes(normalizedEmail)) {
    console.log('[clerk-config] Email is admin exception:', normalizedEmail);
    return true;
  }

  // Check if email exists in RU data
  const existsInRU = emailExistsInRUData(normalizedEmail);
  console.log('[clerk-config] Email allowed based on RU data check:', existsInRU);
  
  return existsInRU;
}

// Function to check if email domain is verified college email
export function isCollegeEmail(email: string): boolean {
  if (!email) return false;
  
  const domain = email.split('@')[1]?.toLowerCase();
  return ['rishihood.edu.in', 'nst.rishihood.edu.in'].includes(domain);
}
