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

function isSequentialPrefix(prefix: string) {
  return ['++', '--', '**', '//'].includes(prefix);
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

function allowedUnitsForCommand(shortcut: string) {
  if (shortcut === 'op') return ['%'];
  if (shortcut === 'rot') return ['deg'];
  if (shortcut === 'ls' || shortcut === 'lh') return ['px', '%'];
  return ['px'];
}

function isScalarAllowedForCommand(command: PropItem, value: string, scalarUnit: string) {
  if (command.shortcut === 'f') return /^#?[0-9a-fA-F]+$/.test(value);
  if (command.shortcut === 'dup') return /^\d+$/.test(value.trim());
  if (command.shortcut === 'wh' && value.includes(',')) return isPairNumericValue(value, ['px']);

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
      return `Set ${command.name} to ${renderedValue}`;
  }
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
      return `Set ${command.name} to (Enter Value)`;
  }
}

function renderScalarValue(raw: string, defaultUnit: string) {
  const parsed = parseScalarValue(raw);
  if (!parsed) return raw;

  const normalized = String(parsed.num);
  const withUnit = parsed.unit ? `${normalized}${parsed.unit}` : `${normalized}${defaultUnit}`.trim();
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

function splitToken(token: string) {
  const match = token.match(/^(\+\+|--|\*\*|\/\/|\+|-|\*|\/)?([A-Za-z]+(?::[A-Za-z]+)?)(.*)$/);
  if (!match) return null;
  return { prefix: match[1] ?? '', param: match[2], value: match[3] ?? '' };
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

  for (const token of contextTokens) {
    if (token.trim() === '') continue;

    const parsedOrigin = parseOriginToken(token);
    if (parsedOrigin) {
      activeOrigin = parsedOrigin;
      continue;
    }

    const parsed = splitToken(token);
    if (!parsed) {
      return [];
    }

    const { prefix, param, value: paramVal } = parsed;
    const directPrefixedShortcut = `${prefix}${param}`;
    const directPrefixedCommand = prefix ? flattenedCommands[directPrefixedShortcut] : undefined;
    const key = directPrefixedCommand ? directPrefixedShortcut : param;
    if (!(key in flattenedCommands)) return [];

    suggestionRow.push({
      command: flattenedCommands[key],
      value: paramVal,
      prefix: directPrefixedCommand ? '' : prefix,
    });
  }

  if (lastToken === '') {
    const wildcardCommand: PropItem = { name: '', shortcut: '', hasValue: true };
    suggestionRow.push({
      command: wildcardCommand,
      value: '',
      prefix: '',
    });
  } else {
    const parsedLast = splitToken(lastToken);
    if (!parsedLast) return [];

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
  let suggestions: Suggestion[] = [];
  const suggestionCommands: BindedCommand[][] = [];

  if (suggestionRow.length === 0) return [];

  const lastItem: BindedCommand = suggestionRow[suggestionRow.length - 1];
  const commandVariants: BindedCommand[] = getSuggestedCommands(lastItem, flattenedCommands);

  for (const commandVariant of commandVariants) {
    suggestionCommands.push([...suggestionRow.slice(0, suggestionRow.length - 1), commandVariant]);
  }

  for (const suggestionCommandList of suggestionCommands) {
    let suggestionData: { name: string; data: string } = { name: '', data: '' };

    const lastCommand = suggestionCommandList[suggestionCommandList.length - 1];

    let lastMessage = '';
    const { value, command } = lastCommand;

    if (command.hasValue) {
      if (lastCommand.value !== '') {
        const range = parseRangeValue(value);
        const rangeExpression = parseRangeExpression(value);
        const scalar = parseScalarValue(value);
        const pairValue = command.shortcut === 'wh' && isPairNumericValue(value, ['px']);

        const supportsRange = Boolean(command.supportsModifiers);
        const isValidScalarValue =
          scalar !== null &&
          (scalar.num >= 0 || command.allowsNegative === true) &&
          (scalar.progressionOp === null || ['++', '--', '**', '//'].includes(lastCommand.prefix)) &&
          isScalarAllowedForCommand(command, value, scalar.unit);
        const isValidValue =
          (supportsRange && range !== null) ||
          (supportsRange && rangeExpression !== null && isSequentialPrefix(lastCommand.prefix)) ||
          pairValue ||
          isValidScalarValue;

        if (hasMalformedRangeValue(value)) {
          lastMessage = `Error: Invalid range format. Use start..end`;
        } else if (hasProgressionSuffix(value) && !isSequentialPrefix(lastCommand.prefix)) {
          lastMessage = `Error: Progression suffix requires sequential operators (++, --, **, //)`;
        } else if (isValidValue) {
          const defaultUnit = command.unit === undefined || command.unit === 'hex' ? '' : command.unit;
          if (range) {
            lastMessage = formatRangeMessage(lastCommand.prefix, command, range.start, range.end, defaultUnit);
          } else if (pairValue) {
            lastMessage = formatOperatorMessage(lastCommand.prefix, command, value);
          } else if (rangeExpression) {
            lastMessage = formatOperatorMessage(lastCommand.prefix, command, value);
          } else {
            const renderedValue = renderScalarValue(value, defaultUnit);
            lastMessage = formatOperatorMessage(lastCommand.prefix, command, renderedValue);
          }
        } else {
          lastMessage = `Error: ${command.name} cannot have invalid or negative values`;
        }
      } else lastMessage = formatOperatorPlaceholder(lastCommand.prefix, command);
    } else {
      if (command.message) lastMessage = command.message;
      else lastMessage = command.name;
    }
    lastMessage = withOriginHint(lastMessage, command, activeOrigin);

    const suggestionToken = `${lastCommand.prefix}${command.shortcut}${command.hasValue ? value : ''}`;
    const composed = composeTokenWithContext(contextTokens, suggestionToken);
    suggestionData.name = `${composed} - ${lastMessage}`;

    suggestionData.data = composed;
    if (command.action) {
      suggestions.push(suggestionData);
    }
  }

  return suggestions;
}

function getSuggestedCommands(item: BindedCommand, flattenedCommands: Record<string, PropItem>) {
  const commands: BindedCommand[] = [];
  for (const command in flattenedCommands) {
    if (command.startsWith(item.command.shortcut)) {
      commands.push({ command: flattenedCommands[command], value: item.value, prefix: item.prefix });
    }
  }
  return commands;
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
