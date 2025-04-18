export type FigjamNodes =
  | WashiTapeNode
  | StickyNode
  | ConnectorNode
  | ShapeWithTextNode
  | CodeBlockNode
  | WidgetNode
  | EmbedNode
  | LinkUnfurlNode
  | MediaNode;

export const figjamNodes: NodeType[] = [
  'WASHI_TAPE',
  'STICKY',
  'CONNECTOR',
  'SHAPE_WITH_TEXT',
  'CODE_BLOCK',
  'WIDGET',
  'EMBED',
  'LINK_UNFURL',
  'MEDIA',
];
