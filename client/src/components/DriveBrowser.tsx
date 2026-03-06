import { useState, useEffect } from 'react';
import { API_URL } from '../config';

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
};

type IngestResult = {
  id: string;
  content: string;
  category: string;
};

export function DriveBrowser() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [authUrl, setAuthUrl] = useState('');
  const [ingesting, setIngesting] = useState<string | null>(null);
  const [ingestResult, setIngestResult] = useState<{ fileId: string; count: number; memories: IngestResult[] } | null>(null);
  const [error, setError] = useState('');
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_URL}/api/drive/auth-status`);
      const data = await res.json();
      setAuthorized(data.authorized);
      if (!data.authorized && data.authUrl) {
        setAuthUrl(data.authUrl);
      }
      if (data.authorized) {
        loadFiles();
      }
    } catch {
      setAuthorized(false);
    }
  };

  const loadFiles = async (folderId?: string, query?: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (folderId) params.set('folderId', folderId);
      if (query) params.set('query', query);
      params.set('pageSize', '30');

      const res = await fetch(`${API_URL}/api/drive/files?${params}`);
      const data = await res.json();

      if (data.needsAuth) {
        setAuthorized(false);
        return;
      }

      setFiles(data.files || []);
    } catch (err) {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFolderStack([]);
    loadFiles(undefined, searchQuery);
  };

  const handleFolderOpen = (file: DriveFile) => {
    setFolderStack(prev => [...prev, { id: file.id, name: file.name }]);
    loadFiles(file.id);
  };

  const handleFolderBack = () => {
    const newStack = [...folderStack];
    newStack.pop();
    setFolderStack(newStack);
    const parentId = newStack.length > 0 ? newStack[newStack.length - 1].id : undefined;
    loadFiles(parentId);
  };

  const handleIngest = async (file: DriveFile) => {
    setIngesting(file.id);
    setIngestResult(null);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/drive/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to ingest file');
        return;
      }

      setIngestResult({
        fileId: file.id,
        count: data.memoriesAdded,
        memories: data.memories || []
      });
    } catch {
      setError('Failed to ingest file');
    } finally {
      setIngesting(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return '📁';
    if (mimeType.includes('document') || mimeType.includes('text')) return '📄';
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return '📊';
    if (mimeType.includes('presentation')) return '📑';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('image')) return '🖼️';
    return '📎';
  };

  const canIngest = (mimeType: string) => {
    return [
      'application/vnd.google-apps.document',
      'application/vnd.google-apps.spreadsheet',
      'application/vnd.google-apps.presentation',
      'text/plain',
      'text/csv',
      'application/json',
      'text/html',
      'text/markdown',
    ].includes(mimeType);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (authorized === null) {
    return <div className="drive-loading">Checking Drive access...</div>;
  }

  if (!authorized) {
    return (
      <div className="drive-auth">
        <p>Google Drive access required.</p>
        {authUrl ? (
          <a href={authUrl} target="_blank" rel="noopener noreferrer" className="drive-auth-btn">
            Authorize Google Drive
          </a>
        ) : (
          <p className="drive-auth-note">Set up Google credentials first.</p>
        )}
      </div>
    );
  }

  return (
    <div className="drive-browser">
      <div className="drive-search">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search Drive..."
        />
        <button onClick={handleSearch} disabled={loading}>Search</button>
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); setFolderStack([]); loadFiles(); }}>Clear</button>
        )}
      </div>

      {folderStack.length > 0 && (
        <div className="drive-breadcrumb">
          <button onClick={() => { setFolderStack([]); loadFiles(); }}>My Drive</button>
          {folderStack.map((folder, i) => (
            <span key={folder.id}>
              <span className="breadcrumb-sep">/</span>
              <button onClick={() => {
                const newStack = folderStack.slice(0, i + 1);
                setFolderStack(newStack);
                loadFiles(folder.id);
              }}>
                {folder.name}
              </button>
            </span>
          ))}
        </div>
      )}

      {error && <div className="drive-error">{error}</div>}

      {ingestResult && (
        <div className="drive-ingest-result">
          <strong>{ingestResult.count} memories extracted</strong>
          {ingestResult.memories.slice(0, 3).map((m, i) => (
            <div key={i} className="ingest-memory-preview">
              <span className="ingest-category">{m.category}</span> {m.content}
            </div>
          ))}
          {ingestResult.memories.length > 3 && (
            <div className="ingest-more">+{ingestResult.memories.length - 3} more</div>
          )}
          <button onClick={() => setIngestResult(null)} className="ingest-dismiss">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="drive-loading">Loading files...</div>
      ) : files.length === 0 ? (
        <div className="drive-empty">No files found</div>
      ) : (
        <div className="drive-file-list">
          {folderStack.length > 0 && (
            <div className="drive-file-item drive-back" onClick={handleFolderBack}>
              <span className="file-icon">⬆️</span>
              <span className="file-name">Back</span>
            </div>
          )}
          {files.map(file => (
            <div key={file.id} className="drive-file-item">
              <span className="file-icon">{getFileIcon(file.mimeType)}</span>
              <div className="file-info"
                onClick={() => file.mimeType === 'application/vnd.google-apps.folder'
                  ? handleFolderOpen(file)
                  : file.webViewLink && window.open(file.webViewLink, '_blank')
                }
              >
                <span className="file-name">{file.name}</span>
                <span className="file-date">{formatDate(file.modifiedTime)}</span>
              </div>
              {canIngest(file.mimeType) && (
                <button
                  className="ingest-btn"
                  onClick={() => handleIngest(file)}
                  disabled={ingesting === file.id}
                >
                  {ingesting === file.id ? '...' : 'Ingest'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
