import type { UpgradeId } from '../game/config';

export interface HudSnapshot {
  health: number;
  maxHealth: number;
  wave: number;
  enemyCount: number;
  skillCooldown: number;
  dashCooldown: number;
  message: string;
}

export class Hud {
  private readonly healthFill: HTMLElement;
  private readonly healthText: HTMLElement;
  private readonly waveText: HTMLElement;
  private readonly cooldownText: HTMLElement;
  private readonly message: HTMLElement;
  private readonly modal: HTMLElement;

  constructor(private readonly root: HTMLElement) {
    this.root.innerHTML = `
      <div class="hud-top">
        <div class="health-shell"><div class="health-fill"></div><span class="health-text"></span></div>
        <div class="wave-text"></div>
      </div>
      <div class="hud-bottom">
        <div class="controls">WASD 移动 · 左键攻击 · 右键技能 · Space 闪避</div>
        <div class="cooldown-text"></div>
      </div>
      <div class="message" aria-live="polite"></div>
      <div class="modal hidden"></div>
    `;

    this.healthFill = this.require('.health-fill');
    this.healthText = this.require('.health-text');
    this.waveText = this.require('.wave-text');
    this.cooldownText = this.require('.cooldown-text');
    this.message = this.require('.message');
    this.modal = this.require('.modal');
  }

  update(snapshot: HudSnapshot): void {
    const ratio = Math.max(0, snapshot.health / snapshot.maxHealth);
    this.healthFill.style.width = `${ratio * 100}%`;
    this.healthText.textContent = `${Math.ceil(snapshot.health)} / ${snapshot.maxHealth}`;
    this.waveText.textContent = `灰烬荒原 · 波次 ${snapshot.wave}/3 · 敌人 ${snapshot.enemyCount}`;
    this.cooldownText.textContent = `技能 ${this.formatCooldown(snapshot.skillCooldown)} · 闪避 ${this.formatCooldown(snapshot.dashCooldown)}`;
    this.message.textContent = snapshot.message;
  }

  showUpgrade(
    choices: ReadonlyArray<{ id: UpgradeId; name: string; description: string }>,
    onSelect: (id: UpgradeId) => void
  ): void {
    this.modal.classList.remove('hidden');
    this.modal.innerHTML = `
      <section class="panel">
        <p class="eyebrow">命数偏转</p>
        <h1>选择一项强化</h1>
        <div class="upgrade-grid">
          ${choices.map((choice) => `
            <button class="upgrade-card" data-upgrade="${choice.id}">
              <strong>${choice.name}</strong>
              <span>${choice.description}</span>
            </button>
          `).join('')}
        </div>
      </section>
    `;

    this.modal.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach((button) => {
      button.addEventListener('click', () => {
        this.hideModal();
        onSelect(button.dataset.upgrade as UpgradeId);
      }, { once: true });
    });
  }

  showResult(victory: boolean, onRestart: () => void): void {
    this.modal.classList.remove('hidden');
    this.modal.innerHTML = `
      <section class="panel result-panel">
        <p class="eyebrow">${victory ? '灰烬暂熄' : '命数断裂'}</p>
        <h1>${victory ? '第一关已通关' : '你倒在了荒原'}</h1>
        <p>${victory ? '第一关竖切完成。后续将加入遗物、伙伴和五关流程。' : '重新进入荒原，尝试不同的走位与强化。'}</p>
        <button class="primary-button" id="restart-button">重新开始</button>
      </section>
    `;
    this.modal.querySelector<HTMLButtonElement>('#restart-button')?.addEventListener('click', onRestart, { once: true });
  }

  hideModal(): void {
    this.modal.classList.add('hidden');
    this.modal.replaceChildren();
  }

  private formatCooldown(value: number): string {
    return value <= 0 ? '就绪' : `${value.toFixed(1)}s`;
  }

  private require<T extends HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`HUD element not found: ${selector}`);
    return element;
  }
}
