import React, { useState } from 'react';
import { API_URL } from '../config';

export const DocumentUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [content, setContent] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage('');
      setContent('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setMessage(`✅ ${data.message}`);
      setContent(data.content);
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Upload failed'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="document-upload">
      <h2>📄 Document Upload</h2>
      <p className="upload-description">Upload text files (.txt, .md, .json, etc.) to process with AI</p>

      <div className="upload-controls">
        <input
          id="file-input"
          type="file"
          accept=".txt,.md,.json,.csv,.log,.xml,.html,.css,.js,.ts,.tsx,.jsx,.py,.java,.c,.cpp,.h,.hpp"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {file && (
          <div className="file-info">
            Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="upload-button"
        >
          {uploading ? 'Uploading...' : 'Upload & Process'}
        </button>
      </div>

      {message && (
        <div className={`upload-message ${message.startsWith('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {content && (
        <div className="file-content">
          <h3>File Content:</h3>
          <pre>{content.substring(0, 1000)}{content.length > 1000 ? '...' : ''}</pre>
          <p className="content-note">
            Content loaded and ready to use with AI assistant
          </p>
        </div>
      )}
    </div>
  );
};
