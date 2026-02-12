import { useState, useEffect, type FormEvent } from 'react';
import { Save, User, Wallet, CheckCircle } from 'lucide-react';

export default function Settings({ onBack, walletAddress }: { onBack: () => void, walletAddress: string | null }) {
  const [settings, setSettings] = useState({
    merchantName: '',
    merchantAddress: walletAddress || ''
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('payme_merchant_name') || '';
    const savedAddr = walletAddress || localStorage.getItem('payme_merchant_address') || '';
    setSettings({ merchantName: savedName, merchantAddress: savedAddr });
  }, [walletAddress]);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    localStorage.setItem('payme_merchant_name', settings.merchantName);
    localStorage.setItem('payme_merchant_address', settings.merchantAddress);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem' }}>
        <User size={20} /> my profile
      </h2>
      
      <form onSubmit={handleSave}>
        <div className="input-group">
          <label><User size={14} style={{ marginRight: '4px' }} /> my display name</label>
          <input 
            type="text" 
            placeholder="e.g. satoshi" 
            value={settings.merchantName}
            onChange={e => setSettings({...settings, merchantName: e.target.value})}
          />
        </div>
        
        <div className="input-group">
          <label><Wallet size={14} style={{ marginRight: '4px' }} /> my wallet address (tempo)</label>
          <input 
            type="text" 
            placeholder="0x..." 
            value={settings.merchantAddress}
            onChange={e => setSettings({...settings, merchantAddress: e.target.value})}
            disabled={!!walletAddress}
            style={{ fontFamily: 'monospace', opacity: walletAddress ? 0.7 : 1 }}
          />
          {walletAddress && <p style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '0.4rem' }}>managed by connected wallet</p>}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', height: '3.5rem' }}>
            {saved ? <><CheckCircle size={20} /> saved</> : <><Save size={20} /> save settings</>}
          </button>
          <button type="button" className="btn-secondary" onClick={onBack} style={{ flex: 1, justifyContent: 'center', height: '3.5rem' }}>
            back
          </button>
        </div>
      </form>
    </div>
  );
}
