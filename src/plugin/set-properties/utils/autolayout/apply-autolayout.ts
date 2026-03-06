import notifyError, { notifyWarning } from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';

interface ApplyAutolayoutProps {
  param: string;
  nodes: readonly SceneNode[];
}

type LayoutDirection = 'HORIZONTAL' | 'VERTICAL';

type AutoLayoutContainerNode = SceneNode &
  ChildrenMixin &
  DimensionAndPositionMixin &
  {
    layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
    itemSpacing: number;
    paddingLeft: number;
    paddingRight: number;
    paddingTop: number;
    paddingBottom: number;
  };

interface ChildMetrics {
  node: SceneNode;
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

function isConvertibleAutoLayoutContainer(node: SceneNode): node is AutoLayoutContainerNode {
  return (
    'children' in node &&
    'layoutMode' in node &&
    'itemSpacing' in node &&
    'paddingLeft' in node &&
    'paddingRight' in node &&
    'paddingTop' in node &&
    'paddingBottom' in node &&
    'width' in node &&
    'height' in node
  );
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function clampNonNegative(value: number) {
  return Math.max(0, value);
}

function asVisibleUnlockedSceneNode(node: SceneNode): SceneNode | null {
  if ('visible' in node && !node.visible) return null;
  if ('locked' in node && node.locked) return null;
  return node;
}

function collectChildMetrics(container: AutoLayoutContainerNode): ChildMetrics[] {
  const metrics: ChildMetrics[] = [];
  for (const child of container.children) {
    const visibleChild = asVisibleUnlockedSceneNode(child as SceneNode);
    if (!visibleChild) continue;

    if (!('x' in visibleChild) || !('y' in visibleChild) || !('width' in visibleChild) || !('height' in visibleChild)) {
      continue;
    }

    const left = visibleChild.x;
    const top = visibleChild.y;
    const right = left + visibleChild.width;
    const bottom = top + visibleChild.height;
    metrics.push({
      node: visibleChild,
      left,
      right,
      top,
      bottom,
      centerX: left + visibleChild.width / 2,
      centerY: top + visibleChild.height / 2,
    });
  }

  return metrics;
}

function getCenterSpread(metrics: ChildMetrics[]) {
  if (metrics.length === 0) return { x: 0, y: 0 };

  const xs = metrics.map((entry) => entry.centerX);
  const ys = metrics.map((entry) => entry.centerY);

  return {
    x: Math.max(...xs) - Math.min(...xs),
    y: Math.max(...ys) - Math.min(...ys),
  };
}

function getPrimaryGaps(metrics: ChildMetrics[], direction: LayoutDirection) {
  const ordered = [...metrics].sort((a, b) =>
    direction === 'HORIZONTAL' ? a.left - b.left || a.top - b.top : a.top - b.top || a.left - b.left
  );

  const gaps: number[] = [];
  for (let index = 0; index < ordered.length - 1; index++) {
    const current = ordered[index]!;
    const next = ordered[index + 1]!;
    const gap = direction === 'HORIZONTAL' ? next.left - current.right : next.top - current.bottom;
    gaps.push(gap);
  }

  return { ordered, gaps };
}

function getCrossAxisOffsets(metrics: ChildMetrics[], direction: LayoutDirection) {
  if (direction === 'HORIZONTAL') {
    return metrics.map((entry) => entry.top);
  }

  return metrics.map((entry) => entry.left);
}

function getAxisScore(metrics: ChildMetrics[], direction: LayoutDirection) {
  if (metrics.length < 2) return Number.POSITIVE_INFINITY;

  const { gaps } = getPrimaryGaps(metrics, direction);
  const offsets = getCrossAxisOffsets(metrics, direction);
  const offsetMedian = median(offsets);
  const offsetDeviation = median(offsets.map((value) => Math.abs(value - offsetMedian)));
  const gapMedian = median(gaps);
  const gapDeviation = median(gaps.map((gap) => Math.abs(gap - gapMedian)));

  const normalizedGapDeviation = gapMedian === 0 ? gapDeviation : gapDeviation / Math.abs(gapMedian);
  const normalizedOffsetDeviation = offsetMedian === 0 ? offsetDeviation : offsetDeviation / Math.abs(offsetMedian);

  return normalizedGapDeviation + normalizedOffsetDeviation;
}

function inferDirection(metrics: ChildMetrics[]): LayoutDirection {
  const spread = getCenterSpread(metrics);
  if (spread.x > spread.y * 1.2) return 'HORIZONTAL';
  if (spread.y > spread.x * 1.2) return 'VERTICAL';

  const horizontalScore = getAxisScore(metrics, 'HORIZONTAL');
  const verticalScore = getAxisScore(metrics, 'VERTICAL');
  if (horizontalScore < verticalScore) return 'HORIZONTAL';
  return 'VERTICAL';
}

function inferItemSpacing(metrics: ChildMetrics[], direction: LayoutDirection): number {
  if (metrics.length < 2) return 0;
  const { gaps } = getPrimaryGaps(metrics, direction);
  if (gaps.length === 0) return 0;

  const gapMedian = median(gaps);
  const tolerance = Math.max(4, Math.abs(gapMedian) * 0.2);
  const isUniform = gaps.every((gap) => Math.abs(gap - gapMedian) <= tolerance);
  const targetGap = Math.round(gapMedian);

  if (!isUniform) {
    notifyWarning({
      type: ErrorType.UNSUPPORTED_PROP,
      message: 'Normalized uneven spacing while applying auto layout.',
    });
  }

  return targetGap;
}

function inferPadding(container: AutoLayoutContainerNode, metrics: ChildMetrics[]) {
  if (metrics.length === 0) {
    return { left: 0, right: 0, top: 0, bottom: 0 };
  }

  const minLeft = Math.min(...metrics.map((entry) => entry.left));
  const maxRight = Math.max(...metrics.map((entry) => entry.right));
  const minTop = Math.min(...metrics.map((entry) => entry.top));
  const maxBottom = Math.max(...metrics.map((entry) => entry.bottom));

  let left = clampNonNegative(Math.round(minLeft));
  let right = clampNonNegative(Math.round(container.width - maxRight));
  let top = clampNonNegative(Math.round(minTop));
  let bottom = clampNonNegative(Math.round(container.height - maxBottom));

  const tolerance = 4;
  if (Math.abs(left - right) <= tolerance) {
    const average = Math.round((left + right) / 2);
    left = average;
    right = average;
  }
  if (Math.abs(top - bottom) <= tolerance) {
    const average = Math.round((top + bottom) / 2);
    top = average;
    bottom = average;
  }

  return { left, right, top, bottom };
}

function getDirectionFromCommand(param: string): LayoutDirection | null {
  if (param === 'alx') return 'HORIZONTAL';
  if (param === 'aly') return 'VERTICAL';
  if (param === 'al') return null;
  return null;
}

export default function applyAutolayout({ param, nodes }: ApplyAutolayoutProps) {
  if (!['al', 'alx', 'aly'].includes(param)) {
    notifyError({
      type: ErrorType.INVALID_CMD,
      message: param,
    });
    return;
  }

  let appliedCount = 0;
  let skippedCount = 0;

  for (const node of nodes) {
    if (!isConvertibleAutoLayoutContainer(node)) {
      skippedCount++;
      continue;
    }

    try {
      const metrics = collectChildMetrics(node);
      const forcedDirection = getDirectionFromCommand(param);
      const targetDirection = forcedDirection ?? (metrics.length >= 2 ? inferDirection(metrics) : 'VERTICAL');
      const spacing = inferItemSpacing(metrics, targetDirection);
      const padding = inferPadding(node, metrics);

      node.layoutMode = targetDirection;
      node.itemSpacing = spacing;
      node.paddingLeft = padding.left;
      node.paddingRight = padding.right;
      node.paddingTop = padding.top;
      node.paddingBottom = padding.bottom;
      appliedCount++;
    } catch (error) {
      skippedCount++;
      notifyWarning({
        type: ErrorType.UNSUPPORTED_PROP,
        message: `Could not apply auto layout on ${node.name}: ${(error as Error).message}`,
      });
    }
  }

  if (appliedCount === 0) {
    notifyError({
      type: ErrorType.UNSUPPORTED_PROP,
      message: 'Auto layout could not be applied to the current selection.',
    });
    return;
  }

  if (skippedCount > 0) {
    notifyWarning({
      type: ErrorType.UNSUPPORTED_PROP,
      message: `Skipped ${skippedCount} node(s) while applying auto layout.`,
    });
  }
}
