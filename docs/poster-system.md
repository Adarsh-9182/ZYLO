# The Zylo product poster

Zylo sells through one designed image per product, not a cut-out on white.
Five exist. This is what they have in common, written down so the sixth does
not need a designer to decide where the headline goes — and so it does not end
up looking like a different shop.

The type in [`src/data/creative.ts`](../src/data/creative.ts) is this document
in code. Filling it in *is* designing the poster.

## The skeleton

Every one of the five has these, in this order, down the left third:

| | |
|---|---|
| **Seal** | `ZYLO VERIFIED` — shield and tick, top corner, tinted to the product |
| **Kicker** | optional, script face, three words each ending in a full stop — *"Mix. Match. Shine."* |
| **Headline** | two or three short lines, heavy, tight tracking. The last line carries the accent |
| **Tagline** | one line, sentence case, under a short rule |
| **Features** | four or five: round icon chip, uppercase label, optional note line |
| **Closing strip** | three or four icons in a rounded card — *"perfect for…"* |

The product photograph occupies the right two-thirds and bleeds to the edges.

## The rules that actually matter

**The accent comes from the product, never from a palette.** The brown of the
top, the slate blue of the tee, the gold of the plating, the olive-yellow of
the sunscreen cap, the brass on the knives. This is the single thing that lets
five posters look like one shop while looking nothing like each other. Pick it
with a dropper from the photograph.

**Two grounds, and the product chooses.** `light` is the warm cream
(`#F3EDE4`) that the clothing, jewellery and skincare sit on. `dark` is
near-black with a gold accent, for when the product is itself dark and cream
would swallow it — that is why the knives are on black. Do not pick the dark
ground because it looks premium; pick it because the product disappears
otherwise.

**Headlines are two or three words, not a sentence.** *STYLISH. TRENDY.
EFFORTLESS.* Each on its own line, each with a full stop. Where the product
name is the headline — *12 PAIRS / EARRING SET* — the kicker does the mood
instead. Never both a slogan headline and a slogan kicker.

**Four or five features.** Three reads thin, six stops being scannable. Two
short lines beat one long one, because the label is set uppercase and long
uppercase lines are slow.

**A note line only when the claim needs proof.** The sunscreen and the knives
have them (*"Protects from harmful UVA & UVB rays"*); the tee does not need to
explain "oversized fit".

**A seal only for a spec worth stating alone** — `SPF 50 PA+++`, `6 PIECE
SET`. Not a decoration.

## The photography brief

Warm daylight from one side, soft shadow. A neutral interior or a plain warm
surface. Props that place the product without competing: linen, raw stone,
dried grass, a plant, cut fruit for skincare, a wooden board and ingredients
for the kitchen. Never a white cyclorama — that is what the rest of the
catalog looks like, and the point of these is that they do not.

For apparel, shoot both sides. The tee's print is on the back and the front is
nearly plain, so it needs two posters; the second uses a different headline
(*MINIMAL FRONT. MAXIMUM IMPACT.*) rather than repeating the first.

## Adding product six

1. Drop the poster JPEGs in `public/verified/`.
2. Add an entry to [`src/data/verified.ts`](../src/data/verified.ts) — the
   product record plus its `creative`. Use an id in the 900 block.
3. `pnpm db:seed:verified` — upserts by id, and does not disturb the sourced
   catalog or the other house products.

It appears in the **Made by us** rail on the home page, in search, and on its
own product page, with no further wiring.

## One honest gap

Prices in `verified.ts` are placeholders at a round 50% strike. Only one real
figure was available (the top lists at ₹349 at source). Set them before this
is anything but a demo.
