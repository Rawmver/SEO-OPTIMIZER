import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { ApiError, GetKeywordSuggestionsParams, HealthStatus, ImageGenerationInput, ImageGenerationResult, KeywordSuggestions, SeoHistoryItem, SeoInput, SeoResult, SeoStats } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * Returns server health status
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Optimize SEO title and description using AI
 */
export declare const getOptimizeSeoUrl: () => string;
export declare const optimizeSeo: (seoInput: SeoInput, options?: RequestInit) => Promise<SeoResult>;
export declare const getOptimizeSeoMutationOptions: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof optimizeSeo>>, TError, {
        data: BodyType<SeoInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof optimizeSeo>>, TError, {
    data: BodyType<SeoInput>;
}, TContext>;
export type OptimizeSeoMutationResult = NonNullable<Awaited<ReturnType<typeof optimizeSeo>>>;
export type OptimizeSeoMutationBody = BodyType<SeoInput>;
export type OptimizeSeoMutationError = ErrorType<ApiError>;
/**
 * @summary Optimize SEO title and description using AI
 */
export declare const useOptimizeSeo: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof optimizeSeo>>, TError, {
        data: BodyType<SeoInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof optimizeSeo>>, TError, {
    data: BodyType<SeoInput>;
}, TContext>;
/**
 * @summary Generate a product image using DALL-E 3
 */
export declare const getGenerateImageUrl: () => string;
export declare const generateImage: (imageGenerationInput: ImageGenerationInput, options?: RequestInit) => Promise<ImageGenerationResult>;
export declare const getGenerateImageMutationOptions: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateImage>>, TError, {
        data: BodyType<ImageGenerationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof generateImage>>, TError, {
    data: BodyType<ImageGenerationInput>;
}, TContext>;
export type GenerateImageMutationResult = NonNullable<Awaited<ReturnType<typeof generateImage>>>;
export type GenerateImageMutationBody = BodyType<ImageGenerationInput>;
export type GenerateImageMutationError = ErrorType<ApiError>;
/**
 * @summary Generate a product image using DALL-E 3
 */
export declare const useGenerateImage: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateImage>>, TError, {
        data: BodyType<ImageGenerationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof generateImage>>, TError, {
    data: BodyType<ImageGenerationInput>;
}, TContext>;
/**
 * @summary List all previous SEO optimization requests
 */
export declare const getListSeoHistoryUrl: () => string;
export declare const listSeoHistory: (options?: RequestInit) => Promise<SeoHistoryItem[]>;
export declare const getListSeoHistoryQueryKey: () => readonly ["/api/seo/history"];
export declare const getListSeoHistoryQueryOptions: <TData = Awaited<ReturnType<typeof listSeoHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSeoHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSeoHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSeoHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof listSeoHistory>>>;
export type ListSeoHistoryQueryError = ErrorType<unknown>;
/**
 * @summary List all previous SEO optimization requests
 */
export declare function useListSeoHistory<TData = Awaited<ReturnType<typeof listSeoHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSeoHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get a specific SEO history item by ID
 */
export declare const getGetSeoHistoryItemUrl: (id: number) => string;
export declare const getSeoHistoryItem: (id: number, options?: RequestInit) => Promise<SeoHistoryItem>;
export declare const getGetSeoHistoryItemQueryKey: (id: number) => readonly [`/api/seo/history/${number}`];
export declare const getGetSeoHistoryItemQueryOptions: <TData = Awaited<ReturnType<typeof getSeoHistoryItem>>, TError = ErrorType<ApiError>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSeoHistoryItem>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSeoHistoryItem>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSeoHistoryItemQueryResult = NonNullable<Awaited<ReturnType<typeof getSeoHistoryItem>>>;
export type GetSeoHistoryItemQueryError = ErrorType<ApiError>;
/**
 * @summary Get a specific SEO history item by ID
 */
export declare function useGetSeoHistoryItem<TData = Awaited<ReturnType<typeof getSeoHistoryItem>>, TError = ErrorType<ApiError>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSeoHistoryItem>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Delete a specific SEO history item
 */
export declare const getDeleteSeoHistoryItemUrl: (id: number) => string;
export declare const deleteSeoHistoryItem: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteSeoHistoryItemMutationOptions: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSeoHistoryItem>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteSeoHistoryItem>>, TError, {
    id: number;
}, TContext>;
export type DeleteSeoHistoryItemMutationResult = NonNullable<Awaited<ReturnType<typeof deleteSeoHistoryItem>>>;
export type DeleteSeoHistoryItemMutationError = ErrorType<ApiError>;
/**
 * @summary Delete a specific SEO history item
 */
export declare const useDeleteSeoHistoryItem: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSeoHistoryItem>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteSeoHistoryItem>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Get Google keyword suggestions for a search query
 */
export declare const getGetKeywordSuggestionsUrl: (params: GetKeywordSuggestionsParams) => string;
export declare const getKeywordSuggestions: (params: GetKeywordSuggestionsParams, options?: RequestInit) => Promise<KeywordSuggestions>;
export declare const getGetKeywordSuggestionsQueryKey: (params?: GetKeywordSuggestionsParams) => readonly ["/api/seo/keyword-suggestions", ...GetKeywordSuggestionsParams[]];
export declare const getGetKeywordSuggestionsQueryOptions: <TData = Awaited<ReturnType<typeof getKeywordSuggestions>>, TError = ErrorType<ApiError>>(params: GetKeywordSuggestionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getKeywordSuggestions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getKeywordSuggestions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetKeywordSuggestionsQueryResult = NonNullable<Awaited<ReturnType<typeof getKeywordSuggestions>>>;
export type GetKeywordSuggestionsQueryError = ErrorType<ApiError>;
/**
 * @summary Get Google keyword suggestions for a search query
 */
export declare function useGetKeywordSuggestions<TData = Awaited<ReturnType<typeof getKeywordSuggestions>>, TError = ErrorType<ApiError>>(params: GetKeywordSuggestionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getKeywordSuggestions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get summary statistics for SEO optimizations
 */
export declare const getGetSeoStatsUrl: () => string;
export declare const getSeoStats: (options?: RequestInit) => Promise<SeoStats>;
export declare const getGetSeoStatsQueryKey: () => readonly ["/api/seo/stats"];
export declare const getGetSeoStatsQueryOptions: <TData = Awaited<ReturnType<typeof getSeoStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSeoStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSeoStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSeoStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getSeoStats>>>;
export type GetSeoStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get summary statistics for SEO optimizations
 */
export declare function useGetSeoStats<TData = Awaited<ReturnType<typeof getSeoStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSeoStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map