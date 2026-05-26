import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useOptimizeSeo,
  useGetKeywordSuggestions,
  getGetKeywordSuggestionsQueryKey,
  getListSeoHistoryQueryKey,
  getGetSeoStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SeoResultCard } from "@/components/seo-result-card";
import { Loader2, Sparkles, Wand2, Search, Upload, X, ImageIcon, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  rawTitle: z.string().min(1, "Title is required"),
  rawDescription: z.string().min(1, "Description is required"),
});

type FormValues = z.infer<typeof formSchema>;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const optimizeSeo = useOptimizeSeo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<{ file: File; dataUrl: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { rawTitle: "", rawDescription: "" },
  });

  const rawTitle = form.watch("rawTitle");
  const debouncedTitle = useDebounce(rawTitle.trim(), 500);
  const suggestionEnabled = debouncedTitle.length > 3;

  const { data: suggestionsData, isLoading: suggestionsLoading } = useGetKeywordSuggestions(
    { query: debouncedTitle },
    {
      query: {
        enabled: suggestionEnabled,
        queryKey: getGetKeywordSuggestionsQueryKey({ query: debouncedTitle }),
      },
    }
  );

  const suggestions = suggestionsData?.suggestions ?? [];

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const imageFiles = arr.filter(f => f.type.startsWith("image/")).slice(0, 4);
    const converted = await Promise.all(
      imageFiles.map(async (file) => ({ file, dataUrl: await fileToBase64(file) }))
    );
    setUploadedImages(prev => {
      const combined = [...prev, ...converted];
      return combined.slice(0, 4);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: FormValues) => {
    optimizeSeo.mutate(
      {
        data: {
          ...data,
          ...(uploadedImages.length > 0 ? { images: uploadedImages.map(i => i.dataUrl) } : {}),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSeoHistoryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSeoStatsQueryKey() });
          toast({ title: "Optimization Complete", description: "Your SEO content has been enhanced." });
        },
        onError: (err) => {
          toast({
            title: "Optimization Failed",
            description: err.message || "An unexpected error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text">AI Optimizer</h1>
        <p className="text-muted-foreground text-lg">
          Paste your raw copy — keywords and industry are detected automatically.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
        {/* Input Form */}
        <div className="space-y-4 sticky top-6">
          <Card className="border-border/60 shadow-lg shadow-black/20">
            <CardHeader className="bg-muted/20 border-b border-border/60 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                Content Input
              </CardTitle>
              <CardDescription>
                Enter your draft title and description. Keywords and industry are auto-detected.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="rawTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground/80">Draft Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Portable Mini Fan for Desk"
                            {...field}
                            className="h-10 bg-muted/30 border-border/60"
                            data-testid="input-raw-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rawDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground/80">Draft Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the product — features, materials, who it's for..."
                            className="resize-none min-h-[120px] bg-muted/30 border-border/60"
                            {...field}
                            data-testid="input-raw-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-primary/70" />
                        Product Images
                        <span className="text-xs font-normal text-muted-foreground ml-1">optional · up to 4 · AI analyzes them</span>
                      </label>
                      {uploadedImages.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setUploadedImages([])}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Drop Zone */}
                    <div
                      className={`relative rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-border/50 hover:border-primary/40 hover:bg-muted/20"
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && handleFiles(e.target.files)}
                      />

                      {uploadedImages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <Upload className="w-5 h-5 text-primary/70" />
                          </div>
                          <p className="text-sm font-medium text-foreground/70">Drop images here or click to upload</p>
                          <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP — up to 4 images</p>
                          <p className="text-xs text-primary/60 mt-1 font-medium">AI will analyze your actual product photos</p>
                        </div>
                      ) : (
                        <div className="p-3">
                          <div className="grid grid-cols-4 gap-2">
                            {uploadedImages.map((img, i) => (
                              <div key={i} className="relative group aspect-square rounded-md overflow-hidden border border-border/40">
                                <img
                                  src={img.dataUrl}
                                  alt={`Upload ${i + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                                    className="w-6 h-6 rounded-full bg-destructive flex items-center justify-center"
                                  >
                                    <X className="w-3.5 h-3.5 text-white" />
                                  </button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 font-medium">
                                  #{i + 1}
                                </div>
                              </div>
                            ))}
                            {uploadedImages.length < 4 && (
                              <div
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                className="aspect-square rounded-md border-2 border-dashed border-border/40 hover:border-primary/40 flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <Upload className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            {uploadedImages.length}/4 images · GPT-4o Vision will analyze these
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold transition-all bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                    disabled={optimizeSeo.isPending}
                    data-testid="button-optimize"
                  >
                    {optimizeSeo.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {uploadedImages.length > 0 ? "Analyzing images & optimizing..." : "Fetching keywords & analyzing..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Optimize Content
                        {uploadedImages.length > 0 && (
                          <span className="ml-2 text-xs bg-white/20 rounded-full px-2 py-0.5">
                            +{uploadedImages.length} image{uploadedImages.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Live Google Keyword Preview */}
          {suggestionEnabled && (
            <Card className="border-border/60 shadow-sm shadow-black/20" data-testid="card-keyword-suggestions">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/15">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" />
                  Keywords being fetched from Google
                  {suggestionsLoading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-auto" />
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  These will be passed to the AI automatically when you optimize
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {suggestionsLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="h-6 rounded-full bg-muted animate-pulse"
                        style={{ width: `${60 + i * 18}px` }}
                      />
                    ))}
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="flex flex-wrap gap-2" data-testid="suggestions-list">
                    {suggestions.map((kw, i) => (
                      <span
                        key={i}
                        data-testid={`suggestion-keyword-${i}`}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-primary/25 bg-primary/8 text-primary"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No suggestions found.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Area */}
        <div className="min-h-[400px]">
          {optimizeSeo.isPending ? (
            <div className="h-[400px] border border-border/40 rounded-xl flex flex-col items-center justify-center text-muted-foreground p-6 bg-card/50 backdrop-blur-sm">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wand2 className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" />
              </div>
              <p className="font-semibold text-lg text-foreground">Processing with AI...</p>
              <p className="text-sm text-center max-w-sm mt-2">
                {uploadedImages.length > 0
                  ? `Analyzing ${uploadedImages.length} product image${uploadedImages.length > 1 ? "s" : ""} with GPT-4o Vision, fetching live keywords, and generating optimized content.`
                  : "Fetching live Google keywords, detecting industry, and optimizing your content."
                }
              </p>
            </div>
          ) : optimizeSeo.data ? (
            <SeoResultCard result={optimizeSeo.data} productImages={uploadedImages.map(i => i.dataUrl)} />
          ) : (
            <div className="h-[400px] border border-border/40 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground p-6 bg-card/30">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 opacity-30" />
              </div>
              <p className="font-medium text-foreground/60">No results yet.</p>
              <p className="text-sm text-center max-w-xs mt-1 text-muted-foreground">
                Submit your draft content to see AI-optimized results and actionable tips.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
