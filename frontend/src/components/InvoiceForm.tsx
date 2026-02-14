import React, { useState, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';

interface InvoiceFormProps {
  onCreated: (id: string) => void;
  prefillAddress?: string | null;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onCreated, prefillAddress }) => {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<{name: string, address: string}[]>([]);
  const [formData, setFormData] = useState({
    merchantAddress: prefillAddress || '',
    customerEmail: '',
    amount: '',
    memo: '',
    tokenAddress: '0x20c0000000000000000000000000000000000000'
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
        // Silently fail - contacts are optional
      }
    };
    fetchContacts();
  }, [address]);

  const handleContactSelect = (address: string) => {
    setFormData(prev => ({ ...prev, merchantAddress: address }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await axios.post('/api/invoices', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      toast.success("invoice generated successfully");
      onCreated(resp.data.id);
    } catch (err) {
      console.error(err);
      toast.error("failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Send size={24} /> Create Invoice
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Recipient Address</label>
            {contacts.length > 0 && (
              <select 
                onChange={(e) => handleContactSelect(e.target.value)}
                value=""
              >
                <option value="" disabled>Quick Select Contact</option>
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
          />
        </div>

        <div className="input-group">
          <label>Customer Email (optional)</label>
          <input 
            type="email" 
            placeholder="buyer@example.com" 
            value={formData.customerEmail}
            onChange={e => setFormData({...formData, customerEmail: e.target.value})}
          />
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
          <label>Memo / Reference</label>
          <input 
            type="text" 
            placeholder="e.g. Services" 
            value={formData.memo}
            onChange={e => setFormData({...formData, memo: e.target.value})}
          />
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
