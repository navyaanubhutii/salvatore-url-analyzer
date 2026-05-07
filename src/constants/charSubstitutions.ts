/**
 * Character substitutions used by attackers to visually mimic legitimate domains.
 * Maps deceptive char → the real letter it imitates.
 */
export const CHAR_SUBSTITUTIONS: Record<string, string> = {
  '0': 'o',
  '1': 'l',
  '3': 'e',
  '@': 'a',
  '$': 's',
  '5': 's',
  '4': 'a',
  '7': 't',
  '8': 'b',
  '9': 'g',
  'vv': 'w',
  'rn': 'm',
};

/**
 * Apply all substitutions to a string and return a normalized version
 * that strips attacker character tricks.
 */
export const deobfuscate = (token: string): string => {
  let result = token.toLowerCase();
  for (const [fake, real] of Object.entries(CHAR_SUBSTITUTIONS)) {
    result = result.split(fake).join(real);
  }
  return result;
};
