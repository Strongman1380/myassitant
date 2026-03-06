import { useState, useEffect, useCallback } from 'react';
import { useAuthKit } from '@picahq/authkit';
import { API_URL } from '../config';

type Integration = {
  _id: string;
  platform: string;
  status: string;
  connectionKey: string;
  [key: string]: unknown;
};

export function PicaIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/pica/integrations`);
      const data = await res.json();
      if (data.success) {
        setIntegrations(Array.isArray(data.integrations) ? data.integrations : []);
      }
    } catch (err) {
      setError('Failed to load integrations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const { open } = useAuthKit({
    token: {
      url: `${API_URL}/api/pica/token`,
      headers: {},
    },
    onSuccess: (connection) => {
      console.log('Connected:', connection);
      fetchIntegrations();
    },
    onError: (err) => {
      console.error('AuthKit error:', err);
      setError('Failed to connect integration');
    },
  });

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>Connected Integrations</h3>
        <button
          onClick={() => open()}
          style={{
            padding: '6px 14px',
            fontSize: 13,
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
        >
          + Connect
        </button>
      </div>

      {error && (
        <p style={{ color: 'var(--error)', fontSize: 13, marginBottom: 8 }}>{error}</p>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</p>
      ) : integrations.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          No integrations connected yet. Click "+ Connect" to add one.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {integrations.map((integration) => (
            <div
              key={integration._id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'var(--surface-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 14, textTransform: 'capitalize' }}>
                {integration.platform}
              </span>
              <span
                style={{
                  fontSize: 12,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: integration.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: integration.status === 'active' ? 'var(--success)' : 'var(--error)',
                }}
              >
                {integration.status || 'connected'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
