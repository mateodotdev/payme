import { useState, useEffect } from 'react';
import { Plus, Trash2, Send, Loader2, CheckCircle, XCircle, Users } from 'lucide-react';
import { useAccount, useWalletClient, useSwitchChain, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { Abis } from 'viem/tempo';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { isValidAddress } from '../api';

interface Recipient {
  id: string;
  address: string;
  amount: string;
  memo: string;
  status: 'idle' | 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  error?: string;
}

const TOKEN_ADDRESS = '0x20c0000000000000000000000000000000000000' as `0x${string}`;

export default function MultiSend() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();

  const [sending, setSending] = useState(false);
  const [contacts, setContacts] = useState<{name: string, address: string}[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: crypto.randomUUID(), address: '', amount: '', memo: '', status: 'idle' },
  ]);

  useEffect(() => {
    if (!address) return;
    axios.get(`/api/contacts?wallet=${address}`)
      .then(r => setContacts((r.data || []).map((c: any) => ({ name: c.name, address: c.address }))))
      .catch(() => {});
  }, [address]);

  const addRow = () => {
    setRecipients(prev => [...prev, { id: crypto.randomUUID(), address: '', amount: '', memo: '', status: 'idle' }]);
  };

  const removeRow = (id: string) => {
    if (recipients.length <= 1) return;
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof Recipient, value: string) => {
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const totalAmount = recipients.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);

  const handleSendAll = async () => {
    if (!isConnected || !walletClient || !address || !publicClient) {
      toast.error('connect your wallet first');
      return;
    }

    const valid = recipients.filter(r => r.address && r.amount && parseFloat(r.amount) > 0);
    if (valid.length === 0) {
      toast.error('add at least one recipient with an amount');
      return;
    }

    // Validate all addresses
    const invalid = valid.filter(r => !isValidAddress(r.address));
    if (invalid.length > 0) {
      toast.error(`${invalid.length} recipient(s) have invalid addresses`);
      return;
    }

    setSending(true);

    try {
      await switchChain({ chainId: 42431 });
    } catch { /* may already be on chain */ }

    // fetch decimals once
    let decimals: number;
    try {
      decimals = await publicClient.readContract({
        address: TOKEN_ADDRESS,
        abi: Abis.tip20,
        functionName: 'decimals',
      }) as number;
    } catch {
      toast.error('failed to read token decimals');
      setSending(false);
      return;
    }

    // Mark all valid as pending
    setRecipients(prev => prev.map(r =>
      valid.find(v => v.id === r.id) ? { ...r, status: 'pending' as const } : r
    ));

    // Fire all transfers in parallel
    const results = await Promise.allSettled(
      valid.map(async (recipient) => {
        const amountWei = parseUnits(recipient.amount, decimals);

        const hash = await walletClient.writeContract({
          address: TOKEN_ADDRESS,
          abi: Abis.tip20,
          functionName: 'transfer',
          args: [recipient.address as `0x${string}`, amountWei],
        });

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== 'success') throw new Error('reverted');

        return { id: recipient.id, hash };
      })
    );

    // Update status per recipient
    setRecipients(prev => prev.map(r => {
      const idx = valid.findIndex(v => v.id === r.id);
      if (idx === -1) return r;
      const result = results[idx];
      if (result.status === 'fulfilled') {
        return { ...r, status: 'confirmed' as const, txHash: result.value.hash };
      } else {
        return { ...r, status: 'failed' as const, error: (result.reason as Error).message || 'failed' };
      }
    }));

    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.filter(r => r.status === 'rejected').length;

    if (failures === 0) {
      toast.success(`all ${successes} payments sent!`);
    } else {
      toast(`${successes} sent, ${failures} failed`, { icon: '⚠️' });
    }

    setSending(false);
  };

  if (!isConnected) {
    return (
      <div className="glass-card animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', padding: '3rem' }}>
        <Users size={32} style={{ marginBottom: '1rem', color: 'var(--fg-secondary)' }} />
        <p style={{ color: 'var(--fg-secondary)' }}>connect your wallet to use multi-send</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Send size={24} /> multi-send
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--fg-secondary)' }}>
          {recipients.filter(r => r.address && r.amount).length} recipient{recipients.filter(r => r.address && r.amount).length !== 1 ? 's' : ''} · ${totalAmount.toFixed(2)}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {recipients.map((r, i) => (
          <div
            key={r.id}
            className="glass-card"
            style={{
              padding: '1rem',
              borderColor: r.status === 'confirmed' ? 'var(--success)' : r.status === 'failed' ? 'var(--danger)' : undefined,
              position: 'relative',
            }}
          >
            {/* Status indicator */}
            {r.status !== 'idle' && (
              <div style={{
                position: 'absolute', top: '0.75rem', right: '0.75rem',
                display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem',
              }}>
                {r.status === 'pending' && <><Loader2 className="animate-spin" size={14} color="var(--accent)" /> sending...</>}
                {r.status === 'confirmed' && <><CheckCircle size={14} color="var(--success)" /> confirmed</>}
                {r.status === 'failed' && <><XCircle size={14} color="var(--danger)" /> failed</>}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)', fontWeight: 700, minWidth: '1.5rem' }}>#{i + 1}</span>
              {contacts.length > 0 && (
                <select
                  onChange={e => updateRow(r.id, 'address', e.target.value)}
                  value=""
                  style={{ width: 'auto', fontSize: '0.75rem', padding: '0.25rem 1.5rem 0.25rem 0.5rem' }}
                >
                  <option value="" disabled>contact</option>
                  {contacts.map((c, ci) => (
                    <option key={ci} value={c.address}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="0x... address"
                value={r.address}
                onChange={e => updateRow(r.id, 'address', e.target.value)}
                style={{ flex: '2 1 200px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                disabled={r.status !== 'idle'}
              />
              <input
                type="number"
                step="0.01"
                placeholder="amount"
                value={r.amount}
                onChange={e => updateRow(r.id, 'amount', e.target.value)}
                style={{ flex: '1 1 100px' }}
                disabled={r.status !== 'idle'}
              />
              <input
                type="text"
                placeholder="memo"
                value={r.memo}
                onChange={e => updateRow(r.id, 'memo', e.target.value)}
                style={{ flex: '1 1 120px' }}
                disabled={r.status !== 'idle'}
              />
              <button
                type="button"
                onClick={() => removeRow(r.id)}
                disabled={recipients.length <= 1 || r.status !== 'idle'}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem' }}
              >
                <Trash2 size={16} />
              </button>
            </div>

            {r.txHash && (
              <a
                href={`https://explore.tempo.xyz/tx/${r.txHash}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '0.4rem', display: 'inline-block' }}
              >
                tx: {r.txHash.slice(0, 10)}...{r.txHash.slice(-6)}
              </a>
            )}
            {r.error && (
              <p style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: '0.4rem' }}>{r.error}</p>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={addRow}
          disabled={sending}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Plus size={16} /> add recipient
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleSendAll}
          disabled={sending || recipients.every(r => !r.address || !r.amount)}
          style={{ flex: 1, justifyContent: 'center', height: '3rem' }}
        >
          {sending ? (
            <><Loader2 className="animate-spin" size={18} /> sending...</>
          ) : (
            <><Send size={18} /> send all (${totalAmount.toFixed(2)})</>
          )}
        </button>
      </div>
    </div>
  );
}
