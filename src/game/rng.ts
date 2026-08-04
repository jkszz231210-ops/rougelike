export class SeededRng {
  private state: number;

  constructor(readonly seed: string) {
    this.state = hashSeed(seed);
  }

  next(): number {
    let value = (this.state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    if (max < min) throw new Error('SeededRng.int requires max >= min');
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(values: readonly T[]): T {
    if (values.length === 0) throw new Error('Cannot pick from an empty list');
    return values[Math.floor(this.next() * values.length)] as T;
  }

  shuffle<T>(values: readonly T[]): T[] {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = this.int(0, index);
      [result[index], result[target]] = [result[target] as T, result[index] as T];
    }
    return result;
  }
}

export function createSeedLabel(): string {
  const url = new URL(window.location.href);
  const existing = url.searchParams.get('seed')?.trim();
  if (existing) return existing;

  const created = `${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffff).toString(36)}`;
  url.searchParams.set('seed', created);
  window.history.replaceState({}, '', url);
  return created;
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 0x9e3779b9;
}
