import * as pc from 'playcanvas';
import './style.css';
import { ArtDirectionDirector } from './game/artDirection';
import { RogueliteGame } from './game/game';
import { RemoteAssetDirector } from './game/remoteAssets';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const hudRoot = document.querySelector<HTMLElement>('#hud-root');

if (!canvas || !hudRoot) throw new Error('Required DOM elements are missing');

const app = new pc.Application(canvas, {
  graphicsDeviceOptions: {
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  }
});

app.setCanvasResolution(pc.RESOLUTION_AUTO);
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.start();

window.addEventListener('resize', () => app.resizeCanvas());
new RogueliteGame(app, canvas, hudRoot);
new ArtDirectionDirector(app);
new RemoteAssetDirector(app);
