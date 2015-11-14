// Emitters
import { start as startNavEmitter } from './nav/emitter';

export function start() {
  // Start all emitters
  startNavEmitter();
}