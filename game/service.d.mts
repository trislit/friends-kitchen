export type IngredientId = "bread" | "butter" | "tea" | "broth" | "noodles" | "vegetables" | "spice" | "rice";

export type Ingredient = Readonly<{ id: IngredientId; name: string }>;

export type Recipe = Readonly<{
  id: string;
  name: string;
  ingredients: readonly IngredientId[];
  pay: bigint;
}>;

export type Stock = Readonly<Partial<Record<IngredientId, number>>>;

export const INGREDIENTS: readonly Ingredient[];
export const RECIPES: readonly Recipe[];
export const ORDER_WEIGHTS: readonly number[];
export const STARTER: Stock;
export const PRICES: Readonly<Record<IngredientId, bigint>>;

export function plateMatches(plate: readonly string[], ingredients: readonly string[]): boolean;
export function payment(plate: readonly string[], order: Recipe): Readonly<{ correct: boolean; amount: bigint }>;
export function recipeForRoll(roll: number): Recipe;
export function priceOf(id: string): bigint;
export function buyIngredient(cash: bigint, stock: Stock, id: string): Readonly<{ ok: boolean; cash: bigint; stock: Stock }>;
export function countStock(stock: Stock, id: string): number;

export const FRESH_MS: number;
export const SPOIL_MS: number;
export const LAMP_BONUS_MS: number;
export const LAMP_MAX: number;
export const JAR_FAST_BONUS_BPS: number;
export const JAR_LUCKY_BONUS_BPS: number;
export type ShopId = "lamp" | "jar";
export type ShopItem = Readonly<{ id: ShopId; name: string; price: bigint; max: number; blurb: string }>;
export const SHOP: readonly ShopItem[];
export type Owned = Readonly<Partial<Record<ShopId, number>>>;
export function holdTimes(lamps: number): Readonly<{ freshMs: number; spoilMs: number }>;
export function buyUpgrade(cash: bigint, owned: Owned, id: string): Readonly<{ ok: boolean; cash: bigint; owned: Owned }>;
export const QUEUE_SIZE: number;
export const PATIENCE_MS: readonly number[];
export const BREAK_MS: readonly number[];
export function waveSize(roll: number): Readonly<{ size: number; rush: boolean }>;
export function breakFor(roll: number): number;
export const ANNOYED_MS: number;
export const EXIT_MS: number;

export type Look = Readonly<{ shirt: string; skin: string; hair: string }>;
export type Customer = Readonly<{ id: number; name: string; order: Recipe; look: Look; arrivedAt: number; patienceMs: number }>;
export type Freshness = "fresh" | "turning" | "spoiled";
export type Mood = "waiting" | "annoyed" | "leaving" | "gone";

export const LOOKS: readonly Look[];

export function patienceFor(index: number): number;
export function customerMood(waitedMs: number, patienceMs: number): Mood;
export function customerLine(orderName: string, mood: Mood, lineIndex: number): string;

export const FAST_TIP_BPS: number;
export const LUCKY_TIP_BPS: number;
export type TipKind = "none" | "fast" | "lucky";
export function rollTip(roll: number, situation: { correct: boolean; state: Freshness; mood: Mood }, jar?: boolean): TipKind;
export function tipValue(pay: bigint, kind: TipKind): bigint;
export const CUSTOMER_NAMES: readonly string[];
export function customerName(id: number, taken?: readonly string[]): string;
export function customerForDish(customers: readonly Customer[], dishName: string, now: number): Customer | null;
export function createCustomer(roll: number, lookIndex: number, id: number, arrivedAt?: number, taken?: readonly string[]): Customer;
export function recipeFromPlate(plate: readonly string[]): Recipe | null;
export function freshness(ageMs: number, lamps?: number): Freshness;
export function servePay(dishName: string, orderName: string, state: Freshness): Readonly<{ correct: boolean; state: Freshness; amount: bigint }>;
