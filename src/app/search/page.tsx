import { SearchResults } from "@/components/SearchResults";
import type { SortKey } from "@/lib/catalog";

const VALID_SORTS: SortKey[] = [
  "relevance",
  "price-asc",
  "price-desc",
  "rating",
  "discount",
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const { q, category, sort } = await searchParams;
  const sortKey = VALID_SORTS.includes(sort as SortKey)
    ? (sort as SortKey)
    : "relevance";

  // The filter state is seeded from the URL, and React keeps state across a
  // same-route navigation — so without this key, clicking a category chip
  // while already on /search would change the URL and nothing else.
  return (
    <SearchResults
      key={`${q ?? ""}|${category ?? ""}|${sortKey}`}
      query={q ?? ""}
      initialCategory={category ?? ""}
      initialSort={sortKey}
    />
  );
}
