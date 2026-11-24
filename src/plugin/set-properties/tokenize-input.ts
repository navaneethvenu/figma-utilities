export function tokenizeParameterInput(input: string, allowIncomplete = false): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let escaped = false;
  let parenDepth = 0;

  for (const ch of input) {
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      current += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      current += ch;
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && ch === '(') {
      parenDepth++;
      current += ch;
      continue;
    }

    if (!inQuotes && ch === ')') {
      parenDepth--;
      if (parenDepth < 0) {
        throw new Error('Invalid Value: unmatched closing parenthesis');
      }
      current += ch;
      continue;
    }

    if (!inQuotes && parenDepth === 0 && /\s/.test(ch)) {
      if (current.trim() !== '') tokens.push(current);
      current = '';
      continue;
    }

    current += ch;
  }

  if (inQuotes && !allowIncomplete) {
    throw new Error('Invalid Value: unterminated quote');
  }
  if (parenDepth !== 0 && !allowIncomplete) {
    throw new Error('Invalid Value: unterminated parenthesis');
  }

  if (current.trim() !== '') tokens.push(current);
  return tokens;
}
