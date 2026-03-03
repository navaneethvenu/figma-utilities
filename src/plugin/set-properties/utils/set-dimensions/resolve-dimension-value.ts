import { parseNumberWithOptionalUnit } from '../node-safety';

type Axis = 'width' | 'height';

function getParentDimension(node: SceneNode, axis: Axis) {
  const parent = node.parent;
  if (!parent || parent === figma.currentPage || !('width' in parent) || !('height' in parent)) {
    return null;
  }

  return axis === 'width' ? parent.width : parent.height;
}

export function resolveDimensionValue(value: string, node: SceneNode, axis: Axis) {
  const parentDimension = getParentDimension(node, axis);

  const numeric = parseNumberWithOptionalUnit(value, ['px', '%']);
  if (numeric === null) return null;

  if (!value.trim().endsWith('%')) {
    return numeric;
  }

  if (parentDimension === null) {
    return null;
  }

  return (parentDimension * numeric) / 100;
}
