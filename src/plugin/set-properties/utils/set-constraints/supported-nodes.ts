import { FigjamNodes } from '../figjam-nodes';

type UnsupportedNodes = SliceNode | GroupNode | BooleanOperationNode | SectionNode | FigjamNodes;

export type SupportedNodes = Exclude<SceneNode, UnsupportedNodes>;
