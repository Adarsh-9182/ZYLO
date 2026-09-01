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

  return (
    <SearchResults
      query={q ?? ""}
      initialCategory={category ?? ""}
      initialSort={sortKey}
    />
  );
}
