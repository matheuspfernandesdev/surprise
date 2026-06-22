export interface PublicItem {
  id: number;
  nome: string;
  categoria: string;
  reservado: boolean;
}

export interface AdminItem {
  id: number;
  nome: string;
  categoria: string;
  reservado_por: string | null;
  quantidade: number | null;
  reservado_em: string | null;
  criado_em: string;
}

export const CATEGORIAS_ORDEM = [
  'Grãos e Cereais',
  'Massas e Farinhas',
  'Enlatados e Conservas',
  'Temperos e Óleos',
  'Matinais e Lanches',
  'Limpeza',
  'Higiene Pessoal',
  'Descartáveis e Utilidades',
] as const;

export type Categoria = (typeof CATEGORIAS_ORDEM)[number];
