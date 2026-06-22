import ruDataRaw from '../data/ru-data.json' with { type: 'json' };

// Ensure ruData is an array (handle both direct array and nested data.array structure)
const ruData = Array.isArray(ruDataRaw) 
  ? ruDataRaw 
  : Array.isArray(ruDataRaw?.data) 
    ? ruDataRaw.data 
    : [];

/**
 * Maps RU userType to application role
 */
export function mapRUTypeToRole(userType) {
  if (!userType) return 'GUEST';
  
  const normalizedType = userType.toString().toUpperCase().trim();
  
  switch (normalizedType) {
    case 'ADMIN':
      return 'ADMIN';
    case 'FINANCE':
      return 'FINANCE';
    case 'LX':
    case 'LX_TEAM':
      return 'LX_TEAM';
    case 'CLUB':
    case 'CLUB_HEAD':
      return 'CLUB_HEAD';
    case 'CLAN':
    case 'CLAN_HEAD':
      return 'CLAN_HEAD';
    default:
      return 'GUEST';
  }
}

/**
 * Look up user in RU data by email
 */
export function lookupRUUser(email) {
  if (!email || !Array.isArray(ruData) || ruData.length === 0) {
    return null;
  }

  const normalizedEmail = email.toLowerCase().trim().replace(/\s+/g, '');
  const foundUser = ruData.find(record => {
    if (!record) return false;
    const recordEmail = record.email ? record.email.toLowerCase().trim().replace(/\s+/g, '') : '';
    const contactEmail = record.contactEmail ? record.contactEmail.toLowerCase().trim().replace(/\s+/g, '') : '';
    return recordEmail === normalizedEmail || contactEmail === normalizedEmail;
  });

  return foundUser || null;
}

/**
 * Search RU users by name or email for the access-management picker.
 * Returns a lightweight list: { name, email, userType }.
 */
export function searchRUUsers(query, limit = 20) {
    if (!Array.isArray(ruData)) return [];
    const q = String(query || '').toLowerCase().trim();
    const pick = (r) => ({
        name: r.name || (r.email ? r.email.split('@')[0] : 'Unknown'),
        email: (r.email || r.contactEmail || '').toLowerCase().trim(),
        userType: r.userType || null,
    });
    const withEmail = ruData.filter(r => r && (r.email || r.contactEmail));
    if (!q) return withEmail.slice(0, limit).map(pick);
    return withEmail
        .filter(r => {
            const name = (r.name || '').toLowerCase();
            const email = (r.email || r.contactEmail || '').toLowerCase();
            return name.includes(q) || email.includes(q);
        })
        .slice(0, limit)
        .map(pick);
}

/**
 * Get role from RU data for user email
 */
export function getRoleFromRUData(email) {
  const ruUser = lookupRUUser(email);
  if (!ruUser || !ruUser.userType) {
    return null;
  }
  
  return mapRUTypeToRole(ruUser.userType);
}
