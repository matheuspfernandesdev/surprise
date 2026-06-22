import { useState, useEffect, useMemo, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { PublicItem, CATEGORIAS_ORDEM } from '@/types';
import FilterBar from '@/components/FilterBar';
import CategorySection from '@/components/CategorySection';
import ReserveDialog from '@/components/ReserveDialog';
import { Skeleton } from '@/components/ui/skeleton';

function SkeletonList() {
  return (
    <div className="space-y-8 px-4">
      {[1, 2].map((s) => (
        <div key={s}>
          <Skeleton className="h-7 w-48 mb-4 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GuestPage() {
  const [items, setItems] = useState<PublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [somenteDisponiveis, setSomenteDisponiveis] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [itemSelecionado, setItemSelecionado] = useState<PublicItem | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [reservando, setReservando] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('itens_publicos')
        .select('id, nome, categoria, reservado');
      if (error) throw error;
      setItems((data as PublicItem[]) ?? []);
    } catch {
      // silently fail — toast apenas na reserva
    }
  }, []);

  useEffect(() => {
    fetchItems().finally(() => setLoading(false));

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel('itens-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'itens' },
          () => {
            fetchItems();
          }
        )
        .subscribe();
    } catch {
      // Realtime indisponível — fallback via foco de aba
    }

    const handleFocus = () => fetchItems();
    window.addEventListener('focus', handleFocus);

    return () => {
      channel?.unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchItems]);

  const itensFiltrados = useMemo(() => {
    return items
      .filter((item) => !somenteDisponiveis || !item.reservado)
      .filter((item) => !categoriaFiltro || item.categoria === categoriaFiltro);
  }, [items, somenteDisponiveis, categoriaFiltro]);

  const itensAgrupados = useMemo(() => {
    const mapa = new Map<string, PublicItem[]>();
    CATEGORIAS_ORDEM.forEach((cat) => {
      const catItems = itensFiltrados.filter((i) => i.categoria === cat);
      if (catItems.length > 0) mapa.set(cat, catItems);
    });
    return mapa;
  }, [itensFiltrados]);

  const totalDisponiveis = useMemo(
    () => items.filter((i) => !i.reservado).length,
    [items]
  );

  function handleVouLevar(item: PublicItem) {
    setItemSelecionado(item);
    setDialogAberto(true);
  }

  function handleFecharDialog() {
    if (!reservando) {
      setDialogAberto(false);
      setItemSelecionado(null);
    }
  }

  async function handleConfirmar(nome: string, quantidade: number) {
    if (!itemSelecionado) return;
    setReservando(true);
    try {
      const { error } = await supabase.rpc('reservar_item', {
        p_item_id: itemSelecionado.id,
        p_nome: nome,
        p_quantidade: quantidade,
      });

      if (error) {
        if (error.message?.includes('ITEM_INDISPONIVEL')) {
          toast.error('Poxa, alguém acabou de pegar esse item. 😢');
          setDialogAberto(false);
          setItemSelecionado(null);
          await fetchItems();
        } else if (error.message?.includes('NOME_OBRIGATORIO')) {
          toast.error('Por favor, informe seu nome.');
        } else {
          toast.error('Algo deu errado. Tente novamente.');
        }
      } else {
        toast.success('Reservado! Obrigado 💛');
        setDialogAberto(false);
        setItemSelecionado(null);
        await fetchItems();
      }
    } catch {
      toast.error('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setReservando(false);
    }
  }

  const listaVazia = !loading && itensAgrupados.size === 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="text-center pt-10 pb-8 px-4">
          <div className="relative mx-auto mb-6 w-[75%] max-w-[300px]">
            {!imgError ? (
              <img
                src="/casal.jpg"
                alt="Davi e Deborah"
                className="w-full aspect-[3/4] object-cover rounded-3xl ring-4 ring-card shadow-card"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full aspect-[3/4] rounded-3xl bg-muted flex items-center justify-center ring-4 ring-card shadow-card">
                <Heart className="text-primary w-16 h-16" />
              </div>
            )}
          </div>

          <h1 className="text-center">
            <span className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-primary leading-tight tracking-tight block">
              Chá de Panela SURPRESA para
            </span>
            <span
              className="font-accent text-4xl sm:text-5xl block mt-1 leading-tight"
              style={{ color: 'var(--primary)' }}
            >
              Davi &amp; Deborah
            </span>
          </h1>
          <p className="text-muted-foreground text-base mt-4">
            Escolha um ou mais itens que você vai levar para o casal 💛
          </p>
        </header>

        {/* Filtros */}
        <FilterBar
          somenteDisponiveis={somenteDisponiveis}
          onSomenteDisponiveisChange={setSomenteDisponiveis}
          categoriaFiltro={categoriaFiltro}
          onCategoriaFiltroChange={setCategoriaFiltro}
          totalDisponiveis={totalDisponiveis}
          total={items.length}
        />

        {/* Lista */}
        <main className="px-4 py-6 space-y-8">
          {loading ? (
            <SkeletonList />
          ) : listaVazia ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-base">
                Nenhum item por aqui com esse filtro 🙂
              </p>
              {somenteDisponiveis && totalDisponiveis === 0 && items.length > 0 && (
                <p className="text-muted-foreground text-sm mt-2">
                  Todos os itens já foram reservados! 🎉
                </p>
              )}
            </div>
          ) : (
            Array.from(itensAgrupados.entries()).map(([cat, catItems]) => (
              <CategorySection
                key={cat}
                categoria={cat}
                items={catItems}
                onVouLevar={handleVouLevar}
              />
            ))
          )}
        </main>

        {/* Footer */}
        <footer className="text-center py-8 px-4">
          <p className="text-muted-foreground text-sm">
            Feito com 💛 para{' '}
            <span className="font-accent text-base" style={{ color: 'var(--primary)' }}>
              Davi &amp; Deborah
            </span>
          </p>
        </footer>
      </div>

      <ReserveDialog
        item={itemSelecionado}
        open={dialogAberto}
        loading={reservando}
        onClose={handleFecharDialog}
        onConfirmar={handleConfirmar}
      />
    </div>
  );
}
