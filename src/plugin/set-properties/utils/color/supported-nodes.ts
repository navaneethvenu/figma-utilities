import { figjamNodes, FigjamNodes } from '../figjam-nodes';
import { sceneNode } from '../scene-node';

type UnsupportedNodes =
  | SliceNode
  | GroupNode
  | BooleanOperationNode
  | SectionNode
  | TransformGroupNode
  | SlideRowNode
  | SlideGridNode
  | InteractiveSlideElementNode
  | FigjamNodes;

const unsupportedNodes: NodeType[] = [
  'SLICE',
  'GROUP',
  'BOOLEAN_OPERATION',
  'SECTION',
  'TRANSFORM_GROUP',
  'SLIDE_ROW',
  'SLIDE_GRID',
  'INTERACTIVE_SLIDE_ELEMENT',
  ...figjamNodes,
];

export type SupportedNodes = Exclude<SceneNode, UnsupportedNodes>;

export const supportedNodes: NodeType[] = sceneNode.filter((nodeType) => !unsupportedNodes.includes(nodeType));
