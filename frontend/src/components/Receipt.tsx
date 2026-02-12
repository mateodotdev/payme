import { useRef } from 'react';
import { CheckCircle, Download, ExternalLink } from 'lucide-react';

interface ReceiptProps {
  invoice: {
    id: string;
    merchantAddress: string;
    amount: string;
    memo: string;
    status: string;
    paymentLink: string;
    stablecoinName?: string;
    tempoTxHash?: string;
    payerAddress?: string;
    paidAt?: string;
    createdAt?: string;
  };
}

export default function Receipt({ invoice }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>payme receipt - ${invoice.id.slice(0, 8)}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; text-transform: lowercase; }
            body { font-family: 'Inter', sans-serif; background: #000; color: #fff; display: flex; justify-content: center; padding: 2rem; }
            .receipt { width: 420px; background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 16px; overflow: hidden; }
            .receipt-header { background: #0052ff; padding: 2rem; text-align: center; }
            .receipt-header h1 { font-size: 1.5rem; font-weight: 900; letter-spacing: -0.03em; color: #fff; }
            .receipt-header p { font-size: 0.75rem; color: rgba(255,255,255,0.7); margin-top: 0.25rem; }
            .receipt-body { padding: 2rem; }
            .amount { text-align: center; padding: 1.5rem 0; border-bottom: 1px solid #1a1a1a; margin-bottom: 1.5rem; }
            .amount h2 { font-size: 3rem; font-weight: 900; letter-spacing: -0.03em; }
            .amount .status { display: inline-block; background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); padding: 0.2rem 0.6rem; border-radius: 100px; font-size: 0.7rem; font-weight: 700; margin-top: 0.5rem; }
            .row { display: flex; justify-content: space-between; align-items: flex-start; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
            .row:last-child { border: none; }
            .label { font-size: 0.75rem; color: #a1a1aa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
            .value { font-size: 0.85rem; font-weight: 500; text-align: right; max-width: 240px; word-break: break-all; font-family: monospace; }
            .receipt-footer { padding: 1.5rem 2rem; border-top: 1px solid #1a1a1a; text-align: center; }
            .receipt-footer p { font-size: 0.7rem; color: #a1a1aa; }
            .divider { width: 100%; border: none; border-top: 1px dashed #1a1a1a; margin: 1rem 0; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="receipt-header">
              <h1>payme</h1>
              <p>payment receipt</p>
            </div>
            <div class="receipt-body">
              <div class="amount">
                <h2>$${invoice.amount}</h2>
                <div class="status">✓ paid</div>
              </div>
              <div class="row"><span class="label">reference</span><span class="value">${invoice.memo || 'n/a'}</span></div>
              <div class="row"><span class="label">invoice id</span><span class="value">${invoice.id.slice(0, 8)}...${invoice.id.slice(-4)}</span></div>
              <div class="row"><span class="label">recipient</span><span class="value">${invoice.merchantAddress.slice(0, 6)}...${invoice.merchantAddress.slice(-4)}</span></div>
              ${invoice.payerAddress ? `<div class="row"><span class="label">payer</span><span class="value">${invoice.payerAddress.slice(0, 6)}...${invoice.payerAddress.slice(-4)}</span></div>` : ''}
              ${invoice.tempoTxHash ? `<div class="row"><span class="label">tx hash</span><span class="value">${invoice.tempoTxHash.slice(0, 10)}...${invoice.tempoTxHash.slice(-6)}</span></div>` : ''}
              <div class="row"><span class="label">date</span><span class="value">${invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : new Date().toLocaleDateString()}</span></div>
              <div class="row"><span class="label">network</span><span class="value">tempo testnet</span></div>
            </div>
            <div class="receipt-footer">
              <p>verified on-chain · tempo testnet · payme</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  if (invoice.status !== 'PAID') return null;

  return (
    <div className="animate-fade-in" style={{ marginTop: '2rem' }}>
      <div
        ref={receiptRef}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
      >
        {/* header */}
        <div style={{ background: 'var(--accent)', padding: '1.5rem 2rem', textAlign: 'center' }}>
          <h3 style={{ color: 'white', fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.03em' }}>payme</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', marginTop: '0.2rem' }}>payment receipt</p>
        </div>

        {/* amount */}
        <div style={{ textAlign: 'center', padding: '2rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>${invoice.amount}</h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem' }}>
            <CheckCircle size={14} color="var(--success)" />
            <span className="status-badge status-paid">paid</span>
          </div>
        </div>

        {/* details */}
        <div style={{ padding: '1.5rem 2rem' }}>
          <ReceiptRow label="reference" value={invoice.memo || 'n/a'} />
          <ReceiptRow label="invoice id" value={`${invoice.id.slice(0, 8)}...${invoice.id.slice(-4)}`} mono />
          <ReceiptRow label="recipient" value={`${invoice.merchantAddress.slice(0, 6)}...${invoice.merchantAddress.slice(-4)}`} mono />
          {invoice.payerAddress && (
            <ReceiptRow label="payer" value={`${invoice.payerAddress.slice(0, 6)}...${invoice.payerAddress.slice(-4)}`} mono />
          )}
          {invoice.tempoTxHash && (
            <ReceiptRow label="tx hash" value={`${invoice.tempoTxHash.slice(0, 10)}...${invoice.tempoTxHash.slice(-6)}`} mono link={`https://explore.tempo.xyz/tx/${invoice.tempoTxHash}`} />
          )}
          <ReceiptRow label="date" value={invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : new Date().toLocaleDateString()} />
          <ReceiptRow label="network" value="tempo testnet" />
        </div>

        {/* footer */}
        <div style={{ padding: '1rem 2rem', borderTop: '1px dashed var(--border)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--fg-secondary)' }}>verified on-chain · tempo testnet · payme</p>
        </div>
      </div>

      <button
        className="btn-primary"
        onClick={handleDownload}
        style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
      >
        <Download size={16} /> download receipt
      </button>
    </div>
  );
}

function ReceiptRow({ label, value, mono, link }: { label: string; value: string; mono?: boolean; link?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', fontFamily: mono ? 'monospace' : 'inherit', color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          {value} <ExternalLink size={12} />
        </a>
      ) : (
        <span style={{ fontSize: '0.85rem', fontWeight: 500, fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
      )}
    </div>
  );
}
