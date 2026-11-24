import type { PropItem } from './prop-list';

export function commandUnits(command: PropItem): readonly string[] {
  if (command.allowedUnits) return command.allowedUnits;
  if (command.shortcut === 'op') return ['%'];
  if (command.shortcut === 'rot') return ['deg'];
  if (['w', 'h', 'wh', 'ls', 'lh'].includes(command.shortcut)) return ['px', '%'];
  return ['px'];
}

export function isValueValidForCommand(command: PropItem, value: string): boolean {
  if (command.validateValue) return command.validateValue(value);
  if (command.hasValue === false) return value === '' && Boolean(command.action);
  if (command.valueKind === 'axis' || ['fit', 'fill', 'hug'].includes(command.shortcut))
    return /^(?:w|h)?$/i.test(value);
  if (command.valueKind === 'integer' || command.shortcut === 'dup') return /^\d+$/.test(value);
  const scalar = (part: string) => {
    const match = part.match(/^(-?\d*\.?\d+)([a-z%]+)?$/i);
    if (!match) return false;
    const number = Number(match[1]);
    if (!Number.isFinite(number) || (number < 0 && command.allowsNegative !== true)) return false;
    if (command.shortcut === 'ts' && number <= 0) return false;
    return !match[2] || commandUnits(command).includes(match[2].toLowerCase());
  };
  if (command.valueKind === 'pair' && value.includes(',')) {
    const parts = value.split(',');
    return parts.length === 2 && parts.every(scalar);
  }
  return scalar(value);
}
