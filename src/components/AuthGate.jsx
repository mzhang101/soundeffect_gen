import { useState } from 'react';
import { useGeneration, t } from '../context/GenerationContext';

export default function AuthGate() {
  const { login } = useGeneration();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    await new Promise(r => setTimeout(r, 600));

    if (username === 'admin' && password === '123456') {
      login();
    } else {
      setError(t('invalidCredentials'));
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0d0d0d]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#d4a574]/5 via-transparent to-transparent" />

      {/* Card */}
      <div className="relative w-full max-w-sm">
        <div className="card p-8">
          {/* Logo area */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent-glow)] mb-4">
              <svg className="w-6 h-6 text-[var(--accent-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM12 3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">{t('soundFxBatcher')}</h1>
            <p className="text-sm text-[var(--text-muted)]">{t('signInToContinue')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('username')}
                className="input"
                disabled={isLoading}
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password')}
                className="input"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-sm text-[var(--error)] bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="btn btn-primary w-full py-3"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {t('signingIn')}
                </span>
              ) : t('signIn')}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
