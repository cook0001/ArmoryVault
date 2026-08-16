import React, { useState } from 'react';
import { Shield, Key, AlertTriangle, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';

interface Props {
  isSetup: boolean;
  onUnlocked: () => void;
}

export const VaultLogin = ({ isSetup, onUnlocked }: Props) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [showRecoveryCode, setShowRecoveryCode] = useState(false);
  const [useRecovery, setUseRecovery] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long for adequate encryption security.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    try {
      const code = await window.api.setupVault(password);
      setRecoveryCode(code);
    } catch (err) {
      setError('Failed to setup vault. Check console for details.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (useRecovery) {
      const success = await window.api.unlockWithRecoveryCode(password.trim());
      if (success) {
        onUnlocked();
      } else {
        setError('Invalid recovery code.');
      }
    } else {
      const success = await window.api.unlockVault(password);
      if (success) {
        onUnlocked();
      } else {
        setError('Incorrect password.');
      }
    }
  };

  if (recoveryCode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem', textAlign: 'center', background: 'var(--bg-primary)' }}>
        <AlertTriangle size={64} style={{ color: 'var(--warning)', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Save Your Recovery Code!</h2>
        <p style={{ maxWidth: '600px', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
          Your Vault has been successfully encrypted with military-grade AES-256-GCM. 
          If you ever forget your password, your data is mathematically unrecoverable unless you have this code. 
          Write it down and store it somewhere safe. <strong>It will never be shown again.</strong>
        </p>
        
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem 3rem', borderRadius: '8px', wordBreak: 'break-all', fontSize: '1.2rem', fontFamily: 'monospace', border: '1px solid var(--border-light)', position: 'relative', maxWidth: '800px', marginBottom: '2rem', color: 'var(--text-primary)' }}>
          {showRecoveryCode ? recoveryCode : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
          <button 
            type="button" 
            onClick={() => setShowRecoveryCode(!showRecoveryCode)}
            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            {showRecoveryCode ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button className="btn-primary" onClick={onUnlocked} style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
          I have safely stored my code. Let's Go.
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', textAlign: 'center' }}>
        <Shield size={64} style={{ color: 'var(--accent)', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.3))' }} />
        
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.8rem' }}>ArmoryVault</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {!isSetup ? 'Create a master password to encrypt your local vault.' : (useRecovery ? 'Enter your 64-character recovery code.' : 'Enter your master password to unlock your vault.')}
        </p>

        <form onSubmit={!isSetup ? handleSetup : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}>
              {useRecovery ? <KeyRound size={20} /> : <Lock size={20} />}
            </div>
            <input
              type={useRecovery ? "text" : "password"}
              placeholder={useRecovery ? "Recovery Code" : "Master Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', textAlign: 'left', letterSpacing: '0.1em' }}
              autoFocus
            />
          </div>

          {!isSetup && (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}>
                <Lock size={20} />
              </div>
              <input
                type="password"
                placeholder="Confirm Master Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', textAlign: 'left', letterSpacing: '0.1em' }}
              />
            </div>
          )}

          {error && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', textAlign: 'left', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '4px' }}>{error}</div>}

          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.8rem', fontSize: '1.1rem' }}>
            {!isSetup ? 'Encrypt Vault' : 'Unlock'}
          </button>
        </form>

        {isSetup && (
          <div style={{ marginTop: '1.5rem' }}>
            <button 
              onClick={() => {
                setUseRecovery(!useRecovery);
                setPassword('');
                setError('');
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              {useRecovery ? 'Back to Password Login' : 'Forgot Password? Use Recovery Code'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
