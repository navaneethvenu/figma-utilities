interface regexShorthandProps {
  prop: string;
  hasValue?: boolean;
  continueEnd?: boolean;
}

export default function regexShorthand({ prop, hasValue = true, continueEnd = true }: regexShorthandProps) {
  if (hasValue) {
    if (continueEnd) return new RegExp(`\\b${prop}\\-*.*\\.*.*`, 'gi');
  } else {
    if (continueEnd) return new RegExp(`\\b${prop}.*\\b`, 'gi');
    return new RegExp(`\\b${prop}\\b`, 'gi');
  }
}
