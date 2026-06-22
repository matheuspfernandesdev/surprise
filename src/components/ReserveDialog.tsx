import { useState } from 'react';
import { Minus, Plus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PublicItem } from '@/types';

interface ReserveDialogProps {
  item: PublicItem | null;
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirmar: (nome: string, quantidade: number) => Promise<void>;
}

export default function ReserveDialog({
  item,
  open,
  loading,
  onClose,
  onConfirmar,
}: ReserveDialogProps) {
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [tocouNome, setTocouNome] = useState(false);

  const nomeVazio = tocouNome && nome.trim() === '';

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen && !loading) {
      onClose();
      setNome('');
      setQuantidade(1);
      setTocouNome(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTocouNome(true);
    if (nome.trim() === '') return;
    await onConfirmar(nome.trim(), quantidade);
    setNome('');
    setQuantidade(1);
    setTocouNome(false);
  }

  function decrementar() {
    setQuantidade((q) => Math.max(1, q - 1));
  }

  function incrementar() {
    setQuantidade((q) => Math.min(20, q + 1));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="pr-6">
            Vou levar:{' '}
            <span className="text-primary">{item?.nome}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nome-input">
                Seu nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome-input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como você se chama?"
                disabled={loading}
                autoComplete="off"
                className={nomeVazio ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {nomeVazio && (
                <p className="text-xs text-destructive mt-1">
                  Por favor, informe seu nome.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Quantidade</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={decrementar}
                  disabled={quantidade <= 1 || loading}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-semibold text-lg text-foreground tabular-nums">
                  {quantidade}
                </span>
                <button
                  type="button"
                  onClick={incrementar}
                  disabled={loading || quantidade >= 20}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
