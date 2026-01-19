import type {
  ApiClient,
  ApiRequestOptions,
  ApiResponsePayload,
} from "@hmcts/playwright-common";

export type ParallelGetOptions = {
  batchSize?: number;
  requestOptions?: ApiRequestOptions;
  perRequestOptions?: (
    path: string,
    index: number
  ) => ApiRequestOptions | undefined;
};

export async function parallelGet<T>(
  client: ApiClient,
  paths: string[],
  options: ParallelGetOptions = {}
): Promise<Array<ApiResponsePayload<T>>> {
  const batchSize = resolveBatchSize(options.batchSize);
  const results: Array<ApiResponsePayload<T>> = [];

  for (let start = 0; start < paths.length; start += batchSize) {
    const batch = paths.slice(start, start + batchSize);
    const batchResults = await Promise.all(
      batch.map((path, index) => {
        const perRequestOpts = options.perRequestOptions?.(path, start + index);
        return client.get<T>(path, {
          throwOnError: false,
          ...options.requestOptions,
          ...perRequestOpts,
        });
      })
    );
    results.push(...batchResults);
  }

  return results;
}

function resolveBatchSize(value: number | undefined): number {
  if (value === undefined) {
    return 4;
  }
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`batchSize must be a positive number, got ${value}`);
  }
  return Math.floor(value);
}
