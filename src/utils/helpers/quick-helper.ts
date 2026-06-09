import path from "node:path";
import { fileURLToPath } from "node:url";

export function isObjExistInCollection<T extends { id: number }>(
  collection: T[],
  model: T,
) {
  return collection?.find((item) => item.id === model?.id);
}

export function pathResolve(relatedPath: string, isMetaUrl?: boolean) {
  if (!relatedPath || relatedPath.length === 0) return null;

  return isMetaUrl
    ? fileURLToPath(new URL(relatedPath, import.meta.url))
    : path.resolve(process.env.PROJECT_ROOT || process.cwd(), relatedPath);
}
