import { CATEGORIAS_ORDEM } from '@/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  somenteDisponiveis: boolean;
  onSomenteDisponiveisChange: (val: boolean) => void;
  categoriaFiltro: string;
  onCategoriaFiltroChange: (val: string) => void;
  totalDisponiveis: number;
  total: number;
}

export default function FilterBar({
  somenteDisponiveis,
  onSomenteDisponiveisChange,
  categoriaFiltro,
  onCategoriaFiltroChange,
  totalDisponiveis,
  total,
}: FilterBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border py-3 px-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            id="filtro-disponivel"
            checked={somenteDisponiveis}
            onCheckedChange={onSomenteDisponiveisChange}
          />
          <Label htmlFor="filtro-disponivel" className="cursor-pointer text-sm">
            Só disponíveis
          </Label>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {totalDisponiveis} de {total} disponíveis
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoriaFiltroChange('')}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
            categoriaFiltro === ''
              ? 'bg-secondary text-secondary-foreground border-secondary'
              : 'bg-card text-muted-foreground border-border hover:bg-muted'
          )}
        >
          Todas
        </button>
        {CATEGORIAS_ORDEM.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              onCategoriaFiltroChange(cat === categoriaFiltro ? '' : cat)
            }
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
              categoriaFiltro === cat
                ? 'bg-secondary text-secondary-foreground border-secondary'
                : 'bg-card text-muted-foreground border-border hover:bg-muted'
            )}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
