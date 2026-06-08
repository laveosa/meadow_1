export function isObjExistInCollection<T extends { id: number }>(
  collection: T[],
  model: T,
) {
  return collection?.find((item) => item.id === model?.id);
}
