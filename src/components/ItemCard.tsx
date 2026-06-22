import { PublicItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  item: PublicItem;
  onVouLevar: (item: PublicItem) => void;
}

export default function ItemCard({ item, onVouLevar }: ItemCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 flex flex-col gap-3 transition-opacity duration-200',
        item.reservado
          ? 'bg-reserved-bg border-border opacity-65'
          : 'bg-card border-border shadow-card'
      )}
    >
      <div className="flex-1">
        <p
          className={cn(
            'font-semibold text-base leading-snug',
            item.reservado ? 'text-reserved-fg' : 'text-foreground'
          )}
        >
          {item.nome}
        </p>
        <span
          className={cn(
            'text-xs font-medium mt-1 block',
            item.reservado ? 'text-reserved-fg' : 'text-secondary'
          )}
        >
          {item.categoria}
        </span>
      </div>

      <div className="flex justify-end">
        {item.reservado ? (
          <Badge variant="reserved">Reservado</Badge>
        ) : (
          <Button size="sm" onClick={() => onVouLevar(item)}>
            Vou levar
          </Button>
        )}
      </div>
    </div>
  );
}
