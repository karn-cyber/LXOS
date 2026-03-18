// Allowed RU email domains and admin emails
export const ALLOWED_DOMAINS = ['rishihood.edu.in', 'nst.rishihood.edu.in', 'lxos.edu'];

// Admin and exception emails (not requiring verification/domain check)
export const ADMIN_EXCEPTIONS = [
  'admin@lxos.edu',
  'lx@lxos.edu',
  'clubhead@lxos.edu',
  'finance@lxos.edu',
];

// Function to check if email is allowed
export function isEmailAllowed(email: string): boolean {
  if (!email) return false;

  // Check if it's an admin exception
  if (ADMIN_EXCEPTIONS.includes(email.toLowerCase())) {
    return true;
  }

  // Check if email has allowed domain
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

// Function to check if email domain is verified college email
export function isCollegeEmail(email: string): boolean {
  if (!email) return false;
  
  const domain = email.split('@')[1]?.toLowerCase();
  return ['rishihood.edu.in', 'nst.rishihood.edu.in'].includes(domain);
}
