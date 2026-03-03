import { getHistory } from './history';
import { flattenCommands, PropItem, propList } from './prop-list';
import { getOriginLabel, ORIGIN_TOKENS, parseOriginToken, splitOriginPrefixedToken, TransformOrigin } from './origin';

interface getSuggestionsProps {
  query: string;
}

interface BindedCommand {
  command: PropItem;
  value: string;
  prefix: string;
}

interface Suggestion {
  name: string;
  data: string;
}

type CandidateBucket = 'exact' | 'example' | 'next' | 'error';

interface SuggestionCandidate extends Suggestion {
  score: number;
  bucket: CandidateBucket;
}

function isSequentialPrefix(prefix: string) {
  return ['++', '--', '**', '//'].includes(prefix);
}

function isFactorPrefix(prefix: string) {
  return ['*', '/', '**', '//'].includes(prefix);
}

function hasOperatorPrefix(token: string) {
  return /^(\+\+|--|\*\*|\/\/|\+|-|\*|\/)/.test(token);
}

const SCOPED_SCALE_RE = /^sc:((?:\+\+|--|\*\*|\/\/|\+|-|\*|\/)?)([wh])(.*)$/i;

function normalizeScopedScaleToken(token: string) {
  const match = token.match(SCOPED_SCALE_RE);
  if (!match) return token;

  const [, operator, axisRaw, remainder] = match;
  const axis = axisRaw.toLowerCase();
  if (operator === '') return `sc:${axis}${remainder}`;
  return `${operator}sc:${axis}${remainder}`;
}

function isOriginQueryToken(token: string) {
  if (!token) return false;
  if (hasOperatorPrefix(token)) return false;
  if (!/^[a-z]{1,2}:?$/i.test(token)) return false;

  const trimmed = token.trim().toLowerCase();
  const candidate = trimmed.endsWith(':') ? trimmed.slice(0, -1) : trimmed;
  return ORIGIN_TOKENS.some((origin) => origin.startsWith(candidate));
}

function buildOriginSuggestions(values: string[], lastToken: string): Suggestion[] {
  const trimmed = lastToken.trim().toLowerCase();
  const prefix = trimmed.endsWith(':') ? trimmed.slice(0, -1) : trimmed;

  const base = values
    .slice(0, values.length - 1)
    .filter((value) => value.trim() !== '')
    .join(' ');

  const suggestions: Suggestion[] = [];
  for (const origin of ORIGIN_TOKENS) {
    if (!origin.startsWith(prefix)) continue;

    const token = `${origin}:`;
    const label = getOriginLabel(origin);
    const name = base ? `${base} ${token} - Set transform origin to ${label}` : `${token} - Set transform origin to ${label}`;
    const data = base ? `${base} ${token}` : token;
    suggestions.push({ name, data });
  }

  if (suggestions.length === 0) {
    const exact = parseOriginToken(lastToken);
    if (exact) {
      const token = `${exact}:`;
      const label = getOriginLabel(exact);
      const name = base ? `${base} ${token} - Set transform origin to ${label}` : `${token} - Set transform origin to ${label}`;
      const data = base ? `${base} ${token}` : token;
      suggestions.push({ name, data });
    }
  }

  return suggestions;
}

function valueHasExplicitUnit(value: string) {
  return /(px|%|deg)$/i.test(value);
}

function isNumericValue(value: string, allowedUnits: readonly string[] = []) {
  const match = value.trim().match(/^(-?\d*\.?\d+)([a-z%]+)?$/i);
  if (!match) return false;

  const unit = (match[2] ?? '').toLowerCase();
  if (!unit) return true;
  return allowedUnits.map((entry) => entry.toLowerCase()).includes(unit);
}

function isPairNumericValue(value: string, allowedUnits: readonly string[] = []) {
  const [left, right] = value.split(',');
  if (right === undefined) return false;
  return isNumericValue(left, allowedUnits) && isNumericValue(right, allowedUnits);
}

function isAxisModeCommand(command: PropItem) {
  return ['fit', 'fill', 'hug'].includes(command.shortcut);
}

function isAxisValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === 'w' || normalized === 'h';
}

function allowedUnitsForCommand(shortcut: string) {
  if (shortcut === 'op') return ['%'];
  if (shortcut === 'rot') return ['deg'];
  if (shortcut === 'ls' || shortcut === 'lh') return ['px', '%'];
  if (shortcut === 'w' || shortcut === 'h' || shortcut === 'wh') return ['px', '%'];
  return ['px'];
}

function isScalarAllowedForCommand(command: PropItem, value: string, scalarUnit: string) {
  if (command.shortcut === 'f') return /^#?[0-9a-fA-F]+$/.test(value);
  if (command.shortcut === 'dup') return /^\d+$/.test(value.trim());
  if (command.shortcut === 'wh' && value.includes(',')) return isPairNumericValue(value, ['px', '%']);

  const unit = scalarUnit.toLowerCase();
  if (!unit) return true;
  return allowedUnitsForCommand(command.shortcut).includes(unit);
}

function parseScalarValue(value: string) {
  const match = value.match(/^(-?\d*\.?\d+)(?:([+\-*/])(-?\d*\.?\d+))?(px|%|deg)?$/i);
  if (!match) return null;

  const num = Number(match[1]);
  if (!Number.isFinite(num)) return null;
  const progressionOp = (match[2] as '+' | '-' | '*' | '/' | undefined) ?? null;
  const progressionValue = match[3] !== undefined ? Number(match[3]) : null;
  if (progressionValue !== null && !Number.isFinite(progressionValue)) return null;
  if (progressionOp === '/' && progressionValue === 0) return null;

  return {
    num,
    progressionOp,
    progressionValue,
    unit: (match[4] ?? '').toLowerCase(),
  };
}

function parseRangeValue(value: string) {
  const match = value.match(/^(-?\d*\.?\d+)\.\.(-?\d*\.?\d+)$/);
  if (!match) return null;

  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;

  return { start, end };
}

function parseRangeExpression(value: string) {
  const match = value.match(
    /^(-?\d*\.?\d+(?:\.\.-?\d*\.?\d+)?)([+\-*/])(-?\d*\.?\d+(?:\.\.-?\d*\.?\d+)?)$/
  );
  if (!match) return null;

  const left = parseRangeValue(match[1]) ?? parseScalarValue(match[1]);
  const right = parseRangeValue(match[3]) ?? parseScalarValue(match[3]);
  if (!left || !right) return null;

  const leftIsRange = 'end' in left;
  const rightIsRange = 'end' in right;
  if (!leftIsRange && !rightIsRange) return null;

  return {
    op: match[2] as '+' | '-' | '*' | '/',
    left: match[1],
    right: match[3],
  };
}

function hasMalformedRangeValue(value: string) {
  if (!value.includes('..')) return false;
  if (parseRangeValue(value) !== null) return false;
  if (parseRangeExpression(value) !== null) return false;
  return true;
}

function hasProgressionSuffix(value: string) {
  return /^-?\d*\.?\d+(?:[+\-*/]-?\d*\.?\d+)(?:px|%)?$/i.test(value);
}

function rangeTouchesOrCrossesZero(start: number, end: number) {
  if (start === 0 || end === 0) return true;
  return (start < 0 && end > 0) || (start > 0 && end < 0);
}

function formatOperatorMessage(prefix: string, command: PropItem, renderedValue: string) {
  if (prefix && !command.supportsModifiers) {
    return `Error: ${command.name} does not support modifier operators`;
  }

  const leadingNumeric = renderedValue.match(/^-?\d*\.?\d+/);
  if ((prefix === '/' || prefix === '//') && leadingNumeric && Number(leadingNumeric[0]) === 0) {
    return `Error: Division by zero is not allowed`;
  }

  switch (prefix) {
    case '+':
      return `Increase ${command.name} by ${renderedValue}`;
    case '-':
      return `Decrease ${command.name} by ${renderedValue}`;
    case '*':
      return `Multiply ${command.name} by ${renderedValue}`;
    case '/':
      return `Divide ${command.name} by ${renderedValue}`;
    case '++':
      return `Cumulatively increase ${command.name} by ${renderedValue}`;
    case '--':
      return `Cumulatively decrease ${command.name} by ${renderedValue}`;
    case '**':
      return `Cumulatively multiply ${command.name} by ${renderedValue}`;
    case '//':
      return `Cumulatively divide ${command.name} by ${renderedValue}`;
    default:
      if (command.message) return `${command.message} ${renderedValue}`;
      return `${defaultSetLabel(command.name)} ${renderedValue}`;
  }
}

function formatAxisMessage(prefix: string, command: PropItem, value: string) {
  if (prefix && !command.supportsModifiers) {
    return `Error: ${command.name} does not support modifier operators`;
  }

  const normalized = value.trim().toLowerCase();
  if (command.shortcut === 'fit') {
    if (normalized === 'w') return 'Fit element to parent width';
    if (normalized === 'h') return 'Fit element to parent height';
    return 'Fit element to parent width and height';
  }
  if (command.shortcut === 'fill') {
    if (normalized === 'w') return 'Set auto-layout sizing to fill width';
    if (normalized === 'h') return 'Set auto-layout sizing to fill height';
    return 'Set auto-layout sizing to fill width and height';
  }
  if (command.shortcut === 'hug') {
    if (normalized === 'w') return 'Set auto-layout sizing to hug width';
    if (normalized === 'h') return 'Set auto-layout sizing to hug height';
    return 'Set auto-layout sizing to hug width and height';
  }

  return `Set ${command.name} to ${value}`;
}

function withOriginHint(baseMessage: string, command: PropItem, origin: TransformOrigin | null) {
  if (!origin) return baseMessage;
  if (command.supportsOrigin) return `${baseMessage} (origin: ${getOriginLabel(origin)})`;
  return `${baseMessage} (origin ignored)`;
}

function formatOperatorPlaceholder(prefix: string, command: PropItem) {
  if (prefix && !command.supportsModifiers) {
    return `Error: ${command.name} does not support modifier operators`;
  }

  switch (prefix) {
    case '+':
      return `Increase ${command.name} by (Enter Value)`;
    case '-':
      return `Decrease ${command.name} by (Enter Value)`;
    case '*':
      return `Multiply ${command.name} by (Enter Value)`;
    case '/':
      return `Divide ${command.name} by (Enter Value)`;
    case '++':
      return `Cumulatively increase ${command.name} by (Enter Value)`;
    case '--':
      return `Cumulatively decrease ${command.name} by (Enter Value)`;
    case '**':
      return `Cumulatively multiply ${command.name} by (Enter Value)`;
    case '//':
      return `Cumulatively divide ${command.name} by (Enter Value)`;
    default:
      return `${defaultSetLabel(command.name)} (Enter Value)`;
  }
}

function defaultSetLabel(commandName: string) {
  const trimmed = commandName.trim();
  if (/^set\s+/i.test(trimmed)) {
    return `${trimmed} to`;
  }
  return `Set ${trimmed} to`;
}

function renderScalarValue(raw: string, defaultUnit: string, prefix: string) {
  const parsed = parseScalarValue(raw);
  if (!parsed) return raw;

  const normalized = String(parsed.num);
  const shouldAppendDefaultUnit = !isFactorPrefix(prefix);
  const withUnit = parsed.unit
    ? `${normalized}${parsed.unit}`
    : shouldAppendDefaultUnit
      ? `${normalized}${defaultUnit}`.trim()
      : normalized;
  if (parsed.progressionOp && parsed.progressionValue !== null) {
    const op = parsed.progressionOp;
    const val = parsed.progressionValue;
    const renderedVal = op === '+' || op === '-' ? Math.abs(val) : val;
    return `${withUnit}${op}${renderedVal}`;
  }
  if (parsed.unit) return withUnit;
  if (valueHasExplicitUnit(raw)) return raw;
  return withUnit;
}

function formatRangeMessage(prefix: string, command: PropItem, start: number, end: number, unit: string) {
  if (prefix && !command.supportsModifiers) {
    return `Error: ${command.name} does not support modifier operators`;
  }

  const from = unit ? `${start}${unit}` : `${start}`;
  const to = unit ? `${end}${unit}` : `${end}`;

  switch (prefix) {
    case '+':
      return `Increase ${command.name} from ${from} to ${to} across selection`;
    case '-':
      return `Decrease ${command.name} from ${from} to ${to} across selection`;
    case '*':
      return `Multiply ${command.name} from ${from} to ${to} across selection`;
    case '/':
      if (rangeTouchesOrCrossesZero(start, end)) {
        return `Error: Division range cannot touch or cross zero`;
      }
      return `Divide ${command.name} from ${from} to ${to} across selection`;
    case '++':
      return `Cumulatively increase ${command.name} from ${from} to ${to} across selection`;
    case '--':
      return `Cumulatively decrease ${command.name} from ${from} to ${to} across selection`;
    case '**':
      return `Cumulatively multiply ${command.name} from ${from} to ${to} across selection`;
    case '//':
      if (rangeTouchesOrCrossesZero(start, end)) {
        return `Error: Division range cannot touch or cross zero`;
      }
      return `Cumulatively divide ${command.name} from ${from} to ${to} across selection`;
    default:
      return `Set ${command.name} from ${from} to ${to} across selection`;
  }
}

function splitToken(token: string, flattenedCommands?: Record<string, PropItem>) {
  const operatorMatch = token.match(/^(\+\+|--|\*\*|\/\/|\+|-|\*|\/)?(.*)$/);
  if (!operatorMatch) return null;

  const prefix = operatorMatch[1] ?? '';
  const rest = operatorMatch[2] ?? '';
  if (!rest) return null;

  if (flattenedCommands) {
    const commands = Object.values(flattenedCommands).sort((a, b) => b.shortcut.length - a.shortcut.length);

    for (const command of commands) {
      if (!rest.startsWith(command.shortcut)) continue;

      const value = rest.slice(command.shortcut.length);
      if (command.hasValue === false) {
        if (value === '') return { prefix, param: command.shortcut, value: '' };
        continue;
      }

      return { prefix, param: command.shortcut, value };
    }
  }

  const fallbackMatch = rest.match(/^([A-Za-z]+(?::[A-Za-z]+)?)(.*)$/);
  if (!fallbackMatch) return null;

  return { prefix, param: fallbackMatch[1], value: fallbackMatch[2] ?? '' };
}

function composeTokenWithContext(contextTokens: string[], nextToken: string) {
  if (contextTokens.length === 0) return nextToken;

  const tokens = [...contextTokens];
  const last = tokens[tokens.length - 1];
  if (parseOriginToken(last)) {
    tokens[tokens.length - 1] = `${last}${nextToken}`;
    return tokens.join(' ');
  }

  tokens.push(nextToken);
  return tokens.join(' ');
}

function getCommandExamples(shortcut: string) {
  const examples: Record<string, Array<{ token: string; help: string }>> = {
    w: [
      { token: 'w100', help: 'Set width to 100' },
      { token: 'w50%', help: 'Set width to 50% of parent' },
      { token: '+w8', help: 'Increase width by 8' },
      { token: '++w8+2', help: 'Progressive width increase' },
    ],
    h: [
      { token: 'h100', help: 'Set height to 100' },
      { token: 'h200%', help: 'Set height to 200% of parent' },
      { token: '+h8', help: 'Increase height by 8' },
      { token: '++h8+2', help: 'Progressive height increase' },
    ],
    wh: [
      { token: 'wh120,80', help: 'Set width and height' },
      { token: 'wh80%,50%', help: 'Set width and height by parent percentages' },
      { token: '+wh8', help: 'Increase size by 8' },
    ],
    fit: [
      { token: 'fit', help: 'Fit to parent width and height' },
      { token: 'fitw', help: 'Fit to parent width only' },
      { token: 'fith', help: 'Fit to parent height only' },
    ],
    fill: [
      { token: 'fill', help: 'Set auto-layout fill on both axes' },
      { token: 'fillw', help: 'Set auto-layout fill width' },
      { token: 'fillh', help: 'Set auto-layout fill height' },
    ],
    hug: [
      { token: 'hug', help: 'Set auto-layout hug on both axes' },
      { token: 'hugw', help: 'Set auto-layout hug width' },
      { token: 'hugh', help: 'Set auto-layout hug height' },
    ],
    op: [
      { token: 'op80', help: 'Set opacity to 80%' },
    ],
    rot: [
      { token: 'rot45', help: 'Set rotation to 45 degrees' },
      { token: 'rot45deg', help: 'Explicit rotation unit' },
    ],
    ls: [
      { token: 'ls2', help: 'Set letter spacing to 2' },
      { token: 'ls2px', help: 'Letter spacing in px' },
      { token: 'ls4%', help: 'Letter spacing in %' },
    ],
    lh: [
      { token: 'lh120', help: 'Set line height to 120' },
      { token: 'lh120%', help: 'Line height in %' },
      { token: 'lh16px', help: 'Line height in px' },
    ],
    dup: [
      { token: 'dup3', help: 'Duplicate selection 3 times' },
      { token: 'dup1', help: 'Duplicate once' },
    ],
    f: [
      { token: 'fFF6600', help: 'Replace fill with hex color' },
      { token: 'f#1A73E8', help: 'Replace fill with #hex color' },
    ],
    x: [
      { token: 'x100', help: 'Set x position' },
      { token: '+x16', help: 'Move right by 16' },
    ],
    y: [
      { token: 'y100', help: 'Set y position' },
      { token: '+y16', help: 'Move down by 16' },
    ],
    r: [
      { token: 'r8', help: 'Set corner radius to 8' },
      { token: '+r2', help: 'Increase corner radius by 2' },
    ],
    p: [
      { token: 'p16', help: 'Set all padding to 16' },
      { token: 'px24', help: 'Set horizontal padding to 24' },
    ],
    st: [
      { token: 'st2', help: 'Set stroke width to 2' },
      { token: 'stx1', help: 'Set horizontal stroke to 1' },
    ],
    gap: [
      { token: 'gap16', help: 'Set auto-layout gap to 16' },
      { token: 'gapx24', help: 'Set horizontal gap to 24' },
    ],
  };

  return examples[shortcut] ?? [];
}

function invalidValueHint(command: PropItem) {
  switch (command.shortcut) {
    case 'f':
      return `Use a hex color (e.g. fFF6600 or f#1A73E8)`;
    case 'dup':
      return `Use a whole number (e.g. dup3)`;
    case 'op':
      return `Use 0-100 with optional % (e.g. op80 or op80%)`;
    case 'rot':
      return `Use a number with optional deg (e.g. rot45 or rot45deg)`;
    case 'w':
    case 'h':
      return `Use number or % (e.g. ${command.shortcut}100, ${command.shortcut}50%)`;
    case 'wh':
      return `Use number, %, or width,height (e.g. wh120, wh80,50%)`;
    case 'fit':
    case 'fill':
    case 'hug':
      return `Use optional axis value: empty, w, or h (e.g. ${command.shortcut}, ${command.shortcut}w, ${command.shortcut}h)`;
    case 'ls':
    case 'lh':
      return `Use number with optional px/% (e.g. ${command.shortcut}16px)`;
    default:
      return `Enter a valid value (e.g. ${command.shortcut}100)`;
  }
}

function displayUnitForCommand(command: PropItem) {
  if (command.unit && command.unit !== 'hex') return command.unit;
  if (['f', 'dup'].includes(command.shortcut)) return '';
  if (command.hasValue) return 'px';
  return '';
}

function getAlternateUnitsForCommand(command: PropItem, explicitUnit: string, prefix: string) {
  if (explicitUnit) return [];
  if (prefix !== '') return [];

  const defaultUnit = displayUnitForCommand(command);
  if (!defaultUnit) return [];

  const validUnits = allowedUnitsForCommand(command.shortcut);
  if (validUnits.length <= 1) return [];

  return validUnits.filter((unit) => unit !== defaultUnit);
}

function getLikelyNextShortcuts(previousCommand?: string) {
  const fallback = ['w', 'h', 'fit', 'fill', 'hug', 'x', 'y', 'r', 'f', 'op', 'rot', 'p', 'st', 'gap'];
  if (!previousCommand) return fallback;

  if (['w', 'h', 'wh', 'sc:w', 'sc:h'].includes(previousCommand)) return ['fit', 'fill', 'hug', 'x', 'y', 'r', 'f', 'op', 'rot'];
  if (['fit', 'fill', 'hug'].includes(previousCommand)) return ['w', 'h', 'x', 'y', 'r', 'f'];
  if (['x', 'y'].includes(previousCommand)) return ['w', 'h', 'r', 'f', 'op'];
  if (previousCommand === 'f') return ['op', 'st', 'r', 'w', 'h'];
  if (['r', 'st', 'p', 'gap'].includes(previousCommand)) return ['f', 'op', 'w', 'h'];
  if (['op', 'rot'].includes(previousCommand)) return ['w', 'h', 'x', 'y', 'f'];

  return fallback;
}

function selectDiverseCandidates(candidates: SuggestionCandidate[], limit = 12): Suggestion[] {
  const byData = new Map<string, SuggestionCandidate>();
  for (const candidate of candidates) {
    const existing = byData.get(candidate.data);
    if (!existing || candidate.score > existing.score) {
      byData.set(candidate.data, candidate);
    }
  }

  const deduped = Array.from(byData.values()).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const quotas: Record<CandidateBucket, number> = { exact: 5, example: 3, next: 3, error: 1 };
  const picked: SuggestionCandidate[] = [];

  for (const bucket of ['exact', 'example', 'next', 'error'] as CandidateBucket[]) {
    for (const candidate of deduped) {
      if (picked.length >= limit) break;
      if (candidate.bucket !== bucket) continue;
      if (picked.filter((entry) => entry.bucket === bucket).length >= quotas[bucket]) continue;
      if (picked.some((entry) => entry.data === candidate.data)) continue;
      picked.push(candidate);
    }
  }

  for (const candidate of deduped) {
    if (picked.length >= limit) break;
    if (picked.some((entry) => entry.data === candidate.data)) continue;
    picked.push(candidate);
  }

  return picked.map((candidate) => ({ name: candidate.name, data: candidate.data }));
}

function buildNextCommandSuggestions(
  flattenedCommands: Record<string, PropItem>,
  contextTokens: string[],
  previousCommand?: string
) {
  const suggestions: SuggestionCandidate[] = [];
  const nextShortcuts = getLikelyNextShortcuts(previousCommand);

  for (let i = 0; i < nextShortcuts.length; i++) {
    const shortcut = nextShortcuts[i];
    const command = flattenedCommands[shortcut];
    if (!command || !command.action) continue;

    const example = getCommandExamples(shortcut)[0];
    const token = command.hasValue ? (example?.token ?? `${shortcut}100`) : shortcut;
    const composed = composeTokenWithContext(contextTokens, token);
    suggestions.push({
      name: `${composed} - Next: ${example?.help ?? command.name}`,
      data: composed,
      score: 80 - i,
      bucket: 'next',
    });
  }

  return selectDiverseCandidates(suggestions, 10);
}

function buildPendingValueSuggestions(command: PropItem, contextTokens: string[]) {
  const examples = getCommandExamples(command.shortcut);
  if (examples.length === 0) return [];

  const suggestions: SuggestionCandidate[] = [];
  for (let i = 0; i < Math.min(examples.length, 3); i++) {
    const example = examples[i];
    const composed = composeTokenWithContext(contextTokens, example.token);
    suggestions.push({
      name: `${composed} - ${example.help}`,
      data: composed,
      score: 96 - i,
      bucket: 'example',
    });
  }

  return selectDiverseCandidates(suggestions, 8);
}

function buildErrorSuggestion(query: string, message: string): Suggestion[] {
  return [
    {
      name: `${query} - Error: ${message}`,
      data: query,
    },
  ];
}

function buildPendingValueRecoverySuggestions(
  command: PropItem,
  contextTokens: string[],
  nextToken: string
): Suggestion[] {
  const examples = getCommandExamples(command.shortcut);
  if (examples.length === 0) {
    return buildErrorSuggestion(
      composeTokenWithContext(contextTokens, `${command.shortcut} ${nextToken}`),
      `${command.shortcut} needs a value before ${nextToken}`
    );
  }

  const recovery: SuggestionCandidate[] = [];
  for (let i = 0; i < Math.min(examples.length, 3); i++) {
    const example = examples[i];
    const composed = composeTokenWithContext(contextTokens, `${example.token} ${nextToken}`);
    recovery.push({
      name: `${composed} - ${example.help}, then continue with ${nextToken}`,
      data: composed,
      score: 96 - i,
      bucket: 'example',
    });
  }

  const query = composeTokenWithContext(contextTokens, `${command.shortcut} ${nextToken}`);
  recovery.push({
    name: `${query} - Error: ${command.shortcut} needs a value before ${nextToken}`,
    data: query,
    score: 70,
    bucket: 'error',
  });

  return selectDiverseCandidates(recovery, 8);
}

function isKnownCommandToken(token: string, flattenedCommands: Record<string, PropItem>) {
  const parsed = splitToken(token, flattenedCommands);
  if (!parsed) return false;

  const { prefix, param } = parsed;
  const directPrefixedShortcut = `${prefix}${param}`;
  const directPrefixedCommand = prefix ? flattenedCommands[directPrefixedShortcut] : undefined;
  const key = directPrefixedCommand ? directPrefixedShortcut : param;
  if (key in flattenedCommands) return true;

  for (const command in flattenedCommands) {
    if (command.startsWith(param)) return true;
  }

  return false;
}

function isOperatorOnlyToken(token: string) {
  return /^(\+\+|--|\*\*|\/\/|\+|-|\*|\/)$/.test(token.trim());
}

export default function getSuggestions({ query }: getSuggestionsProps) {
  const flattenedCommands = flattenCommands(propList, {});

  if (!query) return [];

  const values = query
    .split(' ')
    .flatMap((value) => splitOriginPrefixedToken(value))
    .map((value) => normalizeScopedScaleToken(value))
    .filter((value) => value.trim() !== '');
  if (query.endsWith(' ')) values.push('');
  if (values.length === 0) return [];
  const lastToken = values[values.length - 1];

  if (lastToken !== '' && isOriginQueryToken(lastToken)) {
    return buildOriginSuggestions(values, lastToken);
  }

  let suggestionRow: BindedCommand[] = [];
  let activeOrigin: TransformOrigin | null = null;
  const contextTokens = values.slice(0, values.length - 1);

  for (let i = 0; i < contextTokens.length; i++) {
    const token = contextTokens[i];
    if (token.trim() === '') continue;

    const parsedOrigin = parseOriginToken(token);
    if (parsedOrigin) {
      activeOrigin = parsedOrigin;
      continue;
    }

    const parsed = splitToken(token, flattenedCommands);
    if (!parsed) {
      return buildErrorSuggestion(query, `Invalid command token "${token}"`);
    }

    const { prefix, param, value: paramVal } = parsed;
    const directPrefixedShortcut = `${prefix}${param}`;
    const directPrefixedCommand = prefix ? flattenedCommands[directPrefixedShortcut] : undefined;
    const key = directPrefixedCommand ? directPrefixedShortcut : param;
    if (!(key in flattenedCommands)) {
      return buildErrorSuggestion(query, `Invalid command "${param}"`);
    }

    const contextCommand = flattenedCommands[key];
    if (contextCommand.hasValue && paramVal === '') {
      const priorContext = contextTokens.slice(0, i).filter(Boolean);
      const nextToken = values[i + 1] ?? '';
      if (nextToken) {
        if (!isKnownCommandToken(nextToken, flattenedCommands)) {
          const pending = buildPendingValueSuggestions(contextCommand, priorContext);
          const error = buildErrorSuggestion(query, `Invalid command "${nextToken}"`);
          return [...error, ...pending];
        }
        return buildPendingValueRecoverySuggestions(contextCommand, priorContext, nextToken);
      }
      return buildPendingValueSuggestions(contextCommand, priorContext);
    }

    suggestionRow.push({
      command: contextCommand,
      value: paramVal,
      prefix: directPrefixedCommand ? '' : prefix,
    });
  }

  if (lastToken === '') {
    const previous = suggestionRow.length > 0 ? suggestionRow[suggestionRow.length - 1] : undefined;
    if (previous && previous.command.hasValue && previous.value === '') {
      const baseContext = contextTokens.filter(Boolean).slice(0, -1);
      return buildPendingValueSuggestions(previous.command, baseContext);
    }

    const previousCommand = previous?.command.shortcut;
    return buildNextCommandSuggestions(flattenedCommands, contextTokens.filter(Boolean), previousCommand);
  } else {
    const parsedLast = splitToken(lastToken, flattenedCommands);
    if (!parsedLast) {
      if (isOperatorOnlyToken(lastToken)) {
        return buildErrorSuggestion(query, `Use operator with a command (e.g. ++h8 or ++w8+2)`);
      }
      return buildErrorSuggestion(query, `Invalid token "${lastToken}"`);
    }

    const { prefix, param, value: paramVal } = parsedLast;
    const directPrefixedShortcut = `${prefix}${param}`;
    const directPrefixedCommand = prefix ? flattenedCommands[directPrefixedShortcut] : undefined;

    if (directPrefixedCommand) {
      suggestionRow.push({
        command: directPrefixedCommand,
        value: paramVal,
        prefix: '',
      });
    } else {
      suggestionRow.push({
        command: { name: '', shortcut: param, hasValue: true },
        value: paramVal,
        prefix,
      });
    }
  }

  return generateSuggestions(suggestionRow, flattenedCommands, activeOrigin, contextTokens.filter(Boolean));
}

function generateSuggestions(
  suggestionRow: BindedCommand[],
  flattenedCommands: Record<string, PropItem>,
  activeOrigin: TransformOrigin | null,
  contextTokens: string[]
): Suggestion[] {
  const candidates: SuggestionCandidate[] = [];
  const suggestionCommands: BindedCommand[][] = [];

  if (suggestionRow.length === 0) return [];

  const lastItem: BindedCommand = suggestionRow[suggestionRow.length - 1];
  const commandVariants: BindedCommand[] = getSuggestedCommands(lastItem, flattenedCommands);

  for (const commandVariant of commandVariants) {
    suggestionCommands.push([...suggestionRow.slice(0, suggestionRow.length - 1), commandVariant]);
  }

  for (const suggestionCommandList of suggestionCommands) {
    const lastCommand = suggestionCommandList[suggestionCommandList.length - 1];

    let lastMessage = '';
    const alternateUnitCandidates: Array<{ renderedValue: string; unitIndex: number }> = [];
    const { value, command } = lastCommand;
    let hasError = false;

    if (command.hasValue) {
      if (lastCommand.value !== '') {
        const range = parseRangeValue(value);
        const rangeExpression = parseRangeExpression(value);
        const scalar = parseScalarValue(value);
        const pairValue = command.shortcut === 'wh' && isPairNumericValue(value, ['px', '%']);
        const axisValue = isAxisModeCommand(command) && isAxisValue(value);

        const supportsRange = Boolean(command.supportsModifiers);
        const requiresUnitlessScalar = lastCommand.prefix !== '';
        const isValidScalarValue =
          scalar !== null &&
          (scalar.num >= 0 || command.allowsNegative === true) &&
          (scalar.progressionOp === null || ['++', '--', '**', '//'].includes(lastCommand.prefix)) &&
          (!requiresUnitlessScalar || scalar.unit === '') &&
          isScalarAllowedForCommand(command, value, scalar.unit);
        const isValidAxisValue = axisValue && lastCommand.prefix === '';
        const isValidValue =
          (supportsRange && range !== null) ||
          (supportsRange && rangeExpression !== null && isSequentialPrefix(lastCommand.prefix)) ||
          pairValue ||
          isValidAxisValue ||
          isValidScalarValue;

        if (hasMalformedRangeValue(value)) {
          lastMessage = `Invalid range format. Use start..end (e.g. ${command.shortcut}100..300)`;
          hasError = true;
        } else if (hasProgressionSuffix(value) && !isSequentialPrefix(lastCommand.prefix)) {
          lastMessage = `Progression needs sequential operators (++, --, **, //)`;
          hasError = true;
        } else if (isValidValue) {
          const defaultUnit = displayUnitForCommand(command);
          if (range) {
            lastMessage = formatRangeMessage(lastCommand.prefix, command, range.start, range.end, defaultUnit);
          } else if (pairValue) {
            lastMessage = formatOperatorMessage(lastCommand.prefix, command, value);
          } else if (rangeExpression) {
            lastMessage = formatOperatorMessage(lastCommand.prefix, command, value);
          } else if (isValidAxisValue) {
            lastMessage = formatAxisMessage(lastCommand.prefix, command, value);
          } else {
            const renderedValue = renderScalarValue(value, defaultUnit, lastCommand.prefix);
            lastMessage = formatOperatorMessage(lastCommand.prefix, command, renderedValue);

            const alternateUnits = getAlternateUnitsForCommand(command, scalar?.unit ?? '', lastCommand.prefix);
            for (let i = 0; i < alternateUnits.length; i++) {
              const altUnit = alternateUnits[i];
              const altRenderedValue = renderScalarValue(value, altUnit, lastCommand.prefix);
              alternateUnitCandidates.push({ renderedValue: altRenderedValue, unitIndex: i });
            }
          }
        } else {
          lastMessage = invalidValueHint(command);
          hasError = true;
        }
      } else {
        if (isAxisModeCommand(command) && lastCommand.prefix === '') {
          lastMessage = formatAxisMessage(lastCommand.prefix, command, '');
        } else {
          lastMessage = formatOperatorPlaceholder(lastCommand.prefix, command);
        }
      }
    } else {
      if (command.message) lastMessage = command.message;
      else lastMessage = command.name;
    }
    lastMessage = withOriginHint(lastMessage, command, activeOrigin);

    const suggestionToken = `${lastCommand.prefix}${command.shortcut}${command.hasValue ? value : ''}`;
    const composed = composeTokenWithContext(contextTokens, suggestionToken);
    const isExactShortcut = command.shortcut === lastItem.command.shortcut;
    const scoreBase =
      (isExactShortcut ? 95 : 72 - Math.max(0, command.shortcut.length - lastItem.command.shortcut.length)) +
      (hasError ? -50 : 0);
    candidates.push({
      name: `${composed} - ${lastMessage}`,
      data: composed,
      score: scoreBase,
      bucket: hasError ? 'error' : 'exact',
    });

    for (const alt of alternateUnitCandidates) {
      const altSuggestionToken = `${lastCommand.prefix}${command.shortcut}${alt.renderedValue}`;
      const altComposed = composeTokenWithContext(contextTokens, altSuggestionToken);
      const altMessage = withOriginHint(
        formatOperatorMessage(lastCommand.prefix, command, alt.renderedValue),
        command,
        activeOrigin
      );

      candidates.push({
        name: `${altComposed} - ${altMessage}`,
        data: altComposed,
        score: scoreBase - 5 - alt.unitIndex,
        bucket: 'example',
      });
    }

    if (command.action) {
      const examples = getCommandExamples(command.shortcut);
      if (command.hasValue && (lastCommand.value === '' || hasError) && examples.length > 0) {
        for (let i = 0; i < Math.min(examples.length, 2); i++) {
          const example = examples[i];
          const composedExample = composeTokenWithContext(contextTokens, example.token);
          candidates.push({
            name: `${composedExample} - ${example.help}`,
            data: composedExample,
            score: scoreBase - 10 - i,
            bucket: 'example',
          });
        }
      }
    }
  }

  return selectDiverseCandidates(candidates);
}

function getSuggestedCommands(item: BindedCommand, flattenedCommands: Record<string, PropItem>) {
  const commands: BindedCommand[] = [];
  for (const command in flattenedCommands) {
    if (command.startsWith(item.command.shortcut)) {
      commands.push({ command: flattenedCommands[command], value: item.value, prefix: item.prefix });
    }
  }

  commands.sort((a, b) => {
    const aExact = a.command.shortcut === item.command.shortcut ? 1 : 0;
    const bExact = b.command.shortcut === item.command.shortcut ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;
    return a.command.shortcut.length - b.command.shortcut.length;
  });

  return commands.slice(0, 24);
}

export async function getDefaultSuggestions() {
  const history = await getHistory();
  const suggestions: { name: string; data: string }[] = [];

  for (const historySuggestion of history) {
    const suggestionText = historySuggestion.map((item) => item.param + item.value).join(' ');
    suggestions.push({
      name: suggestionText,
      data: suggestionText,
    });
  }

  return suggestions;
}
