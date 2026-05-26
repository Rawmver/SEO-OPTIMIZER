import React, { useState, useMemo } from "react";
import { useListSeoHistory, useDeleteSeoHistoryItem, getListSeoHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, Calendar, FileText, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";

export function History() {
  const { data: history, isLoading } = useListSeoHistory();
  const deleteItem = useDeleteSeoHistoryItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    if (!search.trim()) return history;
    const term = search.toLowerCase();
    return history.filter(
      (item) => 
        item.rawTitle.toLowerCase().includes(term) || 
        item.optimizedTitle.toLowerCase().includes(term) ||
        item.keywords.some(k => k.toLowerCase().includes(term))
    );
  }, [history, search]);

  const handleDelete = (id: number) => {
    deleteItem.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSeoHistoryQueryKey() });
        toast({
          title: "Deleted",
          description: "History item removed successfully.",
        });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Optimization Log</h1>
          <p className="text-muted-foreground">Review and manage your past SEO optimizations.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search titles or keywords..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-16 bg-muted/20" />
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-xl border-muted bg-muted/5">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="text-lg font-semibold text-foreground">No records found</h3>
          <p className="text-muted-foreground mt-1">
            {search ? "Try a different search term." : "Start optimizing content to build your history."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <HistoryItemCard key={item.id} item={item} onDelete={() => handleDelete(item.id)} isDeleting={deleteItem.isPending && deleteItem.variables?.id === item.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryItemCard({ item, onDelete, isDeleting }: { item: any, onDelete: () => void, isDeleting: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-muted transition-colors hover:border-primary/20">
        <CardHeader className="p-4 bg-muted/10">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Calendar className="w-3 h-3" />
                {format(new Date(item.createdAt), "MMM d, yyyy • h:mm a")}
                <span className="mx-1">•</span>
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded">T: {item.titleScore} / D: {item.descriptionScore}</span>
              </div>
              <h3 className="text-base font-bold truncate text-foreground/90">{item.optimizedTitle}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">{item.optimizedDescription}</p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="p-4 pt-4 border-t space-y-4 bg-background">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3 rounded-lg bg-muted/20 border border-muted/50">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original</span>
                <p className="text-sm font-medium text-foreground">{item.rawTitle}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.rawDescription}</p>
              </div>
              <div className="space-y-1.5 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Optimized</span>
                <p className="text-sm font-medium text-foreground">{item.optimizedTitle}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.optimizedDescription}</p>
              </div>
            </div>
            
            {item.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {item.keywords.map((kw: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs font-normal">
                    {kw}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
