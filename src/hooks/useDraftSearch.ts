import { useMemo } from "react";
import type { ThesisBlock } from "../types";

function tokenize(query: string) {
  return query.toLowerCase().match(/[a-zA-ZÀ-ÿ0-9]+/g)?.filter((token) => token.length > 2) || [];
}

export function useDraftSearch(blocks: ThesisBlock[], query: string, limit = 12) {
  return useMemo(() => {
    const terms = tokenize(query);
    if (!terms.length) return blocks.slice(0, limit);
    return blocks
      .map((block) => {
        const haystack = block.searchText.toLowerCase();
        const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
        return { block, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.block.index - b.block.index)
      .slice(0, limit)
      .map((item) => item.block);
  }, [blocks, limit, query]);
}

export function highlightText(text: string, query: string) {
  const terms = tokenize(query);
  if (!terms.length) return [{ text, hit: false, index: 0 }];
  const pattern = new RegExp(`(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig");
  return text.split(pattern).map((part, index) => ({ text: part, hit: terms.includes(part.toLowerCase()), index }));
}
