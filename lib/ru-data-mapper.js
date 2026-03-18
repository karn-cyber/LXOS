import ruData from '@/all RU data 2 (1).json';

/**
 * Maps RU userType to application role
 */
export function mapRUTypeToRole(userType) {
  switch (userType?.toUpperCase()) {
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
  if (!email || !Array.isArray(ruData)) {
    return null;
  }

  const normalizedEmail = email.toLowerCase().trim();
  return ruData.find(record => 
    record.email && record.email.toLowerCase().trim() === normalizedEmail
  );
}

/**
 * Get role from RU data for user email
 */
export function getRoleFromRUData(email) {
  const ruUser = lookupRUUser(email);
  if (!ruUser) {
    return null;
  }
  
  return mapRUTypeToRole(ruUser.userType);
}
