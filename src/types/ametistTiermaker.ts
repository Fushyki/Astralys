export interface TiermakerItem {
  id: string;
  src: string;
  nome: string;
  tierId: string | null;
  colIndex: number | null;
  uploadIndex?: number;
}

export interface TiermakerRank {
  id: string;
  l: string;
  c?: string;
}

export interface TiermakerGroup {
  id: string;
  titulo: string;
  ranks: TiermakerRank[];
}

export interface TiermakerData {
  items: TiermakerItem[];
  ranksData: TiermakerGroup[];
  layoutMode: string;
  colunas: number;
}
