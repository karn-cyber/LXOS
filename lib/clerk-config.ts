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
import { lookupRUUser } from './ru-data-mapper';

// Ensure ruData is an array (handle both direct array and nested data.array structure)
const ruData = Array.isArray(ruDataRaw) 
  ? ruDataRaw 
  : Array.isArray(ruDataRaw?.data) 
    ? ruDataRaw.data 
    : [];

function normalizeEmail(email: string): string {
  return String(email || '').toLowerCase().trim().replace(/\s+/g, '');
}

// Build a fast lookup set from RU data emails (email + contactEmail)
const ruEmailSet = new Set(
  ruData
    .flatMap((record: any) => [record?.email, record?.contactEmail])
    .filter(Boolean)
    .map((value: string) => normalizeEmail(value))
);

// Function to check if email exists in RU data
function emailExistsInRUData(email: string): boolean {
  if (!ruEmailSet.size) {
    console.log('[clerk-config] RU data not loaded');
    // fallback to mapper lookup if set is unexpectedly empty
    return Boolean(lookupRUUser(email));
  }

  const normalizedEmail = normalizeEmail(email);
  const found = ruEmailSet.has(normalizedEmail) || Boolean(lookupRUUser(normalizedEmail));
  
  console.log('[clerk-config] Email in RU data?', found, 'Email:', normalizedEmail);
  return found;
}

// Function to check if email is allowed
export function isEmailAllowed(email: string): boolean {
  if (!email) {
    console.log('[clerk-config] No email provided');
    return false;
  }

  const normalizedEmail = normalizeEmail(email);
  
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
