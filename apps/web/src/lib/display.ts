/**
 * Returns up to two uppercase letters from an email or name to use as avatar
 * initials. e.g. "ada.lovelace@empresa.com" -> "AL", "admin" -> "A".
 */
export function initialsFromEmail(emailOrName: string | undefined | null): string {
  if (!emailOrName) return '?';
  const local = emailOrName.split('@')[0] ?? emailOrName;
  const parts = local.split(/[._\-\s]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

/** Maps backend role to a friendly Spanish label. */
export function roleLabel(role: string | undefined | null): string {
  switch (role) {
    case 'OWNER':
      return 'Dueño';
    case 'PROCUREMENT':
      return 'Compras';
    case 'PRODUCTION':
      return 'Producción';
    case 'QC':
      return 'Calidad';
    case 'SALES':
      return 'Ventas';
    case 'FINANCE':
      return 'Finanzas';
    case 'OPERATOR':
      return 'Operador';
    default:
      return role ?? '';
  }
}
