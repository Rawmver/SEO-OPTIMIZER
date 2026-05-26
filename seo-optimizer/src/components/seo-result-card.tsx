import React, { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Lightbulb,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Globe,
  ShoppingCart,
  Tag,
  BarChart2,
  Zap,
  Target,
  Swords,
  ImageIcon,
  Hash,
  User,
  Sparkles,
  BookOpen,
  Package,
  ListChecks,
  Ruler,
  Loader2,
  Wand2,
  Download,
  LayoutGrid,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateImage } from "@workspace/api-client-react";

interface KeywordStat { keyword: string; trend: string; rank: number; competition: string; }
interface AmazonListing { title: string; bulletPoints: string[]; description: string; searchTerms: string[]; score?: number; }
interface ThumbnailImageItem {
  order: number;
  type: string;
  description: string;
  aiPrompt: string;
}

interface ThumbnailStrategy {
  hookText: string;
  secondaryHook?: string;
  colorScheme: string;
  colorPsychology: string;
  thumbnailLayout: string;
  mobileScore: number;
  imageSequence: ThumbnailImageItem[];
}

interface EbayListing {
  title: string;
  titleVariations?: string[];
  buyerType?: string;
  emotionalOverview?: string;
  benefitFeatures?: string[];
  description: string;
  itemSpecifics?: string[];
  lifestyleUseCases?: string[];
  trustNotes?: string[];
  softCta?: string;
  thumbnailStrategy?: ThumbnailStrategy;
  sellingTips?: string[];
  score?: number;
}
interface WebsiteListing { metaTitle: string; metaDescription: string; h1: string; openGraphTitle?: string; openGraphDescription?: string; score?: number; }
interface TiktokListing { hook: string; caption: string; hashtags: string[]; cta: string; viralAngle?: string; emotionalHook?: string; score?: number; }
interface ShopifyListing { productTitle: string; description: string; seoTitle: string; seoDescription: string; tags?: string[]; collectionSuggestion?: string; score?: number; }
interface OtherPlatforms {
  etsy?: { title?: string; description?: string; tags?: string[] };
  walmart?: { title?: string; description?: string };
  googleShopping?: { title?: string; description?: string };
}
interface BuyerIntelligence {
  intentType: string;
  intentConfidence: number;
  emotionalTriggers: string[];
  buyerPersona: string;
  painPoints?: string[];
  conversionTips: string[];
  thumbnailSuggestions?: string[];
}
interface CompetitivePositioning {
  uniqueSellingPoints: string[];
  pricePositioning: string;
  competitiveAdvantages: string[];
  marketingAngles?: string[];
  weaknesses?: string[];
}

interface MasterListing {
  productType: string;
  psychologyAngle: string;
  masterCopy: string;
  features: string[];
  specifications: string[];
  packageIncludes: string[];
}

interface SeoResultCardProps {
  productImages?: string[];
  result: {
    optimizedTitle: string;
    optimizedDescription: string;
    titleScore: number;
    descriptionScore: number;
    keywords: string[];
    suggestions: string[];
    keywordDensity: number;
    keywordStats?: KeywordStat[] | null;
    psychologyStrategies?: string[] | null;
    masterListing?: MasterListing | null;
    amazonListing?: AmazonListing | null;
    ebayListing?: EbayListing | null;
    websiteListing?: WebsiteListing | null;
    tiktokListing?: TiktokListing | null;
    shopifyListing?: ShopifyListing | null;
    otherPlatforms?: OtherPlatforms | null;
    buyerIntelligence?: BuyerIntelligence | null;
    competitivePositioning?: CompetitivePositioning | null;
  };
}

function CopyButton({ text, size = "sm" }: { text: string; size?: "sm" | "xs" }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="icon"
      variant="ghost"
      className={size === "xs" ? "h-6 w-6" : "h-7 w-7"}
      onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
    </Button>
  );
}

function ScorePill({ score, label }: { score: number; label: string }) {
  const bg = score >= 85 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : score >= 70 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-xl font-bold px-2.5 py-0.5 rounded-lg tabular-nums ${bg}`}>{score}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
}

function CopyField({ label, value, mono, charCount = true }: { label: string; value: string; mono?: boolean; charCount?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-1">
          {charCount && <span className="text-[10px] text-muted-foreground">{value.length} chars</span>}
          <CopyButton text={value} />
        </div>
      </div>
      <p className={`text-sm text-foreground/90 p-2.5 bg-muted/30 rounded-md border leading-relaxed ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{children}</span>;
}

export function SeoResultCard({ result, productImages }: SeoResultCardProps) {
  const bi = result.buyerIntelligence;
  const cp = result.competitivePositioning;
  type ImageSize = "1024x1024" | "1536x1024" | "1024x1536";
  const [dalleState, setDalleState] = useState<Record<string, { loading: boolean; b64Json?: string; error?: string }>>({});
  const [selectedSize, setSelectedSize] = useState<ImageSize>("1024x1024");
  const [bulkGenerating, setBulkGenerating] = useState(false);

  const handleGenerateDalle = useCallback(async (key: string, prompt: string, size?: ImageSize) => {
    setDalleState(prev => ({ ...prev, [key]: { loading: true } }));
    try {
      const res = await generateImage({
        prompt,
        size: size ?? selectedSize,
        ...(productImages && productImages.length > 0 ? { images: productImages } : {}),
      });
      setDalleState(prev => ({ ...prev, [key]: { loading: false, b64Json: res.b64Json } }));
    } catch {
      setDalleState(prev => ({ ...prev, [key]: { loading: false, error: "Generation failed. Try again." } }));
    }
  }, [selectedSize, productImages]);

  const handleBulkGenerate = useCallback(async (imageSequence: { order: number; aiPrompt: string }[]) => {
    setBulkGenerating(true);
    for (const img of imageSequence) {
      const key = `dalle-${img.order}`;
      if (!dalleState[key]?.b64Json) {
        await handleGenerateDalle(key, img.aiPrompt, selectedSize);
        await new Promise(r => setTimeout(r, 800));
      }
    }
    setBulkGenerating(false);
  }, [dalleState, handleGenerateDalle, selectedSize]);

  const downloadImage = useCallback((b64Json: string, filename: string) => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${b64Json}`;
    link.download = `${filename.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.click();
  }, []);
  const intentColors: Record<string, string> = {
    practical: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    emotional: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    budget: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    premium: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">

      {/* Score Bar */}
      <Card className="border-muted/60 shadow-sm">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-around flex-wrap gap-3">
            <ScorePill score={result.titleScore} label="Title" />
            <div className="h-8 w-px bg-muted hidden sm:block" />
            <ScorePill score={result.descriptionScore} label="Desc" />
            {result.amazonListing?.score && <><div className="h-8 w-px bg-muted hidden sm:block" /><ScorePill score={result.amazonListing.score} label="Amazon" /></>}
            {result.ebayListing?.score && <><div className="h-8 w-px bg-muted hidden sm:block" /><ScorePill score={result.ebayListing.score} label="eBay" /></>}
            {result.tiktokListing?.score && <><div className="h-8 w-px bg-muted hidden sm:block" /><ScorePill score={result.tiktokListing.score} label="TikTok" /></>}
            {result.shopifyListing?.score && <><div className="h-8 w-px bg-muted hidden sm:block" /><ScorePill score={result.shopifyListing.score} label="Shopify" /></>}
          </div>
        </CardContent>
      </Card>

      {/* Buyer Intelligence */}
      {bi && (
        <Card className="border-indigo-200 dark:border-indigo-900/40 shadow-sm">
          <CardHeader className="pb-3 border-b border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-900/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <User className="w-4 h-4" />
              Buyer Intelligence
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium capitalize ${intentColors[bi.intentType] ?? "bg-muted text-muted-foreground"}`}>
                {bi.intentType} buyer · {bi.intentConfidence}% confidence
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <SectionLabel>Buyer Persona</SectionLabel>
              <p className="mt-1 text-sm text-foreground/80 italic">{bi.buyerPersona}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <SectionLabel>Emotional Triggers</SectionLabel>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {bi.emotionalTriggers.map((t, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-indigo-200 text-indigo-700 dark:text-indigo-400">{t}</Badge>
                  ))}
                </div>
              </div>
              {bi.painPoints && bi.painPoints.length > 0 && (
                <div>
                  <SectionLabel>Pain Points Solved</SectionLabel>
                  <ul className="mt-2 space-y-1">
                    {bi.painPoints.map((p, i) => (
                      <li key={i} className="flex gap-2 text-xs text-foreground/80">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <SectionLabel>Conversion Tips</SectionLabel>
              <div className="mt-2 space-y-1.5">
                {bi.conversionTips.map((tip, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-md border border-indigo-100 dark:border-indigo-900/30">
                    <Zap className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
            {bi.thumbnailSuggestions && bi.thumbnailSuggestions.length > 0 && (
              <div>
                <SectionLabel>AI Thumbnail Concepts</SectionLabel>
                <div className="mt-2 space-y-1.5">
                  {bi.thumbnailSuggestions.map((s, i) => (
                    <div key={i} className="flex gap-2 items-start text-sm p-2 bg-muted/30 rounded-md border">
                      <ImageIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-foreground/80 text-xs">{s}</span>
                      <CopyButton text={s} size="xs" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Keyword Intelligence */}
      {result.keywordStats && result.keywordStats.length > 0 && (
        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="pb-2 border-b border-muted/50 bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              Keyword Intelligence
              <Badge variant="outline" className="ml-auto text-xs">{result.keywordStats.length} keywords</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 pb-3">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-1 pb-1.5">
              <SectionLabel>Keyword</SectionLabel>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase w-10 text-center">Rank</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase w-12 text-center">Trend</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase w-16 text-center">Comp.</span>
            </div>
            {result.keywordStats.slice(0, 12).map((stat, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-1 py-1 rounded hover:bg-muted/30 transition-colors">
                <span className="text-sm font-medium truncate">{stat.keyword}</span>
                <span className="text-xs text-muted-foreground w-10 text-center">#{stat.rank}</span>
                <div className="w-12 flex justify-center">
                  {stat.trend === "high" ? <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                    : stat.trend === "medium" ? <Minus className="w-3.5 h-3.5 text-yellow-500" />
                    : <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <div className="w-16 flex justify-center gap-0.5">
                  {[1, 2, 3].map(d => {
                    const filled = stat.competition === "high" ? 3 : stat.competition === "medium" ? 2 : 1;
                    const col = stat.competition === "high" ? "bg-red-400" : stat.competition === "medium" ? "bg-yellow-400" : "bg-green-400";
                    return <div key={d} className={`w-1.5 h-1.5 rounded-full ${d <= filled ? col : "bg-muted"}`} />;
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Platform Tabs */}
      <Tabs defaultValue={result.amazonListing ? "amazon" : result.ebayListing ? "ebay" : result.tiktokListing ? "tiktok" : "website"}>
        <TabsList className="w-full grid grid-cols-5 h-9">
          <TabsTrigger value="amazon" disabled={!result.amazonListing} className="text-xs gap-1 px-1">
            <ShoppingCart className="w-3 h-3" /><span className="hidden sm:inline">Amazon</span>
          </TabsTrigger>
          <TabsTrigger value="ebay" disabled={!result.ebayListing} className="text-xs gap-1 px-1">
            <Tag className="w-3 h-3" /><span className="hidden sm:inline">eBay</span>
          </TabsTrigger>
          <TabsTrigger value="tiktok" disabled={!result.tiktokListing} className="text-xs gap-1 px-1">
            <Zap className="w-3 h-3" /><span className="hidden sm:inline">TikTok</span>
          </TabsTrigger>
          <TabsTrigger value="shopify" disabled={!result.shopifyListing} className="text-xs gap-1 px-1">
            <Globe className="w-3 h-3" /><span className="hidden sm:inline">Shopify</span>
          </TabsTrigger>
          <TabsTrigger value="more" disabled={!result.otherPlatforms && !result.websiteListing} className="text-xs gap-1 px-1">
            <BarChart2 className="w-3 h-3" /><span className="hidden sm:inline">More</span>
          </TabsTrigger>
        </TabsList>

        {/* Amazon */}
        {result.amazonListing && (
          <TabsContent value="amazon" className="mt-3 space-y-3">
            <Card className="border-[#FF9900]/30 shadow-sm">
              <CardHeader className="pb-3 border-b border-[#FF9900]/20 bg-[#FF9900]/5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#FF9900]" />
                  Amazon Listing
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <CopyField label="Product Title (≤200 chars)" value={result.amazonListing.title} />
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <SectionLabel>Bullet Points</SectionLabel>
                    <CopyButton text={result.amazonListing.bulletPoints.join("\n")} />
                  </div>
                  {result.amazonListing.bulletPoints.map((bp, i) => (
                    <div key={i} className="flex gap-2 items-start p-2.5 bg-[#FF9900]/5 rounded-md border border-[#FF9900]/20 text-sm">
                      <span className="text-[#FF9900] font-bold shrink-0">•</span>
                      <span className="text-foreground/90">{bp.replace(/^•\s*/, "")}</span>
                    </div>
                  ))}
                </div>
                {result.amazonListing.searchTerms.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <SectionLabel>Backend Search Terms</SectionLabel>
                      <CopyButton text={result.amazonListing.searchTerms.join(" ")} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.amazonListing.searchTerms.map((t, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]/20">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <CopyField label="Product Description" value={result.amazonListing.description} charCount={false} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* eBay */}
        {result.ebayListing && (
          <TabsContent value="ebay" className="mt-3 space-y-3">
            <Card className="border-[#0064D2]/30 shadow-sm">
              <CardHeader className="pb-3 border-b border-[#0064D2]/20 bg-[#0064D2]/5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#0064D2]">
                  <Tag className="w-4 h-4" />
                  eBay Listing
                  <span className="ml-1 text-xs font-normal text-[#0064D2]/70">Cassini-Optimized · 7-Section Unified</span>
                  {result.ebayListing.buyerType && (
                    <Badge variant="outline" className="ml-auto text-xs border-[#0064D2]/40 text-[#0064D2] capitalize">
                      {result.ebayListing.buyerType} buyer
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-5">

                {/* Primary Title + A/B Variations */}
                <div className="space-y-2">
                  <CopyField label="Primary Title (≤80 chars — Cassini-optimized)" value={result.ebayListing.title} />
                  {result.ebayListing.titleVariations && result.ebayListing.titleVariations.length > 0 && (
                    <div className="space-y-1.5">
                      <SectionLabel>A/B Title Variations to Test</SectionLabel>
                      {result.ebayListing.titleVariations.map((v, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 bg-[#0064D2]/5 rounded-md border border-[#0064D2]/15">
                          <span className="font-bold text-[#0064D2] text-xs shrink-0 mt-0.5">{String.fromCharCode(65 + i)}.</span>
                          <span className="text-sm flex-1">{v}</span>
                          <CopyButton text={v} size="xs" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 1 — Emotional Overview */}
                {result.ebayListing.emotionalOverview && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <SectionLabel>① Emotional Product Overview</SectionLabel>
                      <CopyButton text={result.ebayListing.emotionalOverview} />
                    </div>
                    <p className="text-sm text-foreground/90 p-3 bg-[#0064D2]/5 rounded-md border border-[#0064D2]/15 leading-relaxed italic">
                      {result.ebayListing.emotionalOverview}
                    </p>
                  </div>
                )}

                {/* Section 2 — Benefit Features */}
                {result.ebayListing.benefitFeatures && result.ebayListing.benefitFeatures.length > 0 && (
                  <div className="space-y-2">
                    <SectionLabel>② Benefit-Driven Features</SectionLabel>
                    <ul className="space-y-1.5 mt-1">
                      {result.ebayListing.benefitFeatures.map((f, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0064D2] shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Section 3 — Item Specifics */}
                {result.ebayListing.itemSpecifics && result.ebayListing.itemSpecifics.length > 0 && (
                  <div className="space-y-2">
                    <SectionLabel>③ Item Specifics (Trust-Optimized)</SectionLabel>
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      {result.ebayListing.itemSpecifics.map((s, i) => (
                        <div key={i} className="text-xs p-2 bg-muted/30 rounded border font-mono">{s}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 4 — Lifestyle Use Cases */}
                {result.ebayListing.lifestyleUseCases && result.ebayListing.lifestyleUseCases.length > 0 && (
                  <div className="space-y-2">
                    <SectionLabel>④ Lifestyle Use Cases</SectionLabel>
                    <div className="space-y-1.5 mt-1">
                      {result.ebayListing.lifestyleUseCases.map((u, i) => (
                        <div key={i} className="flex gap-2 text-sm p-2.5 bg-muted/20 rounded-md border">
                          <User className="w-3.5 h-3.5 text-[#0064D2] shrink-0 mt-0.5" />
                          {u}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 6 — Trust Notes */}
                {result.ebayListing.trustNotes && result.ebayListing.trustNotes.length > 0 && (
                  <div className="space-y-2">
                    <SectionLabel>⑥ Trust Reinforcement Notes</SectionLabel>
                    <div className="space-y-1.5 mt-1">
                      {result.ebayListing.trustNotes.map((n, i) => (
                        <div key={i} className="flex gap-2 text-sm p-2.5 bg-green-50/50 dark:bg-green-900/10 rounded-md border border-green-100 dark:border-green-900/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 7 — Soft CTA */}
                {result.ebayListing.softCta && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <SectionLabel>⑦ Soft Psychological CTA</SectionLabel>
                      <CopyButton text={result.ebayListing.softCta} />
                    </div>
                    <p className="text-sm text-foreground/90 p-3 bg-[#0064D2]/5 rounded-md border border-[#0064D2]/20 leading-relaxed font-medium">
                      {result.ebayListing.softCta}
                    </p>
                  </div>
                )}

                {/* Thumbnail & Image Strategy */}
                {result.ebayListing.thumbnailStrategy && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#0064D2]" />
                      <span className="text-sm font-semibold text-[#0064D2]">Thumbnail & Image Strategy</span>
                      {result.ebayListing.thumbnailStrategy.mobileScore && (
                        <Badge variant="outline" className="ml-auto text-xs border-[#0064D2]/40 text-[#0064D2]">
                          Mobile CTR Score: {result.ebayListing.thumbnailStrategy.mobileScore}/100
                        </Badge>
                      )}
                    </div>

                    {/* Hook texts */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-[#0064D2]/5 rounded-md border border-[#0064D2]/20 space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#0064D2]/70">Primary Hook</span>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground flex-1">{result.ebayListing.thumbnailStrategy.hookText}</p>
                          <CopyButton text={result.ebayListing.thumbnailStrategy.hookText} size="xs" />
                        </div>
                      </div>
                      {result.ebayListing.thumbnailStrategy.secondaryHook && (
                        <div className="p-3 bg-muted/30 rounded-md border space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Secondary Hook</span>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground flex-1">{result.ebayListing.thumbnailStrategy.secondaryHook}</p>
                            <CopyButton text={result.ebayListing.thumbnailStrategy.secondaryHook} size="xs" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Color strategy */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 p-2.5 bg-muted/20 rounded-md border">
                        <span className="text-xs font-semibold text-muted-foreground shrink-0">Color Scheme:</span>
                        <span className="text-sm font-medium">{result.ebayListing.thumbnailStrategy.colorScheme}</span>
                      </div>
                      <p className="text-xs text-muted-foreground px-1">{result.ebayListing.thumbnailStrategy.colorPsychology}</p>
                    </div>

                    {/* Thumbnail layout */}
                    <div className="space-y-1.5">
                      <SectionLabel>Hero Thumbnail Composition</SectionLabel>
                      <p className="text-sm text-foreground/90 p-2.5 bg-muted/20 rounded-md border leading-relaxed">
                        {result.ebayListing.thumbnailStrategy.thumbnailLayout}
                      </p>
                    </div>

                    {/* 9-image sequence */}
                    {result.ebayListing.thumbnailStrategy.imageSequence && result.ebayListing.thumbnailStrategy.imageSequence.length > 0 && (
                      <div className="space-y-3">
                        {/* Controls bar */}
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-violet-950/30 border border-violet-900/30">
                          <ImagePlus className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                          <span className="text-xs font-semibold text-violet-300 flex-1">AI Image Generator</span>
                          {/* Size selector */}
                          <select
                            value={selectedSize}
                            onChange={e => setSelectedSize(e.target.value as typeof selectedSize)}
                            className="text-[11px] bg-violet-950/60 border border-violet-800/50 text-violet-300 rounded px-1.5 py-1 cursor-pointer focus:outline-none"
                          >
                            <option value="1024x1024">Square (1:1)</option>
                            <option value="1536x1024">Landscape (3:2)</option>
                            <option value="1024x1536">Portrait (2:3)</option>
                          </select>
                          {/* Bulk generate */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] px-2.5 border-violet-700/50 text-violet-300 hover:bg-violet-900/30 hover:border-violet-600/60"
                            disabled={bulkGenerating}
                            onClick={() => handleBulkGenerate(result.ebayListing!.thumbnailStrategy!.imageSequence)}
                          >
                            {bulkGenerating ? (
                              <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Generating...</>
                            ) : (
                              <><LayoutGrid className="w-3 h-3 mr-1" />Generate All 9</>
                            )}
                          </Button>
                        </div>

                        <SectionLabel>9-Image Sequence (Conversion-Optimized Order)</SectionLabel>
                        <div className="space-y-2">
                          {result.ebayListing.thumbnailStrategy.imageSequence.map((img) => {
                            const imgKey = `dalle-${img.order}`;
                            const ds = dalleState[imgKey];
                            const dataUrl = ds?.b64Json ? `data:image/png;base64,${ds.b64Json}` : null;
                            return (
                              <div key={img.order} className="rounded-md border border-border/60 overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2 bg-[#0064D2]/8 border-b border-[#0064D2]/15">
                                  <span className="text-xs font-bold text-[#4D9EFF] w-5 shrink-0">#{img.order}</span>
                                  <span className="text-xs font-semibold text-foreground flex-1">{img.type}</span>
                                  {dataUrl && (
                                    <button
                                      onClick={() => downloadImage(ds!.b64Json!, img.type)}
                                      className="text-[10px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                      <Download className="w-3 h-3" />
                                      Save
                                    </button>
                                  )}
                                </div>
                                <div className="p-3 space-y-2">
                                  <p className="text-xs text-foreground/70 leading-relaxed">{img.description}</p>
                                  {/* AI Prompt with copy */}
                                  <div className="flex items-start gap-2 p-2 bg-violet-950/20 rounded border border-violet-900/20">
                                    <span className="text-[10px] font-semibold text-violet-400 shrink-0 mt-0.5">PROMPT</span>
                                    <p className="text-xs text-foreground/80 leading-relaxed flex-1">{img.aiPrompt}</p>
                                    <CopyButton text={img.aiPrompt} size="xs" />
                                  </div>
                                  {/* Generated image display */}
                                  {dataUrl ? (
                                    <div className="space-y-2">
                                      <div className="relative group rounded-md overflow-hidden border border-violet-900/30">
                                        <img
                                          src={dataUrl}
                                          alt={img.type}
                                          className="w-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1 text-xs h-7 border-emerald-800/50 text-emerald-400 hover:bg-emerald-900/20"
                                          onClick={() => downloadImage(ds!.b64Json!, img.type)}
                                        >
                                          <Download className="w-3 h-3 mr-1" />
                                          Download PNG
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1 text-xs h-7 border-violet-800/50 text-violet-400 hover:bg-violet-900/20"
                                          disabled={ds?.loading}
                                          onClick={() => handleGenerateDalle(imgKey, img.aiPrompt)}
                                        >
                                          {ds?.loading ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <><Wand2 className="w-3 h-3 mr-1" />Regenerate</>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full text-xs h-8 border-violet-800/40 text-violet-400 hover:bg-violet-900/20 hover:border-violet-700/60 transition-all group"
                                      disabled={ds?.loading}
                                      onClick={() => handleGenerateDalle(imgKey, img.aiPrompt)}
                                    >
                                      {ds?.loading ? (
                                        <>
                                          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                          Generating image...
                                        </>
                                      ) : (
                                        <>
                                          <Wand2 className="w-3 h-3 mr-1.5 group-hover:scale-110 transition-transform" />
                                          Generate AI Image
                                        </>
                                      )}
                                    </Button>
                                  )}
                                  {ds?.error && (
                                    <p className="text-xs text-destructive/80 text-center bg-destructive/10 rounded py-1">{ds.error}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Full Unified Description */}
                <div className="border-t pt-4 space-y-2">
                  <CopyField label="Full Unified Description (copy to eBay)" value={result.ebayListing.description} charCount={false} />
                </div>

                {/* Seller Tips */}
                {result.ebayListing.sellingTips && result.ebayListing.sellingTips.length > 0 && (
                  <div className="space-y-2">
                    <SectionLabel>CJ Dropshipping Seller Tips</SectionLabel>
                    <div className="space-y-1.5 mt-1">
                      {result.ebayListing.sellingTips.map((tip, i) => (
                        <div key={i} className="flex gap-2 text-sm p-2.5 bg-[#0064D2]/5 rounded-md border border-[#0064D2]/15">
                          <Lightbulb className="w-4 h-4 text-[#0064D2] shrink-0 mt-0.5" />
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Copy Full eBay Listing */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-[#0064D2]/30 text-[#0064D2] hover:bg-[#0064D2]/5"
                  onClick={async () => {
                    const e = result.ebayListing!;
                    const parts = [
                      `TITLE: ${e.title}`,
                      e.emotionalOverview ? `\n${e.emotionalOverview}` : "",
                      e.benefitFeatures?.length ? `\nFEATURES:\n${e.benefitFeatures.map(f => `• ${f}`).join("\n")}` : "",
                      e.itemSpecifics?.length ? `\nSPECIFICATIONS:\n${e.itemSpecifics.join("\n")}` : "",
                      e.lifestyleUseCases?.length ? `\nPERFECT FOR:\n${e.lifestyleUseCases.map(u => `• ${u}`).join("\n")}` : "",
                      e.trustNotes?.length ? `\n${e.trustNotes.join(" ")}` : "",
                      e.softCta ? `\n${e.softCta}` : "",
                    ].filter(Boolean).join("\n");
                    await navigator.clipboard.writeText(parts);
                  }}
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy Full eBay Listing (7 Sections)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* TikTok Shop */}
        {result.tiktokListing && (
          <TabsContent value="tiktok" className="mt-3 space-y-3">
            <Card className="border-[#FE2C55]/30 shadow-sm">
              <CardHeader className="pb-3 border-b border-[#FE2C55]/20 bg-gradient-to-r from-[#FE2C55]/5 to-[#25F4EE]/5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#FE2C55]" />
                  TikTok Shop
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <SectionLabel>3-Second Hook 🎣</SectionLabel>
                    <CopyButton text={result.tiktokListing.hook} />
                  </div>
                  <div className="p-3 bg-gradient-to-r from-[#FE2C55]/10 to-[#25F4EE]/10 rounded-lg border border-[#FE2C55]/20 text-sm font-semibold text-center">
                    {result.tiktokListing.hook}
                  </div>
                </div>
                <CopyField label="Caption" value={result.tiktokListing.caption} charCount={false} />
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <SectionLabel>CTA Overlay</SectionLabel>
                    <CopyButton text={result.tiktokListing.cta} />
                  </div>
                  <div className="p-2.5 bg-[#FE2C55]/10 rounded-md border border-[#FE2C55]/20 text-sm font-bold text-[#FE2C55] text-center">
                    {result.tiktokListing.cta}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <SectionLabel>Hashtags</SectionLabel>
                    <CopyButton text={result.tiktokListing.hashtags.map(h => `#${h}`).join(" ")} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.tiktokListing.hashtags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-[#FE2C55]/30 text-[#FE2C55]">
                        <Hash className="w-2.5 h-2.5 mr-0.5" />{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                {result.tiktokListing.viralAngle && (
                  <div className="space-y-1">
                    <SectionLabel>Viral Video Concept 🎬</SectionLabel>
                    <div className="p-3 bg-muted/30 rounded-md border text-sm text-foreground/80 mt-1">
                      {result.tiktokListing.viralAngle}
                    </div>
                  </div>
                )}
                {result.tiktokListing.emotionalHook && (
                  <div className="space-y-1">
                    <SectionLabel>Emotional Trigger</SectionLabel>
                    <div className="p-3 bg-pink-50/50 dark:bg-pink-900/10 rounded-md border border-pink-100 dark:border-pink-900/30 text-sm mt-1">
                      {result.tiktokListing.emotionalHook}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Shopify */}
        {result.shopifyListing && (
          <TabsContent value="shopify" className="mt-3 space-y-3">
            <Card className="border-[#96BF48]/30 shadow-sm">
              <CardHeader className="pb-3 border-b border-[#96BF48]/20 bg-[#96BF48]/5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#96BF48]" />
                  Shopify Store
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <CopyField label="Product Title" value={result.shopifyListing.productTitle} />
                <CopyField label="Product Description" value={result.shopifyListing.description} charCount={false} />
                <CopyField label="SEO Title (50-60 chars)" value={result.shopifyListing.seoTitle} />
                <CopyField label="SEO Description (150-160 chars)" value={result.shopifyListing.seoDescription} />
                {result.shopifyListing.collectionSuggestion && (
                  <div className="space-y-1">
                    <SectionLabel>Suggested Collection</SectionLabel>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="border-[#96BF48]/40 text-[#96BF48] text-sm px-3 py-1">
                        {result.shopifyListing.collectionSuggestion}
                      </Badge>
                    </div>
                  </div>
                )}
                {result.shopifyListing.tags && result.shopifyListing.tags.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <SectionLabel>Product Tags</SectionLabel>
                      <CopyButton text={result.shopifyListing.tags.join(", ")} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.shopifyListing.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-[#96BF48]/10 text-[#96BF48] border-[#96BF48]/20">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* More (Website + Etsy + Walmart + Google Shopping) */}
        <TabsContent value="more" className="mt-3 space-y-3">
          {result.websiteListing && (
            <Card className="border-muted/60 shadow-sm">
              <CardHeader className="pb-3 border-b border-muted/50 bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />Own Website SEO
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <CopyField label="Meta Title" value={result.websiteListing.metaTitle} />
                <CopyField label="Meta Description" value={result.websiteListing.metaDescription} />
                <CopyField label="H1 Heading" value={result.websiteListing.h1} />
                {result.websiteListing.openGraphTitle && <CopyField label="Open Graph Title" value={result.websiteListing.openGraphTitle} />}
                {result.websiteListing.openGraphDescription && <CopyField label="Open Graph Description" value={result.websiteListing.openGraphDescription} />}
                <div className="space-y-1.5">
                  <SectionLabel>SERP Preview</SectionLabel>
                  <div className="bg-white dark:bg-[#202124] p-4 rounded-lg border shadow-sm mt-1">
                    <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] mb-0.5">yourwebsite.com</p>
                    <p className="text-[16px] text-[#1a0dab] dark:text-[#8ab4f8] leading-snug hover:underline cursor-pointer">{result.websiteListing.metaTitle}</p>
                    <p className="text-[13px] text-[#4d5156] dark:text-[#bdc1c6] leading-snug mt-0.5">{result.websiteListing.metaDescription}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {result.otherPlatforms?.etsy && (
            <Card className="border-[#F1641E]/30 shadow-sm">
              <CardHeader className="pb-2 border-b border-[#F1641E]/20 bg-[#F1641E]/5">
                <CardTitle className="text-sm font-semibold text-[#F1641E]">Etsy</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                {result.otherPlatforms.etsy.title && <CopyField label="Title" value={result.otherPlatforms.etsy.title} />}
                {result.otherPlatforms.etsy.description && <CopyField label="Description" value={result.otherPlatforms.etsy.description} charCount={false} />}
                {(result.otherPlatforms.etsy.tags ?? []).length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <SectionLabel>Tags</SectionLabel>
                      <CopyButton text={(result.otherPlatforms.etsy.tags ?? []).join(", ")} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(result.otherPlatforms.etsy.tags ?? []).map((t, i) => (
                        <Badge key={i} variant="outline" className="text-xs border-[#F1641E]/30 text-[#F1641E]">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {result.otherPlatforms?.walmart && (
            <Card className="border-[#0071CE]/30 shadow-sm">
              <CardHeader className="pb-2 border-b border-[#0071CE]/20 bg-[#0071CE]/5">
                <CardTitle className="text-sm font-semibold text-[#0071CE]">Walmart</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                {result.otherPlatforms.walmart.title && <CopyField label="Title" value={result.otherPlatforms.walmart.title} />}
                {result.otherPlatforms.walmart.description && <CopyField label="Description" value={result.otherPlatforms.walmart.description} charCount={false} />}
              </CardContent>
            </Card>
          )}
          {result.otherPlatforms?.googleShopping && (
            <Card className="border-[#4285F4]/30 shadow-sm">
              <CardHeader className="pb-2 border-b border-[#4285F4]/20 bg-[#4285F4]/5">
                <CardTitle className="text-sm font-semibold text-[#4285F4]">Google Shopping</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                {result.otherPlatforms.googleShopping.title && <CopyField label="Title" value={result.otherPlatforms.googleShopping.title} />}
                {result.otherPlatforms.googleShopping.description && <CopyField label="Description" value={result.otherPlatforms.googleShopping.description} charCount={false} />}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Master Listing */}
      {result.masterListing && (
        <Card className="border-emerald-200 dark:border-emerald-900/40 shadow-sm">
          <CardHeader className="pb-3 border-b border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <BookOpen className="w-4 h-4" />
              Master Listing
              <span className="ml-1 text-xs font-normal text-emerald-600 dark:text-emerald-500">Psychology-Driven Copywriting</span>
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 dark:text-emerald-400 capitalize">
                  {result.masterListing.productType}
                </Badge>
                <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 dark:text-emerald-400 capitalize">
                  {result.masterListing.psychologyAngle.replace(/-/g, " ")}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-5">
            {/* Unified Master Copy */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <SectionLabel>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    Master Copy
                    <span className="text-[10px] font-normal text-emerald-500/70 ml-1">emotion · persuasion · SEO — unified</span>
                  </span>
                </SectionLabel>
                <CopyButton text={result.masterListing.masterCopy} />
              </div>
              <div className="text-sm text-foreground/90 p-4 bg-gradient-to-b from-emerald-950/30 to-emerald-950/10 rounded-lg border border-emerald-900/30 leading-relaxed whitespace-pre-wrap space-y-0">
                {result.masterListing.masterCopy}
              </div>
            </div>

            {/* Features + Specs + Package grid */}
            <div className="grid sm:grid-cols-3 gap-4">
              {/* Features */}
              {result.masterListing.features.length > 0 && (
                <div className="sm:col-span-1">
                  <SectionLabel>
                    <span className="flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-emerald-500" />
                      Features
                    </span>
                  </SectionLabel>
                  <ul className="mt-2 space-y-1.5">
                    {result.masterListing.features.map((f, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specifications */}
              {result.masterListing.specifications.length > 0 && (
                <div className="sm:col-span-1">
                  <SectionLabel>
                    <span className="flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-emerald-500" />
                      Specifications
                    </span>
                  </SectionLabel>
                  <ul className="mt-2 space-y-1.5">
                    {result.masterListing.specifications.map((s, i) => (
                      <li key={i} className="text-sm py-1 px-2 bg-muted/30 rounded border text-foreground/80 font-mono text-xs">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Package Includes */}
              {result.masterListing.packageIncludes.length > 0 && (
                <div className="sm:col-span-1">
                  <SectionLabel>
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-500" />
                      Package Includes
                    </span>
                  </SectionLabel>
                  <ul className="mt-2 space-y-1.5">
                    {result.masterListing.packageIncludes.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">✓</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Full Copy Button */}
            <div className="pt-1 border-t border-emerald-100 dark:border-emerald-900/30">
              <Button
                size="sm"
                variant="outline"
                className="w-full border-emerald-200 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                onClick={async () => {
                  const ml = result.masterListing!;
                  const full = [
                    ml.masterCopy,
                    "",
                    "FEATURES:",
                    ...ml.features.map(f => `• ${f}`),
                    "",
                    "SPECIFICATIONS:",
                    ...ml.specifications,
                    "",
                    "PACKAGE INCLUDES:",
                    ...ml.packageIncludes,
                  ].join("\n");
                  await navigator.clipboard.writeText(full);
                }}
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copy Full Master Listing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitive Positioning */}
      {cp && (
        <Card className="border-orange-200 dark:border-orange-900/40 shadow-sm">
          <CardHeader className="pb-3 border-b border-orange-100 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-900/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <Swords className="w-4 h-4" />
              Competitive Positioning
              <Badge variant="outline" className="ml-auto text-xs border-orange-200 text-orange-700 dark:text-orange-400 capitalize">
                {cp.pricePositioning}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <SectionLabel>Unique Selling Points</SectionLabel>
                <ul className="mt-2 space-y-1.5">
                  {cp.uniqueSellingPoints.map((u, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <Target className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <SectionLabel>Competitive Advantages</SectionLabel>
                <ul className="mt-2 space-y-1.5">
                  {cp.competitiveAdvantages.map((a, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {cp.marketingAngles && cp.marketingAngles.length > 0 && (
              <div>
                <SectionLabel>Marketing Angles to A/B Test</SectionLabel>
                <div className="grid sm:grid-cols-2 gap-2 mt-2">
                  {cp.marketingAngles.map((angle, i) => (
                    <div key={i} className="flex gap-2 p-2.5 bg-orange-50/50 dark:bg-orange-900/10 rounded-md border border-orange-100 dark:border-orange-900/30 text-sm">
                      <span className="font-bold text-orange-500 shrink-0">{String.fromCharCode(65 + i)}.</span>
                      {angle}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {cp.weaknesses && cp.weaknesses.length > 0 && (
              <div>
                <SectionLabel>Buyer Objections + How to Handle</SectionLabel>
                <div className="mt-2 space-y-1.5">
                  {cp.weaknesses.map((w, i) => (
                    <div key={i} className="flex gap-2 text-sm p-2.5 bg-muted/30 rounded-md border">
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                      {w}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Psychology Strategies */}
      {result.psychologyStrategies && result.psychologyStrategies.length > 0 && (
        <Card className="border-purple-200 dark:border-purple-900/40 shadow-sm">
          <CardHeader className="pb-3 border-b border-purple-100 dark:border-purple-900/30 bg-purple-50/50 dark:bg-purple-900/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Brain className="w-4 h-4" />
              Psychology-Driven Strategies
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {result.psychologyStrategies.map((s, i) => (
              <div key={i} className="flex gap-3 text-sm p-3 bg-purple-50/40 dark:bg-purple-900/10 rounded-md border border-purple-100 dark:border-purple-900/30">
                <span className="font-bold text-purple-600 dark:text-purple-400 shrink-0">{i + 1}.</span>
                <span className="text-foreground/90">{s}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* SEO Tips */}
      {result.suggestions.length > 0 && (
        <Card className="border-muted/60 shadow-sm border-l-4 border-l-yellow-400">
          <CardHeader className="pb-3 border-b border-muted/50 bg-yellow-50/50 dark:bg-yellow-900/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              SEO Improvement Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2">
            {result.suggestions.map((s, i) => (
              <div key={i} className="flex gap-2 text-sm p-2.5 rounded-md bg-yellow-50/30 dark:bg-yellow-900/10">
                <CheckCircle2 className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                <span className="text-foreground/90">{s}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
