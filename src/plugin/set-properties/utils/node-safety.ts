export type AutoLayoutParent = BaseNode & ChildrenMixin & { layoutMode: 'HORIZONTAL' | 'VERTICAL' | 'NONE' };

export function isAutoLayoutParent(parent: BaseNode & ChildrenMixin | null): parent is AutoLayoutParent {
  return !!parent && 'layoutMode' in parent && parent.layoutMode !== 'NONE';
}

function supportsAutoLayoutChildPositioning(node: SceneNode): node is SceneNode & AutoLayoutChildrenMixin {
  return 'layoutPositioning' in node;
}

export function ensureAbsolutePositioning(node: SceneNode): boolean {
  if (!supportsAutoLayoutChildPositioning(node)) {
    return false;
  }

  const parent = node.parent;
  if (!isAutoLayoutParent(parent)) {
    return false;
  }

  if (node.layoutPositioning !== 'ABSOLUTE') {
    node.layoutPositioning = 'ABSOLUTE';
    return true;
  }

  return false;
}

export function getWorldPosition(node: SceneNode) {
  return {
    x: node.absoluteTransform[0][2],
    y: node.absoluteTransform[1][2],
  };
}

export function worldToLocal(parent: BaseNode & ChildrenMixin | null, worldX: number, worldY: number) {
  if (!parent || !('absoluteTransform' in parent)) {
    return { x: worldX, y: worldY };
  }

  const [[a, c, e], [b, d, f]] = parent.absoluteTransform;
  const determinant = a * d - b * c;

  if (determinant === 0) {
    return null;
  }

  return {
    x: (d * (worldX - e) - c * (worldY - f)) / determinant,
    y: (-b * (worldX - e) + a * (worldY - f)) / determinant,
  };
}

export function setNodeWorldPosition(node: SceneNode, worldX: number, worldY: number) {
  const local = worldToLocal(node.parent, worldX, worldY);
  if (!local) {
    return false;
  }

  node.x = local.x;
  node.y = local.y;
  return true;
}
