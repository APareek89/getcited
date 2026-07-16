"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  X,
  Loader2,
  Wand2,
  Search,
  Save,
  Users,
  DollarSign,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { FieldHint } from "@/components/field-hint";
import type { ConfigView } from "@/lib/db/configs";
import {
  saveConfigAction,
  suggestQueriesAction,
  discoverCompetitorsAction,
} from "@/app/(app)/configure/actions";

const HINTS = {
  brandUrl: "Your website. We derive owned domains from it to detect when AI cites you.",
  brandName: "How you're referred to in AI answers (defaults to your domain if blank).",
  description: "One line on what you do — sharpens generated queries and competitors.",
  competitors: "Up to 5 rivals to compare AI share-of-voice against. Use 'Suggest' to auto-fill.",
  queries: "Buyer-intent prompts we ask the AI panel. 'Fetch' generates them, grounded in real searches.",
  budget: "What you can spend on the action plan. Drives which tactics the plan picks.",
  team: "People available. Sets the person-hours the plan can allocate.",
  timeline: "Weeks to execute the plan. Person-hours = team × weeks × ~25 productive hrs/wk.",
} as const;

function padTo<T>(arr: T[], n: number, fill: T): T[] {
  const out = [...arr];
  while (out.length < n) out.push(fill);
  return out;
}

export function ConfigureForm({ initial }: { initial: ConfigView | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [suggesting, setSuggesting] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  const [brandUrl, setBrandUrl] = useState(initial?.brandUrl ?? "");
  const [brandName, setBrandName] = useState(initial?.brandName ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [competitors, setCompetitors] = useState<string[]>(
    padTo(initial?.competitors ?? [], 5, ""),
  );
  // Parallel domains (same index as competitors); filled by Suggest, "" otherwise.
  const [competitorDomains, setCompetitorDomains] = useState<string[]>(
    padTo(initial?.competitorDomains ?? [], 5, ""),
  );
  const [queries, setQueries] = useState<string[]>(initial?.queries ?? []);
  const [newQuery, setNewQuery] = useState("");
  const [budget, setBudget] = useState<string>(String(initial?.budgetUsd ?? 400));
  const [teamSize, setTeamSize] = useState<string>(String(initial?.teamSize ?? 2));
  const [timelineWeeks, setTimelineWeeks] = useState<string>(
    String(initial?.timelineWeeks ?? 8),
  );

  function setCompetitor(i: number, val: string) {
    setCompetitors((prev) => prev.map((c, idx) => (idx === i ? val : c)));
    // Manual edit invalidates the suggested domain pairing for that slot.
    setCompetitorDomains((prev) => prev.map((d, idx) => (idx === i ? "" : d)));
  }
  function addCompetitor() {
    setCompetitors((prev) => [...prev, ""]);
    setCompetitorDomains((prev) => [...prev, ""]);
  }
  function removeCompetitor(i: number) {
    setCompetitors((prev) => prev.filter((_, idx) => idx !== i));
    setCompetitorDomains((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addQuery() {
    const q = newQuery.trim();
    if (!q) return;
    setQueries((prev) => Array.from(new Set([...prev, q])));
    setNewQuery("");
  }
  function removeQuery(i: number) {
    setQueries((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSuggestCompetitors() {
    if (!brandUrl.trim()) {
      toast.error("Enter your brand URL first");
      return;
    }
    setDiscovering(true);
    const res = await discoverCompetitorsAction({
      brandUrl,
      brandName: brandName || undefined,
      description: description || undefined,
    });
    setDiscovering(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    // Fill NAMES into the inputs (mention matching needs names, not URLs) and keep
    // the domain paired in the parallel array for citation attribution.
    setCompetitors((prev) => {
      const keepNames = prev.filter((c) => c.trim());
      const merged = [...keepNames];
      const mergedDomains = [...competitorDomains.slice(0, keepNames.length)];
      for (const c of res.data) {
        if (merged.some((m) => m.toLowerCase() === c.name.toLowerCase())) continue;
        merged.push(c.name);
        try {
          mergedDomains.push(new URL(c.url).host.replace(/^www\./, "").toLowerCase());
        } catch {
          mergedDomains.push("");
        }
      }
      setCompetitorDomains(padTo(mergedDomains, Math.max(5, merged.length), ""));
      return padTo(merged, 5, "");
    });
    toast.success(`Found ${res.data.length} competitors`);
  }

  async function onFetchQueries() {
    if (!brandUrl.trim() && !brandName.trim()) {
      toast.error("Enter your brand or URL first");
      return;
    }
    setSuggesting(true);
    const res = await suggestQueriesAction({
      brand: brandName || brandUrl,
      description: description || undefined,
      competitors: competitors.filter((c) => c.trim()),
    });
    setSuggesting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setQueries((prev) => Array.from(new Set([...prev, ...res.data])));
    toast.success(`Added ${res.data.length} queries`);
  }

  function onSave() {
    if (!brandUrl.trim()) {
      toast.error("Brand URL is required");
      return;
    }
    startTransition(async () => {
      const kept = competitors
        .map((c, i) => ({ name: c.trim(), domain: competitorDomains[i] ?? "" }))
        .filter((c) => c.name);
      const res = await saveConfigAction({
        brandUrl,
        brandName: brandName || undefined,
        description: description || undefined,
        competitors: kept.map((c) => c.name),
        competitorDomains: kept.map((c) => c.domain),
        queries,
        budgetUsd: Number(budget) || 0,
        teamSize: Number(teamSize) || 1,
        timelineWeeks: Number(timelineWeeks) || 8,
        mode: "we_serve",
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Config saved (v${res.data.version})`);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configure</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us your brand, competitors, queries, budget and team. Saved as a version
          you can revisit.{" "}
          {initial ? (
            <span className="text-muted-foreground/80">Editing from v{initial.version}.</span>
          ) : null}
        </p>
      </div>

      {/* Brand */}
      <Card className="space-y-5 p-5">
        <div className="space-y-2">
          <Label htmlFor="brandUrl" className="flex items-center gap-1.5">
            Brand URL <span className="text-danger">*</span>
            <FieldHint text={HINTS.brandUrl} />
          </Label>
          <Input
            id="brandUrl"
            placeholder="pixelbin.io"
            value={brandUrl}
            onChange={(e) => setBrandUrl(e.target.value)}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brandName" className="flex items-center gap-1.5">
              Brand name <FieldHint text={HINTS.brandName} />
            </Label>
            <Input
              id="brandName"
              placeholder="PixelBin"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-1.5">
              What you do <FieldHint text={HINTS.description} />
            </Label>
            <Input
              id="description"
              placeholder="AI image & video processing SaaS"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Competitors */}
      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5">
            Competitors <FieldHint text={HINTS.competitors} />
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSuggestCompetitors}
            disabled={discovering}
          >
            {discovering ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            Suggest competitors
          </Button>
        </div>
        <div className="space-y-2">
          {competitors.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder={`Competitor ${i + 1} name (or paste their URL)`}
                value={c}
                onChange={(e) => setCompetitor(i, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCompetitor(i)}
                aria-label="Remove competitor"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={addCompetitor}>
            <Plus className="h-4 w-4" /> Add competitor
          </Button>
        </div>
      </Card>

      {/* Queries */}
      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5">
            Buyer-intent queries <FieldHint text={HINTS.queries} />
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onFetchQueries}
            disabled={suggesting}
          >
            {suggesting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            Fetch queries
          </Button>
        </div>
        {queries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No queries yet. Use <span className="text-foreground">Fetch queries</span> or add
            your own below.
          </p>
        ) : (
          <ul className="space-y-2">
            {queries.map((q, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">{q}</span>
                <button
                  type="button"
                  onClick={() => removeQuery(i)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Remove query"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Add a query and press Enter"
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addQuery();
              }
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={addQuery}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </Card>

      {/* Budget + team */}
      <Card className="grid gap-5 p-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="budget" className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" /> Budget (USD) <FieldHint text={HINTS.budget} />
          </Label>
          <Input
            id="budget"
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="team" className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Team size <FieldHint text={HINTS.team} />
          </Label>
          <Input
            id="team"
            type="number"
            min={1}
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timeline" className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" /> Timeline (wks){" "}
            <FieldHint text={HINTS.timeline} />
          </Label>
          <Input
            id="timeline"
            type="number"
            min={1}
            value={timelineWeeks}
            onChange={(e) => setTimelineWeeks(e.target.value)}
          />
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button onClick={onSave} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save config
        </Button>
      </div>
    </div>
  );
}
