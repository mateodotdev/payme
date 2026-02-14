import React, { useState, useEffect } from 'react';
import { Send, Loader2, Mail, Phone, Wallet } from 'lucide-react';
import axios from 'axios';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { isValidAddress, authAxios } from '../api';

interface InvoiceFormProps {
  onCreated: (id: string) => void;
  prefillAddress?: string | null;
}

type RecipientMode = 'wallet' | 'email' | 'phone';

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onCreated, prefillAddress }) => {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('wallet');
  const [lookupValue, setLookupValue] = useState('');
  const [resolvedName, setResolvedName] = useState('');
  const [contacts, setContacts] = useState<{name: string, address: string}[]>([]);
  const [formData, setFormData] = useState({
    merchantAddress: prefillAddress || '',
    customerEmail: '',
    amount: '',
    memo: '',
    tokenAddress: '0x20c0000000000000000000000000000000000000',
  });

  // auto-fill merchant address from connected wallet
  useEffect(() => {
    if (address && !prefillAddress) {
      setFormData(prev => ({ ...prev, merchantAddress: address }));
    }
  }, [address, prefillAddress]);

  useEffect(() => {
    if (!address) return;
    const fetchContacts = async () => {
      try {
        const resp = await axios.get(`/api/contacts?wallet=${address}`);
        setContacts((resp.data || []).map((c: any) => ({ name: c.name, address: c.address })));
      } catch (err) {
        console.error(err);
      }
    };
    fetchContacts();
  }, [address]);

  const handleContactSelect = (address: string) => {
    setFormData(prev => ({ ...prev, merchantAddress: address }));
  };

  const handleLookup = async () => {
    if (!address || !lookupValue) return;
    setLookingUp(true);
    try {
      const params = new URLSearchParams({ wallet: address });
      if (recipientMode === 'email') params.set('email', lookupValue);
      else params.set('phone', lookupValue);

      const resp = await axios.get(`/api/contacts/lookup?${params.toString()}`);
      if (resp.data.found) {
        setFormData(prev => ({ ...prev, merchantAddress: resp.data.contact.address }));
        setResolvedName(resp.data.contact.name);
        toast.success(`found: ${resp.data.contact.name}`);
      } else {
        setResolvedName('');
        toast('no match found — a payment link will be generated instead', { icon: '📨' });
      }
    } catch (err) {
      console.error(err);
      toast.error('lookup failed');
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side address validation
    if (recipientMode === 'wallet' && !isValidAddress(formData.merchantAddress)) {
      toast.error('invalid wallet address — must be 0x followed by 40 hex characters');
      return;
    }
    if (!isValidAddress(formData.tokenAddress)) {
      toast.error('invalid token address');
      return;
    }
    if (parseFloat(formData.amount) <= 0) {
      toast.error('amount must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const api = authAxios(address);
      const resp = await api.post('/api/invoices', {
        ...formData,
        amount: parseFloat(formData.amount),
        customerEmail: recipientMode === 'email' ? lookupValue : formData.customerEmail,
      });
      toast.success("invoice generated successfully");
      onCreated(resp.data.id);
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || "failed to create invoice";
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '780px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Send size={24} /> Create Invoice
      </h2>
      
      <form onSubmit={handleSubmit}>
        {/* Recipient mode toggle */}
        <div className="input-group">
          <label>send to</label>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
            {([
              { mode: 'wallet' as RecipientMode, icon: <Wallet size={14} />, label: 'wallet' },
              { mode: 'email' as RecipientMode, icon: <Mail size={14} />, label: 'email' },
              { mode: 'phone' as RecipientMode, icon: <Phone size={14} />, label: 'phone' },
            ]).map(opt => (
              <button
                key={opt.mode}
                type="button"
                className={`btn-secondary ${recipientMode === opt.mode ? 'active' : ''}`}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => {
                  setRecipientMode(opt.mode);
                  setResolvedName('');
                  setLookupValue('');
                }}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {recipientMode === 'wallet' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)' }}>recipient address</span>
                {contacts.length > 0 && (
                  <select 
                    onChange={(e) => handleContactSelect(e.target.value)}
                    value=""
                    style={{ width: 'auto', fontSize: '0.75rem', padding: '0.3rem 1.5rem 0.3rem 0.5rem' }}
                  >
                    <option value="" disabled>Quick Select</option>
                    {contacts.map((c, i) => (
                      <option key={i} value={c.address}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <input 
                type="text" 
                placeholder="0x..." 
                value={formData.merchantAddress}
                onChange={e => setFormData({...formData, merchantAddress: e.target.value})}
                required
                style={{
                  borderColor: formData.merchantAddress && !isValidAddress(formData.merchantAddress) ? 'var(--danger)' : undefined,
                }}
              />
              {formData.merchantAddress && !isValidAddress(formData.merchantAddress) && (
                <p style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: '0.3rem' }}>
                  invalid address format (0x + 40 hex chars)
                </p>
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type={recipientMode === 'email' ? 'email' : 'tel'} 
                  placeholder={recipientMode === 'email' ? 'recipient@example.com' : '+1 555-123-4567'}
                  value={lookupValue}
                  onChange={e => setLookupValue(e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleLookup}
                  disabled={lookingUp || !lookupValue}
                  style={{ whiteSpace: 'nowrap', padding: '0.5rem 0.75rem' }}
                >
                  {lookingUp ? <Loader2 className="animate-spin" size={16} /> : 'lookup'}
                </button>
              </div>
              {resolvedName && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.5rem 0.75rem', 
                  background: 'rgba(34, 197, 94, 0.08)', 
                  border: '1px solid rgba(34, 197, 94, 0.2)', 
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  ✓ resolved to <strong>{resolvedName}</strong> ({formData.merchantAddress.slice(0, 6)}...{formData.merchantAddress.slice(-4)})
                </div>
              )}
            </>
          )}
        </div>

        <div className="input-group">
          <label>Amount (USD)</label>
          <input 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            value={formData.amount}
            onChange={e => setFormData({...formData, amount: e.target.value})}
            required
          />
        </div>

        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Memo / Reference</label>
            <span style={{ fontSize: '0.7rem', color: formData.memo.length > 100 ? 'var(--danger)' : 'var(--fg-secondary)' }}>
              {formData.memo.length}/120
            </span>
          </div>
          <textarea 
            placeholder="e.g. Dinner last night - thanks!" 
            value={formData.memo}
            onChange={e => { if (e.target.value.length <= 120) setFormData({...formData, memo: e.target.value}); }}
            rows={2}
            style={{ resize: 'vertical', minHeight: '60px' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
            {[
              { emoji: '🍕', label: 'dinner' },
              { emoji: '☕', label: 'coffee' },
              { emoji: '🏠', label: 'rent' },
              { emoji: '💸', label: 'repayment' },
              { emoji: '🎁', label: 'gift' },
              { emoji: '🛒', label: 'groceries' },
            ].map(tag => (
              <button
                key={tag.label}
                type="button"
                className="btn-secondary"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => setFormData(prev => ({ ...prev, memo: `${tag.emoji} ${tag.label}` }))}
              >
                {tag.emoji} {tag.label}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label>Token</label>
          <select 
            value={formData.tokenAddress}
            onChange={e => setFormData({...formData, tokenAddress: e.target.value})}
          >
            <option value="0x20c0000000000000000000000000000000000000">pathUSD</option>
            <option value="0x20c0000000000000000000000000000000000001">AlphaUSD</option>
            <option value="0x20c0000000000000000000000000000000000002">BetaUSD</option>
          </select>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : "Create Payment Link"}
        </button>
      </form>
    </div>
  );
};

export default InvoiceForm;
