import { Container } from 'pixi.js';

export function createSceneLayers() {
  const root = new Container();
  root.label = 'scene-root';

  const background = new Container();
  background.label = 'background-layer';

  const boundaries = new Container();
  boundaries.label = 'boundaries-layer';

  const dangerZone = new Container();
  dangerZone.label = 'danger-zone-layer';

  root.addChild(background, boundaries, dangerZone);

  return {
    root,
    background,
    boundaries,
    dangerZone,
  };
}
