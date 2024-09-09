interface regexShorthandProps {
  prop: string;
  hasValue?: boolean;
  continueEnd?: boolean;
}

export default function regexShorthand({ prop, hasValue = true, continueEnd = true }: regexShorthandProps) {
  const escapedProp = escapeRegex(prop);
  //   console.log('espc', escapedProp);

  if (hasValue) {
    return new RegExp(`\\b${escapedProp}\\-*.*\\.*.*`, 'gi');
  } else {
    if (continueEnd) return new RegExp(`\\b${escapedProp}.*\\b`, 'gi');
    return new RegExp(`\\b${escapedProp}\\b`, 'gi');
  }
}

function escapeRegex(input: string): string {
  return input.replace(/h/g, '\\h');
}
