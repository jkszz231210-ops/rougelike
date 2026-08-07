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
  private readonly skillCooldownText: HTMLElement;
  private readonly dashCooldownText: HTMLElement;
  private readonly enemyCountText: HTMLElement;
  private readonly objectiveText: HTMLElement;
  private readonly coinText: HTMLElement;
  private readonly message: HTMLElement;
  private readonly modal: HTMLElement;

  constructor(private readonly root: HTMLElement) {
    this.root.innerHTML = `
      <div class="hud-frame">
        <header class="top-rail">
          <div class="brand-lockup">
            <span class="brand-mark" aria-hidden="true"></span>
            <div>
              <strong>EMBERFALL</strong>
              <small>灰烬远征 · V0.3</small>
            </div>
          </div>
          <div class="stage-plaque">
            <span class="stage-kicker">CURRENT DOMAIN</span>
            <div class="room-text"></div>
          </div>
          <div class="run-meta">
            <span class="coin-text"></span>
            <span class="run-text"></span>
          </div>
        </header>

        <aside class="objective-panel">
          <span class="panel-kicker">当前目标</span>
          <strong class="objective-text"></strong>
          <div class="enemy-counter"><span class="enemy-count"></span><small>残存敌人</small></div>
        </aside>

        <aside class="archive-panel">
          <div class="archive-row">
            <span>伙伴</span>
            <strong class="companion-text"></strong>
          </div>
          <div class="archive-row">
            <span>遗物</span>
            <strong class="relic-text"></strong>
          </div>
        </aside>

        <section class="combat-rail">
          <div class="vital-cluster">
            <div class="health-orb" aria-label="生命值">
              <div class="health-fill"></div>
              <div class="orb-shine"></div>
              <span class="health-text"></span>
            </div>
            <div class="vital-bars">
              <div class="experience-shell">
                <div class="experience-fill"></div>
                <span class="experience-text"></span>
              </div>
              <div class="synergy-shell">
                <div class="synergy-fill"></div>
                <span class="synergy-text"></span>
              </div>
            </div>
          </div>

          <div class="ability-dock">
            <div class="ability-slot primary-attack">
              <span class="ability-icon slash-icon" aria-hidden="true"></span>
              <b>普通攻击</b>
              <kbd>LMB</kbd>
            </div>
            <div class="ability-slot ember-skill">
              <span class="ability-icon ember-icon" aria-hidden="true"></span>
              <b>余烬冲击</b>
              <kbd>E</kbd>
              <em class="skill-cooldown"></em>
            </div>
            <div class="ability-slot dash-skill">
              <span class="ability-icon dash-icon" aria-hidden="true"></span>
              <b>踏火闪避</b>
              <kbd>SPACE</kbd>
              <em class="dash-cooldown"></em>
            </div>
            <div class="ability-slot synergy-skill">
              <span class="ability-icon synergy-icon" aria-hidden="true"></span>
              <b>伙伴协同</b>
              <kbd>Q</kbd>
            </div>
          </div>

          <div class="control-hint">
            <span>右键点地移动</span>
            <span>WASD 镜头方向移动</span>
            <span>Shift+右键 技能</span>
          </div>
        </section>

        <div class="message" aria-live="polite"></div>
        <div class="modal hidden"></div>
      </div>
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
    this.skillCooldownText = this.require('.skill-cooldown');
    this.dashCooldownText = this.require('.dash-cooldown');
    this.enemyCountText = this.require('.enemy-count');
    this.objectiveText = this.require('.objective-text');
    this.coinText = this.require('.coin-text');
    this.message = this.require('.message');
    this.modal = this.require('.modal');
  }

  update(snapshot: HudSnapshot): void {
    const healthRatio = Math.max(0, Math.min(1, snapshot.health / snapshot.maxHealth));
    const experienceRatio = Math.max(0, snapshot.experience / snapshot.experienceToNext);
    this.healthFill.style.height = `${healthRatio * 100}%`;
    this.healthText.textContent = `${Math.ceil(snapshot.health)}`;
    this.experienceFill.style.width = `${Math.min(1, experienceRatio) * 100}%`;
    this.experienceText.textContent = `LV.${snapshot.level} · ${snapshot.experience}/${snapshot.experienceToNext}`;
    this.synergyFill.style.width = `${Math.min(100, snapshot.synergy)}%`;
    this.synergyText.textContent = snapshot.companions.length === 0
      ? '协同锁定'
      : snapshot.synergy >= 100
        ? '协同已就绪'
        : `协同 ${Math.floor(snapshot.synergy)}%`;
    this.roomText.textContent = `${this.roman(snapshot.room)} · ${snapshot.roomTitle}`;
    this.runText.textContent = `SEED ${snapshot.seed}`;
    this.coinText.textContent = `◆ ${snapshot.coins}`;
    this.companionText.textContent = snapshot.companions.length > 0 ? snapshot.companions.join(' · ') : '尚未解救';
    this.relicText.textContent = snapshot.relics.length > 0 ? snapshot.relics.join(' · ') : '尚未获得';
    this.skillCooldownText.textContent = this.formatCooldown(snapshot.skillCooldown);
    this.dashCooldownText.textContent = this.formatCooldown(snapshot.dashCooldown);
    this.enemyCountText.textContent = `${snapshot.enemyCount}`;
    this.objectiveText.textContent = snapshot.enemyCount > 0 ? `肃清「${snapshot.roomTitle}」` : '区域已肃清';
    this.message.textContent = snapshot.message;
  }

  showUpgrade(
    choices: ReadonlyArray<{ definition: UpgradeDefinition; currentLevel: number }>,
    onSelect: (id: UpgradeId) => void
  ): void {
    this.modal.classList.remove('hidden');
    this.modal.innerHTML = `
      <section class="panel choice-panel">
        <div class="panel-heading">
          <span class="eyebrow">命数偏转 · EMBER BLESSING</span>
          <h1>选择一项强化</h1>
          <p>余烬会回应你的选择，但不会替你承担代价。</p>
        </div>
        <div class="upgrade-grid">
          ${choices.map(({ definition, currentLevel }, index) => `
            <button class="upgrade-card ${index === 1 ? 'featured' : ''}" data-upgrade="${definition.id}">
              <span class="card-sigil" aria-hidden="true"></span>
              <small>${definition.rarity} · Lv.${currentLevel + 1}/${definition.maxLevel}</small>
              <strong>${definition.name}</strong>
              <span>${definition.description}</span>
              <em>选择</em>
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
      <section class="panel choice-panel relic-panel">
        <div class="panel-heading">
          <span class="eyebrow">遗物回响 · FORGOTTEN RELIC</span>
          <h1>从灰烬中取走一件遗物</h1>
          <p>每件遗物都曾属于某个没能走到这里的人。</p>
        </div>
        <div class="upgrade-grid">
          ${choices.map((relic) => `
            <button class="upgrade-card relic-card" data-relic="${relic.id}">
              <span class="card-sigil violet" aria-hidden="true"></span>
              <small>单局遗物</small>
              <strong>${relic.name}</strong>
              <span>${relic.description}</span>
              <em>收下</em>
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
        <span class="result-crest clear" aria-hidden="true"></span>
        <p class="eyebrow">区域肃清 · DOMAIN CLEARED</p>
        <h1>${title}</h1>
        <p>${detail}</p>
        <button class="primary-button" id="continue-button">继续深入</button>
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
      <section class="panel result-panel final-result ${victory ? 'victory' : 'defeat'}">
        <span class="result-crest" aria-hidden="true"></span>
        <p class="eyebrow">${victory ? '灰烬暂熄 · VICTORY' : '命数断裂 · FALLEN'}</p>
        <h1>${victory ? '灰烬荒原已通关' : '你倒在了荒原'}</h1>
        <div class="result-stats">
          <div><small>抵达</small><strong>${summary.room}/5</strong></div>
          <div><small>等级</small><strong>${summary.level}</strong></div>
          <div><small>击败</small><strong>${summary.kills}</strong></div>
          <div><small>灰金币</small><strong>${summary.coins}</strong></div>
        </div>
        <p class="profile-line">累计 ${summary.profile.runs} 局 · 通关 ${summary.profile.victories} 次 · 最远关卡 ${summary.profile.bestRoom} · SEED ${summary.seed}</p>
        <div class="result-actions">
          <button class="primary-button" id="same-seed-button">同命数重开</button>
          <button class="secondary-button" id="new-seed-button">生成新命数</button>
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
    return value <= 0 ? 'READY' : `${value.toFixed(1)}s`;
  }

  private roman(value: number): string {
    return ['I', 'II', 'III', 'IV', 'V'][Math.max(0, Math.min(4, value - 1))] ?? `${value}`;
  }

  private require<T extends HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`HUD element not found: ${selector}`);
    return element;
  }
}
