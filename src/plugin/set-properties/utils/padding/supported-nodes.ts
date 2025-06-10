import { figjamNodes, FigjamNodes } from '../figjam-nodes';
import { sceneNode } from '../scene-node';

type UnsupportedNodes =
  | SliceNode
  | GroupNode
  | BooleanOperationNode
  | SectionNode
  | TableNode
  | TransformGroupNode
  | SlideRowNode
  | SlideGridNode
  | InteractiveSlideElementNode
  | VectorNode
  | LineNode
  | StarNode
  | PolygonNode
  | EllipseNode
  | RectangleNode
  | TextNode
  | StickyNode
  | ShapeWithTextNode
  | ConnectorNode
  | EmbedNode
  | WidgetNode
  | MediaNode
  | HighlightNode
  | TextPathNode
  | StampNode
  | FigjamNodes;

const unsupportedNodes: NodeType[] = [
  'SLICE',
  'GROUP',
  'BOOLEAN_OPERATION',
  'SECTION',
  'TABLE',
  'TRANSFORM_GROUP',
  'SLIDE_ROW',
  'SLIDE_GRID',
  'VECTOR',
  'LINE',
  'STAR',
  'POLYGON',
  'ELLIPSE',
  'RECTANGLE',
  'TEXT',
  'STICKY',
  'SHAPE_WITH_TEXT',
  'CONNECTOR',
  'EMBED',
  'WIDGET',
  'MEDIA',
  'HIGHLIGHT',
  'TEXT_PATH',
  'STAMP',
  ...figjamNodes,
];

export type SupportedNodes = Exclude<SceneNode, UnsupportedNodes>;

export const supportedNodes = sceneNode.filter((nodeType) => !unsupportedNodes.includes(nodeType));
