export interface RunSummary {
  victory: boolean;
  room: number;
  kills: number;
  level: number;
  coins: number;
}

export interface ProfileData {
  version: 1;
  runs: number;
  victories: number;
  bestRoom: number;
  totalKills: number;
  highestLevel: number;
  mostCoins: number;
}

const STORAGE_KEY = 'ember-companions-profile-v1';
const DEFAULT_PROFILE: ProfileData = {
  version: 1,
  runs: 0,
  victories: 0,
  bestRoom: 0,
  totalKills: 0,
  highestLevel: 1,
  mostCoins: 0
};

export class ProfileStore {
  private data: ProfileData = this.load();

  markRoom(room: number): void {
    if (room <= this.data.bestRoom) return;
    this.data.bestRoom = room;
    this.persist();
  }

  finishRun(summary: RunSummary): Readonly<ProfileData> {
    this.data.runs += 1;
    this.data.victories += summary.victory ? 1 : 0;
    this.data.bestRoom = Math.max(this.data.bestRoom, summary.room);
    this.data.totalKills += summary.kills;
    this.data.highestLevel = Math.max(this.data.highestLevel, summary.level);
    this.data.mostCoins = Math.max(this.data.mostCoins, summary.coins);
    this.persist();
    return { ...this.data };
  }

  private load(): ProfileData {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_PROFILE };
      const parsed = JSON.parse(raw) as Partial<ProfileData>;
      if (parsed.version !== 1) return { ...DEFAULT_PROFILE };
      return { ...DEFAULT_PROFILE, ...parsed, version: 1 };
    } catch {
      return { ...DEFAULT_PROFILE };
    }
  }

  private persist(): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Local storage can be unavailable in strict private browsing modes.
    }
  }
}
