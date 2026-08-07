import type { RelicDefinition, RelicId, UpgradeDefinition, UpgradeId } from '../game/content';
import type { ProfileData } from './profile';

export interface HudSnapshot {
  health: number;
  maxHealth: number;
  level: number;
  experience: number;
  experienceToNext: number;
  room: number;
  roomCount: number;
  roomTitle: string;
  enemyCount: number;
  coins: number;
  relics: readonly string[];
  companions: readonly string[];
  synergy: number;
  seed: string;
  skillCooldown: number;
  dashCooldown: number;
  message: string;
}

export interface ResultSummary {
  seed: string;
  room: number;
  kills: number;
  level: number;
  coins: number;
  profile: Readonly<ProfileData>;
}

export class Hud {
  private readonly healthFill: HTMLElement;
  private readonly healthText: HTMLElement;
  private readonly experienceFill: HTMLElement;
  private readonly experienceText: HTMLElement;
  private readonly roomText: HTMLElement;
  private readonly runText: HTMLElement;
  private readonly relicText: HTMLElement;
  private readonly companionText: HTMLElement;
  private readonly synergyFill: HTMLElement;
  private readonly synergyText: HTMLElement;
  private readonly cooldownText: HTMLElement;
  private readonly message: HTMLElement;
  private readonly modal: HTMLElement;

  constructor(private readonly root: HTMLElement) {
    this.root.innerHTML = `
      <div class="hud-top">
        <div class="vitals">
          <div class="health-shell"><div class="health-fill"></div><span class="health-text"></span></div>
          <div class="experience-shell"><div class="experience-fill"></div><span class="experience-text"></span></div>
          <div class="synergy-shell"><div class="synergy-fill"></div><span class="synergy-text"></span></div>
        </div>
        <div class="room-text"></div>
      </div>
      <div class="run-panel">
        <div class="run-title">灰烬远征 · V0.2</div>
        <div class="run-text"></div>
        <div class="companion-text"></div>
        <div class="relic-text"></div>
      </div>
      <div class="hud-bottom">
        <div class="controls">右键点地移动 / WASD 镜头方向移动 · 左键攻击 · E 或 Shift+右键技能 · Space 闪避 · Q 协同</div>
        <div class="cooldown-text"></div>
      </div>
      <div class="message" aria-live="polite"></div>
      <div class="modal hidden"></div>
    `;

    this.healthFill = this.require('.health-fill');
    this.healthText = this.require('.health-text');
    this.experienceFill = this.require('.experience-fill');
    this.experienceText = this.require('.experience-text');
    this.roomText = this.require('.room-text');
    this.runText = this.require('.run-text');
    this.relicText = this.require('.relic-text');
    this.companionText = this.require('.companion-text');
    this.synergyFill = this.require('.synergy-fill');
    this.synergyText = this.require('.synergy-text');
    this.cooldownText = this.require('.cooldown-text');
    this.message = this.require('.message');
    this.modal = this.require('.modal');
  }

  update(snapshot: HudSnapshot): void {
    const healthRatio = Math.max(0, snapshot.health / snapshot.maxHealth);
    const experienceRatio = Math.max(0, snapshot.experience / snapshot.experienceToNext);
    this.healthFill.style.width = `${healthRatio * 100}%`;
    this.healthText.textContent = `${Math.ceil(snapshot.health)} / ${snapshot.maxHealth}`;
    this.experienceFill.style.width = `${Math.min(1, experienceRatio) * 100}%`;
    this.experienceText.textContent = `等级 ${snapshot.level} · ${snapshot.experience}/${snapshot.experienceToNext}`;
    this.synergyFill.style.width = `${Math.min(100, snapshot.synergy)}%`;
    this.synergyText.textContent = snapshot.companions.length === 0
      ? '协同：等待伙伴'
      : snapshot.synergy >= 100
        ? '协同就绪 · 按 Q'
        : `协同 ${Math.floor(snapshot.synergy)}%`;
    this.roomText.textContent = `第 ${snapshot.room}/${snapshot.roomCount} 关 · ${snapshot.roomTitle} · 敌人 ${snapshot.enemyCount}`;
    this.runText.textContent = `金币 ${snapshot.coins} · 种子 ${snapshot.seed}`;
    this.companionText.textContent = snapshot.companions.length > 0 ? `伙伴：${snapshot.companions.join('、')}` : '伙伴：尚未解救';
    this.relicText.textContent = snapshot.relics.length > 0 ? `遗物：${snapshot.relics.join('、')}` : '遗物：尚未获得';
    this.cooldownText.textContent = `技能 ${this.formatCooldown(snapshot.skillCooldown)} · 闪避 ${this.formatCooldown(snapshot.dashCooldown)}`;
    this.message.textContent = snapshot.message;
  }

  showUpgrade(
    choices: ReadonlyArray<{ definition: UpgradeDefinition; currentLevel: number }>,
    onSelect: (id: UpgradeId) => void
  ): void {
    this.modal.classList.remove('hidden');
    this.modal.innerHTML = `
      <section class="panel">
        <p class="eyebrow">命数偏转</p>
        <h1>选择一项强化</h1>
        <div class="upgrade-grid">
          ${choices.map(({ definition, currentLevel }) => `
            <button class="upgrade-card" data-upgrade="${definition.id}">
              <small>${definition.rarity} · Lv.${currentLevel + 1}/${definition.maxLevel}</small>
              <strong>${definition.name}</strong>
              <span>${definition.description}</span>
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

  showRelic(choices: readonly RelicDefinition[], onSelect: (id: RelicId) => void): void {
    this.modal.classList.remove('hidden');
    this.modal.innerHTML = `
      <section class="panel">
        <p class="eyebrow">遗物回响</p>
        <h1>选择一件遗物</h1>
        <div class="upgrade-grid">
          ${choices.map((relic) => `
            <button class="upgrade-card relic-card" data-relic="${relic.id}">
              <small>单局遗物</small>
              <strong>${relic.name}</strong>
              <span>${relic.description}</span>
            </button>
          `).join('')}
        </div>
      </section>
    `;

    this.modal.querySelectorAll<HTMLButtonElement>('[data-relic]').forEach((button) => {
      button.addEventListener('click', () => {
        this.hideModal();
        onSelect(button.dataset.relic as RelicId);
      }, { once: true });
    });
  }

  showRoomComplete(title: string, detail: string, onContinue: () => void): void {
    this.modal.classList.remove('hidden');
    this.modal.innerHTML = `
      <section class="panel result-panel compact-panel">
        <p class="eyebrow">关卡肃清</p>
        <h1>${title}</h1>
        <p>${detail}</p>
        <button class="primary-button" id="continue-button">继续前进</button>
      </section>
    `;
    this.modal.querySelector<HTMLButtonElement>('#continue-button')?.addEventListener('click', () => {
      this.hideModal();
      onContinue();
    }, { once: true });
  }

  showResult(
    victory: boolean,
    summary: ResultSummary,
    onRestartSameSeed: () => void,
    onNewSeed: () => void
  ): void {
    this.modal.classList.remove('hidden');
    this.modal.innerHTML = `
      <section class="panel result-panel">
        <p class="eyebrow">${victory ? '灰烬暂熄' : '命数断裂'}</p>
        <h1>${victory ? '灰烬荒原已通关' : '你倒在了荒原'}</h1>
        <p>种子 ${summary.seed} · 关卡 ${summary.room}/5 · 等级 ${summary.level} · 击败 ${summary.kills} · 金币 ${summary.coins}</p>
        <p class="profile-line">累计游玩 ${summary.profile.runs} 局 · 通关 ${summary.profile.victories} 次 · 最远关卡 ${summary.profile.bestRoom}</p>
        <div class="result-actions">
          <button class="primary-button" id="same-seed-button">同种子重开</button>
          <button class="secondary-button" id="new-seed-button">生成新种子</button>
        </div>
      </section>
    `;
    this.modal.querySelector<HTMLButtonElement>('#same-seed-button')?.addEventListener('click', onRestartSameSeed, { once: true });
    this.modal.querySelector<HTMLButtonElement>('#new-seed-button')?.addEventListener('click', onNewSeed, { once: true });
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
