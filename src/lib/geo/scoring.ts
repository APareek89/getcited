import type { ShareOfVoiceEntry, PerPromptEntry } from "./types";

export interface ScoringAnswer {
  prompt: string;
  mentions: string[];
}

export interface ScoringInput {
  brand: string;
  competitors: string[];
  answers: ScoringAnswer[];
}

export interface ScoringResult {
  shareOfVoice: ShareOfVoiceEntry[];
  perPrompt: PerPromptEntry[];
  answerCount: number;
}

/**
 * Deterministic scoring (ported from geo-radar).
 * - mentions[brand] = number of answers that named the brand (one per answer).
 * - sov[brand] = mentions[brand] / total mentions across ALL tracked brands.
 * - per-prompt: which brands appeared + the competitor mentioned most often.
 */
export function computeShareOfVoice(input: ScoringInput): ScoringResult {
  // Old saved configurations can contain a repeated brand or case variant.
  // Keep its first spelling once so the denominator and rendered rows agree.
  const tracked = [...new Map([input.brand, ...input.competitors].map(b => [b.trim().toLowerCase(), b.trim()])).keys()]
    .map(key => [input.brand, ...input.competitors].find(b => b.trim().toLowerCase() === key)!.trim());
  const competitors = tracked.filter(b => b.toLowerCase() !== input.brand.trim().toLowerCase());
  const mentionCounts = new Map<string, number>(tracked.map((b) => [b, 0]));

  const byLower = new Map(tracked.map((b) => [b.toLowerCase(), b]));
  const countMention = (raw: string): string | null => byLower.get(raw.trim().toLowerCase()) ?? null;

  for (const answer of input.answers) {
    const seen = new Set<string>();
    for (const m of answer.mentions) {
      const canonical = countMention(m);
      if (canonical && !seen.has(canonical)) {
        seen.add(canonical);
        mentionCounts.set(canonical, (mentionCounts.get(canonical) ?? 0) + 1);
      }
    }
  }

  const totalMentions = Array.from(mentionCounts.values()).reduce((a, b) => a + b, 0);
  const shareOfVoice: ShareOfVoiceEntry[] = tracked.map((brand) => {
    const mentions = mentionCounts.get(brand) ?? 0;
    return { brand, mentions, sov: totalMentions > 0 ? mentions / totalMentions : 0 };
  });

  const promptGroups = new Map<string, ScoringAnswer[]>();
  for (const answer of input.answers) {
    const group = promptGroups.get(answer.prompt) ?? [];
    group.push(answer);
    promptGroups.set(answer.prompt, group);
  }

  const perPrompt: PerPromptEntry[] = [];
  for (const [prompt, group] of promptGroups) {
    const mentionedSet = new Set<string>();
    const compCounts = new Map<string, number>(competitors.map((c) => [c, 0]));
    for (const answer of group) {
      const seen = new Set<string>();
      for (const m of answer.mentions) {
        const canonical = countMention(m);
        if (!canonical || seen.has(canonical)) continue;
        seen.add(canonical);
        mentionedSet.add(canonical);
        if (compCounts.has(canonical)) {
          compCounts.set(canonical, (compCounts.get(canonical) ?? 0) + 1);
        }
      }
    }
    let topCompetitor: string | null = null;
    let topCount = 0;
    for (const [comp, count] of compCounts) {
      if (count > topCount) {
        topCount = count;
        topCompetitor = comp;
      }
    }
    perPrompt.push({
      prompt,
      mentioned_brands: Array.from(mentionedSet),
      top_competitor: topCount > 0 ? topCompetitor : null,
    });
  }

  return { shareOfVoice, perPrompt, answerCount: input.answers.length };
}
