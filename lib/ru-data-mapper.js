import ruDataRaw from '../all RU data 2 (1).json' with { type: 'json' };

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
 * Get role from RU data for user email
 */
export function getRoleFromRUData(email) {
  const ruUser = lookupRUUser(email);
  if (!ruUser || !ruUser.userType) {
    return null;
  }
  
  return mapRUTypeToRole(ruUser.userType);
}
