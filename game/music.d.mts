export type KitchenMusic = Readonly<{
  unlock(): Promise<boolean>;
  setMuted(muted: boolean): void;
  dispose(): void;
}>;

export function createKitchenMusic(): KitchenMusic;
