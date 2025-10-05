import { sceneNode } from '../scene-node';

const unsupportedNodes: NodeType[] = [];

export type SupportedNodes = SceneNode;

export const supportedNodes = sceneNode.filter((nodeType) => !unsupportedNodes.includes(nodeType));
