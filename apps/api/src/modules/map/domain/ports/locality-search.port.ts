export const LOCALITY_SEARCH = Symbol('LOCALITY_SEARCH');

export type LocalityPrediction = {
  mainText: string;
  secondaryText: string | null;
};

export interface ILocalitySearch {
  search(query: string): Promise<LocalityPrediction[]>;
}
