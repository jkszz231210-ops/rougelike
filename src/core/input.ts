import * as pc from 'playcanvas';

export class InputController {
  private readonly keys = new Set<string>();
  private pointerX = 0;
  private pointerY = 0;
  private attackRequested = false;
  private skillRequested = false;
  private dashRequested = false;
  private synergyRequested = false;
  private moveRequested = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const updatePointer = (event: PointerEvent): void => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointerX = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
      this.pointerY = ((event.clientY - rect.top) / rect.height) * this.canvas.height;
    };

    window.addEventListener('keydown', (event) => {
      this.keys.add(event.code);
      if (event.code === 'Space') {
        event.preventDefault();
        this.dashRequested = true;
      }
      if (event.code === 'KeyQ' && !event.repeat) this.synergyRequested = true;
      if (event.code === 'KeyE' && !event.repeat) this.skillRequested = true;
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    this.canvas.addEventListener('pointermove', updatePointer);
    this.canvas.addEventListener('pointerdown', (event) => {
      updatePointer(event);
      if (event.button === 0) this.attackRequested = true;
      if (event.button === 2) {
        if (event.shiftKey) this.skillRequested = true;
        else this.moveRequested = true;
      }
    });
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  getMovement(): pc.Vec3 {
    const x = Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA'));
    const z = Number(this.keys.has('KeyS')) - Number(this.keys.has('KeyW'));
    const movement = new pc.Vec3(x, 0, z);
    if (movement.lengthSq() > 1) movement.normalize();
    return movement;
  }

  consumeAttack(): boolean {
    const requested = this.attackRequested;
    this.attackRequested = false;
    return requested;
  }

  consumeSkill(): boolean {
    const requested = this.skillRequested;
    this.skillRequested = false;
    return requested;
  }

  consumeDash(): boolean {
    const requested = this.dashRequested;
    this.dashRequested = false;
    return requested;
  }

  consumeSynergy(): boolean {
    const requested = this.synergyRequested;
    this.synergyRequested = false;
    return requested;
  }

  consumeMoveRequest(): boolean {
    const requested = this.moveRequested;
    this.moveRequested = false;
    return requested;
  }

  getAimPoint(camera: pc.Entity, groundY = 0): pc.Vec3 {
    const cameraComponent = camera.camera;
    if (!cameraComponent) return new pc.Vec3();

    const near = cameraComponent.screenToWorld(this.pointerX, this.pointerY, 0.1);
    const far = cameraComponent.screenToWorld(this.pointerX, this.pointerY, 100);
    const direction = far.clone().sub(near);
    if (Math.abs(direction.y) < 0.0001) return far;

    const distance = (groundY - near.y) / direction.y;
    return near.add(direction.mulScalar(distance));
  }
}
