import { useState, useEffect, useMemo } from 'react';
import { Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { AdminItem, CATEGORIAS_ORDEM } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

function formatarData(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState('');
  const [errSenha, setErrSenha] = useState('');
  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [somentereservados, setSomenteReservados] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD as string;
    if (!adminPassword) {
      setErrSenha('Variável VITE_ADMIN_PASSWORD não configurada.');
      return;
    }
    if (senha === adminPassword) {
      setAutenticado(true);
      setErrSenha('');
    } else {
      setErrSenha('Senha incorreta. Tente novamente.');
      setSenha('');
    }
  }

  useEffect(() => {
    if (!autenticado) return;

    setLoading(true);
    supabase
      .from('itens')
      .select('id, nome, categoria, reservado_por, quantidade, reservado_em, criado_em')
      .then(({ data, error }) => {
        if (error) {
          toast.error('Erro ao carregar itens.');
        } else {
          setItems((data as AdminItem[]) ?? []);
        }
        setLoading(false);
      });
  }, [autenticado]);

  const itensFiltrados = useMemo(() => {
    return items
      .filter((i) => !filtroCategoria || i.categoria === filtroCategoria)
      .filter((i) => !somentereservados || i.reservado_por !== null)
      .sort((a, b) => {
        const aReservado = a.reservado_por !== null ? 0 : 1;
        const bReservado = b.reservado_por !== null ? 0 : 1;
        if (aReservado !== bReservado) return aReservado - bReservado;
        const ia = CATEGORIAS_ORDEM.indexOf(a.categoria as (typeof CATEGORIAS_ORDEM)[number]);
        const ib = CATEGORIAS_ORDEM.indexOf(b.categoria as (typeof CATEGORIAS_ORDEM)[number]);
        if (ia !== ib) return ia - ib;
        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
  }, [items, filtroCategoria, somentereservados]);

  const reservados = items.filter((i) => i.reservado_por !== null).length;

  function handleExportExcel() {
    const data = items
      .sort((a, b) => {
        const ia = CATEGORIAS_ORDEM.indexOf(a.categoria as (typeof CATEGORIAS_ORDEM)[number]);
        const ib = CATEGORIAS_ORDEM.indexOf(b.categoria as (typeof CATEGORIAS_ORDEM)[number]);
        if (ia !== ib) return ia - ib;
        return a.nome.localeCompare(b.nome, 'pt-BR');
      })
      .map((item) => ({
        Item: item.nome,
        Categoria: item.categoria,
        'Quem vai levar': item.reservado_por ?? '',
        Quantidade: item.quantidade ?? '',
        'Reservado em': formatarData(item.reservado_em),
      }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 30 }, { wch: 24 }, { wch: 25 }, { wch: 10 }, { wch: 18 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lista de Presentes');

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `cha-davi-deborah-${dateStr}.xlsx`);
  }

  // Tela de login
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-semibold text-primary">
              Painel Admin
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Acesso restrito — organizadores
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    autoFocus
                    className={errSenha ? 'border-destructive' : ''}
                  />
                  {errSenha && (
                    <p className="text-xs text-destructive">{errSenha}</p>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  Entrar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Painel admin
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-primary">
              Painel Admin
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Chá de Panela — Davi &amp; Deborah
            </p>
          </div>
          <Button onClick={handleExportExcel} disabled={loading || items.length === 0}>
            <Download className="w-4 h-4" />
            Baixar Excel
          </Button>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total', valor: items.length },
            { label: 'Reservados', valor: reservados },
            { label: 'Faltam', valor: items.length - reservados },
          ].map(({ label, valor }) => (
            <Card key={label}>
              <CardContent className="pt-5 text-center">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">
                  {label}
                </p>
                <p className="font-display text-4xl font-semibold text-primary">
                  {loading ? '—' : valor}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas as categorias</option>
            {CATEGORIAS_ORDEM.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
            <input
              type="checkbox"
              checked={somentereservados}
              onChange={(e) => setSomenteReservados(e.target.checked)}
              className="rounded border-border accent-primary"
            />
            Só reservados
          </label>

          {(filtroCategoria || somentereservados) && (
            <button
              onClick={() => { setFiltroCategoria(''); setSomenteReservados(false); }}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Tabela */}
        <div className="rounded-2xl border border-border overflow-hidden shadow-card">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                  <TableHead>Quem vai levar</TableHead>
                  <TableHead className="text-center w-16">Qtd</TableHead>
                  <TableHead className="hidden md:table-cell">Reservado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itensFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Nenhum item encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  itensFiltrados.map((item) => (
                    <TableRow
                      key={item.id}
                      className={item.reservado_por === null ? 'opacity-50' : ''}
                    >
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {item.categoria}
                      </TableCell>
                      <TableCell>
                        {item.reservado_por ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantidade ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {formatarData(item.reservado_em)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {loading && (
          <div className="flex justify-center mt-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
