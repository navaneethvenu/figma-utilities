import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';

type TextTransformMode = 'upper' | 'lower' | 'sentence' | 'title';
type ReplaceMode = 'first' | 'all';
type TextMutation = (input: string) => string;

interface TextTarget {
  node: TextNode;
  start: number;
  end: number;
}

const QUOTED = '"((?:\\\\.|[^"\\\\])*)"';
const SET_RE = new RegExp(`^t:?${QUOTED}$`);
const APPEND_RE = new RegExp(`^\\+t:?${QUOTED}$`);
const PREPEND_RE = new RegExp(`^pre:\\+t:?${QUOTED}$`);
const POST_APPEND_RE = new RegExp(`^post:\\+t:?${QUOTED}$`);
const REPLACE_FIRST_RE = new RegExp(`^t:?${QUOTED}=>${QUOTED}$`);
const REPLACE_ALL_RE = new RegExp(`^all:t:?${QUOTED}=>${QUOTED}$`);
const SPLIT_RE = new RegExp(`^split:?${QUOTED}$`);
const REPEAT_RE = /^\*t(\d+)$/;
const REGEX_LITERAL_RE = /^\/((?:\\.|[^/\\])*)\/([dgimsuy]*)$/;

function sortSelectionByLayerIndex(nodes: readonly SceneNode[]) {
  const groups = new Map<string, { parent: BaseNode & ChildrenMixin; nodes: SceneNode[] }>();
  const ordered: SceneNode[] = [];

  for (const node of nodes) {
    const parent = node.parent;
    if (!parent || !('children' in parent)) {
      ordered.push(node);
      continue;
    }

    if (!groups.has(parent.id)) groups.set(parent.id, { parent, nodes: [] });
    groups.get(parent.id)!.nodes.push(node);
  }

  for (const group of groups.values()) {
    group.nodes.sort((a, b) => group.parent.children.indexOf(a) - group.parent.children.indexOf(b));
    ordered.push(...group.nodes);
  }

  return ordered;
}

function asChildrenParent(node: BaseNode | null): (BaseNode & ChildrenMixin) | null {
  if (!node) return null;
  if (!('children' in node) || !('insertChild' in node)) return null;
  return node as BaseNode & ChildrenMixin;
}

function decodeEscapes(value: string) {
  let result = '';
  let escaped = false;
  for (const ch of value) {
    if (!escaped) {
      if (ch === '\\') {
        escaped = true;
      } else {
        result += ch;
      }
      continue;
    }

    switch (ch) {
      case 'n':
        result += '\n';
        break;
      case 'r':
        result += '\r';
        break;
      case 't':
        result += '\t';
        break;
      case '"':
        result += '"';
        break;
      case '\\':
        result += '\\';
        break;
      default:
        result += ch;
        break;
    }

    escaped = false;
  }

  if (escaped) result += '\\';
  return result;
}

function parseRegexPattern(from: string): RegExp | null {
  const regexMatch = from.match(REGEX_LITERAL_RE);
  if (!regexMatch) return null;

  const pattern = decodeEscapes(regexMatch[1]);
  const flags = regexMatch[2] ?? '';
  try {
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

function applyActualCase(value: string, mode: TextTransformMode): string {
  switch (mode) {
    case 'upper':
      return value.toLocaleUpperCase();
    case 'lower':
      return value.toLocaleLowerCase();
    case 'title':
      return value.replace(/\S+/g, (word) => {
        const [first = '', ...rest] = Array.from(word.toLocaleLowerCase());
        return `${first.toLocaleUpperCase()}${rest.join('')}`;
      });
    case 'sentence': {
      let shouldCapitalize = true;
      return Array.from(value.toLocaleLowerCase())
        .map((char) => {
          if (shouldCapitalize && /[A-Za-z]/.test(char)) {
            shouldCapitalize = false;
            return char.toLocaleUpperCase();
          }
          if (/[.!?]/.test(char)) shouldCapitalize = true;
          return char;
        })
        .join('');
    }
  }
}

async function loadFontsForTextNode(node: TextNode) {
  const fonts = new Map<string, FontName>();

  if (node.characters.length > 0) {
    const rangeFonts = node.getRangeAllFontNames(0, node.characters.length);
    for (const font of rangeFonts) {
      fonts.set(`${font.family}:::${font.style}`, font);
    }
  } else if (node.fontName !== figma.mixed) {
    const font = node.fontName as FontName;
    fonts.set(`${font.family}:::${font.style}`, font);
  }

  await Promise.all(Array.from(fonts.values()).map((font) => figma.loadFontAsync(font)));
}

function buildTargets(nodes: readonly SceneNode[]): { targets: TextTarget[]; skippedNonText: number } {
  const selectedRange = figma.currentPage.selectedTextRange;
  if (selectedRange) {
    return {
      targets: [
        {
          node: selectedRange.node,
          start: selectedRange.start,
          end: selectedRange.end,
        },
      ],
      skippedNonText: 0,
    };
  }

  const ordered = sortSelectionByLayerIndex(nodes);
  const textNodes = ordered.filter((node): node is TextNode => node.type === 'TEXT');

  return {
    targets: textNodes.map((node) => ({ node, start: 0, end: node.characters.length })),
    skippedNonText: ordered.length - textNodes.length,
  };
}

function applyOnTarget(target: TextTarget, mutate: TextMutation) {
  const { node, start, end } = target;
  const current = node.characters;
  const selected = current.slice(start, end);
  const next = mutate(selected);
  node.characters = `${current.slice(0, start)}${next}${current.slice(end)}`;
}

function normalizeRegexForMode(regex: RegExp, mode: ReplaceMode) {
  const flagsSet = new Set(regex.flags.split(''));
  if (mode === 'all') flagsSet.add('g');
  if (mode === 'first') flagsSet.delete('g');
  return new RegExp(regex.source, Array.from(flagsSet).join(''));
}

function buildReplaceMutation(fromRaw: string, toRaw: string, mode: ReplaceMode): TextMutation {
  const from = decodeEscapes(fromRaw);
  const to = decodeEscapes(toRaw);
  if (from === '') {
    throw new Error(`${ErrorType.INVALID_VAL}: replace "from" cannot be empty`);
  }

  const regex = parseRegexPattern(from);
  if (regex) {
    const normalized = normalizeRegexForMode(regex, mode);
    return (input: string) => input.replace(normalized, to);
  }

  if (mode === 'all') {
    return (input: string) => input.split(from).join(to);
  }

  return (input: string) => {
    const index = input.indexOf(from);
    if (index === -1) return input;
    return `${input.slice(0, index)}${to}${input.slice(index + from.length)}`;
  };
}

async function applyTextMutation(nodes: readonly SceneNode[], mutation: TextMutation, label: string) {
  const { targets, skippedNonText } = buildTargets(nodes);
  if (targets.length === 0) {
    throw new Error(`${ErrorType.UNSUPPORTED_PROP}: ${label} is only applicable on text nodes`);
  }

  for (const target of targets) {
    try {
      await loadFontsForTextNode(target.node);
      applyOnTarget(target, mutation);
    } catch {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Cannot update text on ${target.node.name}: required fonts are not loaded/available`,
      });
    }
  }

  if (skippedNonText > 0) {
    figma.notify(`${label}: skipped ${skippedNonText} unsupported node(s)`);
  }
}

async function applySplit(nodes: readonly SceneNode[], delimiterRaw: string) {
  const delimiter = decodeEscapes(delimiterRaw);
  if (delimiter === '') {
    throw new Error(`${ErrorType.INVALID_VAL}: split delimiter cannot be empty`);
  }

  const ordered = sortSelectionByLayerIndex(nodes);
  const textNodes = ordered.filter((node): node is TextNode => node.type === 'TEXT');
  const skippedNonText = ordered.length - textNodes.length;
  if (textNodes.length === 0) {
    throw new Error(`${ErrorType.UNSUPPORTED_PROP}: split is only applicable on text nodes`);
  }

  const nextSelection: SceneNode[] = [];
  for (const node of textNodes) {
    const segments = node.characters.split(delimiter);
    const parent = asChildrenParent(node.parent);
    const parentIsAutoLayout =
      parent !== null && 'layoutMode' in parent && parent.layoutMode !== 'NONE';
    const splitGap = 16;
    let nextX = node.x;
    const baseIndex = parent ? parent.children.indexOf(node) : -1;

    try {
      await loadFontsForTextNode(node);
      node.characters = segments[0] ?? '';
      nextSelection.push(node);
      if (!parentIsAutoLayout) {
        nextX = node.x + node.width + splitGap;
      }
    } catch {
      notifyError({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Cannot split text on ${node.name}: required fonts are not loaded/available`,
      });
      continue;
    }

    for (let i = 1; i < segments.length; i++) {
      try {
        const clone = node.clone();
        await loadFontsForTextNode(clone);
        clone.characters = segments[i];

        // Keep split clones under the same parent as the source node.
        if (parent && baseIndex >= 0) {
          const desiredIndex = Math.min(baseIndex + i, parent.children.length - 1);
          parent.insertChild(desiredIndex, clone);
        }

        nextSelection.push(clone);
        if (!parentIsAutoLayout) {
          clone.x = nextX;
          clone.y = node.y;
          nextX = clone.x + clone.width + splitGap;
        }
      } catch {
        notifyError({
          type: ErrorType.UNSUPPORTED_PROP,
          message: `Cannot create split segment on ${node.name}: required fonts are not loaded/available`,
        });
      }
    }
  }

  if (skippedNonText > 0) {
    figma.notify(`split: skipped ${skippedNonText} unsupported node(s)`);
  }
  if (nextSelection.length > 0) {
    figma.currentPage.selection = nextSelection;
  }
}

export default async function applyTextCommand(rawToken: string, nodes: readonly SceneNode[]) {
  const token = rawToken.trim();

  if (/^(upper|lower|sentence|title)$/i.test(token)) {
    const mode = token.toLowerCase() as TextTransformMode;
    await applyTextMutation(
      nodes,
      (value) => applyActualCase(value, mode),
      mode
    );

    const { targets } = buildTargets(nodes);
    for (const target of targets) {
      target.node.textCase = 'ORIGINAL';
    }
    return;
  }

  const repeatMatch = token.match(REPEAT_RE);
  if (repeatMatch) {
    const count = Number(repeatMatch[1]);
    if (!Number.isInteger(count) || count <= 0) {
      throw new Error(`${ErrorType.INVALID_VAL}: ${token}`);
    }
    await applyTextMutation(nodes, (value) => value.repeat(count), 't');
    return;
  }

  const splitMatch = token.match(SPLIT_RE);
  if (splitMatch) {
    await applySplit(nodes, splitMatch[1]);
    return;
  }

  if (token === 'split' || token === 'split:') {
    await applySplit(nodes, ' ');
    return;
  }

  const prependMatch = token.match(PREPEND_RE);
  if (prependMatch) {
    const payload = decodeEscapes(prependMatch[1]);
    await applyTextMutation(nodes, (value) => `${payload}${value}`, '+t');
    return;
  }

  const appendMatch = token.match(APPEND_RE) ?? token.match(POST_APPEND_RE);
  if (appendMatch) {
    const payload = decodeEscapes(appendMatch[1]);
    if (payload === '') return;
    await applyTextMutation(nodes, (value) => `${value}${payload}`, '+t');
    return;
  }

  const replaceAllMatch = token.match(REPLACE_ALL_RE);
  if (replaceAllMatch) {
    const mutation = buildReplaceMutation(replaceAllMatch[1], replaceAllMatch[2], 'all');
    await applyTextMutation(nodes, mutation, 't');
    return;
  }

  const replaceFirstMatch = token.match(REPLACE_FIRST_RE);
  if (replaceFirstMatch) {
    const mutation = buildReplaceMutation(replaceFirstMatch[1], replaceFirstMatch[2], 'first');
    await applyTextMutation(nodes, mutation, 't');
    return;
  }

  const setMatch = token.match(SET_RE);
  if (setMatch) {
    const payload = decodeEscapes(setMatch[1]);
    await applyTextMutation(nodes, () => payload, 't');
    return;
  }

  throw new Error(`${ErrorType.INVALID_CMD}: ${token}`);
}
