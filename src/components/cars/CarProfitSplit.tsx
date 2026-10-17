import React from 'react';
import { ArrowRight, CheckCircle2, Handshake, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { inr, type Totals, type PartnerPosition } from '@/lib/carBusiness';

type Transfer = { from: string; to: string; amount: number };

interface Props {
  partners: string[];
  totals: Totals; // all time
  positions: PartnerPosition[];
  transfers: Transfer[];
  onRecordPayment: () => void;
  onSettle: (t: Transfer) => void;
  onOpenSettings: () => void;
}

export const CarProfitSplit: React.FC<Props> = ({ partners, totals, positions, transfers, onRecordPayment, onSettle, onOpenSettings }) => {
  const n = Math.max(1, partners.length);
  const profit = totals.earned - totals.spent;       // includes trips the company hasn't paid yet
  const inHand = totals.received - totals.spent;     // what the partners actually have
  const hasActivity = totals.earned > 0 || totals.spent > 0;

  const paymentNote =
    totals.earned === 0 ? 'No trips yet.'
      : totals.pending === 0 ? 'All trips are paid.'
        : totals.received === 0 ? 'Nothing received yet. Record it when the monthly payment comes.'
          : 'Record the rest when it comes.';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Handshake className="w-4 h-4" /> Profit & partners</CardTitle>
        <CardDescription>All time · who holds how much</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">Total profit</p>
          <p className={cn('text-3xl font-bold', profit < 0 && 'text-rose-500')}>{inr(profit)}</p>
          <p className="text-sm text-muted-foreground">
            Earned {inr(totals.earned)} − spent {inr(totals.spent)}
            {partners.length > 1 && <> · <b className="text-foreground">{inr(profit / n)} each</b></>}
          </p>
          {totals.pending > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">Includes {inr(totals.pending)} the company still has to pay.</p>
          )}
        </div>

        <div className="rounded-lg border p-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm">
              Company paid <b>{inr(totals.received)}</b>
              {totals.pending > 0 && <> · <b className="text-amber-700 dark:text-amber-400">{inr(totals.pending)} due</b></>}
            </p>
            <p className="text-xs text-muted-foreground">{paymentNote}</p>
          </div>
          {totals.pending > 0 && (
            <Button size="sm" onClick={onRecordPayment}><Wallet className="w-4 h-4 mr-1" /> Payment received</Button>
          )}
        </div>

        {partners.length < 2 ? (
          <div className="text-sm text-muted-foreground">
            Add your partner names in car settings to see who holds what.{' '}
            <Button variant="link" className="h-auto p-0" onClick={onOpenSettings}>Open settings</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {positions.map(p => {
                const holds = p.received - p.paid;
                return (
                  <div key={p.name} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{p.name}</span>
                      {p.settle > 0.5 ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15">Gets {inr(p.settle)}</Badge>
                      ) : p.settle < -0.5 ? (
                        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/15">Gives {inr(-p.settle)}</Badge>
                      ) : (
                        <Badge variant="secondary">Settled</Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{holds >= 0 ? 'Holding now' : 'Paid from own pocket'}</p>
                      <p className="text-2xl font-bold">{inr(Math.abs(holds))}</p>
                      <p className="text-xs text-muted-foreground">Got {inr(p.received)} · paid {inr(p.paid)}</p>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-muted-foreground">{inHand >= 0 ? 'Profit share' : 'Share of costs'}</span>
                      <span className="font-semibold">{inr(Math.abs(p.share))}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasActivity && (transfers.length > 0 ? (
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <p className="text-sm font-medium">To settle up</p>
                {transfers.map(t => (
                  <div key={`${t.from}-${t.to}`} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sm">
                      <b>{t.from}</b> <ArrowRight className="w-4 h-4 text-muted-foreground" /> <b>{t.to}</b>
                      <span className="font-semibold ml-1">{inr(t.amount)}</span>
                    </span>
                    <Button size="sm" variant="outline" onClick={() => onSettle(t)}>Mark as given</Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  {inHand >= 0
                    ? `After this, each of you has ${inr(inHand / n)} profit in hand.`
                    : 'This shares the costs equally until the company pays.'}
                </p>
              </div>
            ) : (
              <p className="text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                All settled{inHand > 0 && ` · each of you has ${inr(inHand / n)}`}
              </p>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};
