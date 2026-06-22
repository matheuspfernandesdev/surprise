import { PublicItem } from '@/types';
import ItemCard from './ItemCard';

interface CategorySectionProps {
  categoria: string;
  items: PublicItem[];
  onVouLevar: (item: PublicItem) => void;
}

export default function CategorySection({ categoria, items, onVouLevar }: CategorySectionProps) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight whitespace-nowrap">
          {categoria}
        </h2>
        <div className="flex-1 h-px" style={{ background: 'var(--gold)', opacity: 0.5 }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onVouLevar={onVouLevar} />
        ))}
      </div>
    </section>
  );
}
