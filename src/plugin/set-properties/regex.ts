interface regexShorthandProps {
  prop: string;
  hasValue?: boolean;
  continueEnd?: boolean;
}

function startsWithWordChar(str: string) {
  return /^[a-zA-Z0-9_]/.test(str);
}

export default function regexShorthand({ prop, hasValue = true, continueEnd = true }: regexShorthandProps) {
  const escapedProp = escapeRegex(prop);
  const useWordBoundary = startsWithWordChar(prop);
  const boundary = useWordBoundary ? '\\b' : '';

  if (hasValue) {
    return new RegExp(`${boundary}${escapedProp}\\-*.*\\.*.*`, 'gi');
  } else {
    if (continueEnd) return new RegExp(`${boundary}${escapedProp}.*\\b`, 'gi');
    return new RegExp(`${boundary}${escapedProp}\\b`, 'gi');
  }
}

function escapeRegex(input: string): string {
  // Escape all regex special chars properly (improved from your earlier version)
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
