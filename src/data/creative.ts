/**
 * The Zylo product poster — the design system, as a type.
 *
 * Every Zylo product is sold through one designed image rather than a cut-out
 * on white, and those images are not each invented from scratch. Read across
 * the five, the same skeleton is underneath all of them:
 *
 *   ZYLO VERIFIED seal, top corner, tinted to the product
 *   a kicker           "Mix. Match. Shine."     — optional, set in script
 *   a headline         two or three short lines, last one in the accent
 *   a tagline          one line, sentence case
 *   four or five features — a round icon chip, an uppercase label, a note
 *   a closing strip    three or four "perfect for" icons
 *
 * Filling this type in *is* designing the next poster. That is the point of
 * writing it down: the sixth product should not need a designer to decide
 * where the headline goes, and should not end up looking like a different
 * shop. What varies between products is the accent, the ground and the
 * words — never the skeleton.
 *
 * Two grounds, both already in use. `light` is the warm cream the clothing,
 * jewellery and skincare posters sit on. `dark` is near-black with a gold
 * accent, used where the product itself is dark and a cream ground would
 * lose it — the knives.
 *
 * The accent is taken *from the product*, never chosen freely: the brown of
 * the top, the slate blue of the tee, the gold of the plating, the olive of
 * the sunscreen's cap. That is what keeps five posters looking like one shop
 * while looking nothing like each other.
 */

export interface CreativeFeature {
  /** A lucide-react icon name. Unknown names fall back rather than crash. */
  readonly icon: string;
  /** Uppercase on the poster; two short lines beat one long one. */
  readonly label: string;
  /** Optional supporting line, sentence case. */
  readonly note?: string;
}

export interface Creative {
  /** Optional script line above the headline. Three words, each a full stop. */
  readonly kicker?: string;
  /** Two or three lines. The last is set in the accent colour. */
  readonly headline: readonly string[];
  readonly tagline: string;
  /** Four or five. Fewer reads thin; more stops being scannable. */
  readonly features: readonly CreativeFeature[];
  /** The closing strip. Three or four, icon plus two or three words. */
  readonly perfectFor: readonly CreativeFeature[];
  /** Taken from the product. Hex, and it must pass contrast on the ground. */
  readonly accent: string;
  readonly ground: "light" | "dark";
  /** Optional roundel — a spec worth stating on its own ("SPF 50 PA+++"). */
  readonly seal?: string;
}

/** The ground's two colours, so a poster and its card agree on the palette. */
export const GROUND = {
  light: { bg: "#F3EDE4", ink: "#2A211A", muted: "#6B5D50" },
  dark: { bg: "#141210", ink: "#F5F0E8", muted: "#9A8F82" },
} as const;
