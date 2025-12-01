import React, { useState, useEffect } from 'react';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { API_URL } from '../config';

interface Memory {
  id: string;
  content: string;
  raw_input: string;
  category: string;
  memory_type: string;
  tags: string[];
  importance_level: string;
  related_entities: string[];
  context: string | null;
  created_at: string;
}

interface MemoryAddResponse {
  success: boolean;
  original: string;
  formatted: string;
  metadata: {
    category: string;
    memory_type: string;
    importance_level: string;
    tags: string[];
    related_entities: string[];
  };
  totalMemories: number;
}

interface MemoryListResponse {
  type: string;
  memories: Memory[];
  count: number;
}

export const MemoryAssistant: React.FC = () => {
  const [rawInput, setRawInput] = useState('');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastAdded, setLastAdded] = useState<{
    original: string;
    formatted: string;
    metadata: MemoryAddResponse['metadata'];
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Memory[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchExplanation, setSearchExplanation] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const {
    isRecording,
    isTranscribing,
    error: recordingError,
    startRecording,
    stopRecording,
  } = useAudioRecording();

  useEffect(() => {
    loadMemories();
    loadCategories();
  }, []);

  const loadMemories = async (category?: string) => {
    try {
      const url = category && category !== 'all'
        ? `${API_URL}/api/memory/list?category=${category}`
        : `${API_URL}/api/memory/list`;

      console.log('🔍 Loading memories from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load memories');
      }
      const data: MemoryListResponse = await response.json();
      console.log('✅ Memories loaded:', data);
      console.log('📊 Setting memories state with', data.memories?.length || 0, 'items');
      setMemories(data.memories || []);
    } catch (err) {
      console.error('❌ Error loading memories:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/memory/categories`);
      if (!response.ok) {
        throw new Error('Failed to load categories');
      }
      const data = await response.json();
      setCategories(data.categories);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    loadMemories(category);
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      try {
        const transcription = await stopRecording();
        setRawInput(transcription);
      } catch (err) {
        setError('Failed to transcribe audio. Please try again.');
      }
    } else {
      await startRecording();
    }
  };

  const handleAddMemory = async () => {
    if (!rawInput.trim()) {
      setError('Please enter something to remember');
      return;
    }

    setLoading(true);
    setError('');
    setLastAdded(null);

    try {
      const response = await fetch(`${API_URL}/api/memory/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rawInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to add memory');
      }

      const data: MemoryAddResponse = await response.json();
      setLastAdded({
        original: data.original,
        formatted: data.formatted,
        metadata: data.metadata
      });
      setRawInput('');
      // Reload memories and categories to reflect the new addition
      await loadMemories(selectedCategory);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleAddMemory();
    }
  };

  const getImportanceColor = (level: string) => {
    switch (level) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#2563eb';
      case 'low': return '#64748b';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      biographical: '👤',
      preference: '⭐',
      schedule: '📅',
      contact: '📞',
      work: '💼',
      personal: '🏠',
      health: '❤️',
      finance: '💰',
      hobby: '🎨',
      goal: '🎯',
      relationship: '🤝',
      skill: '🔧',
      general: '📝'
    };
    return icons[category] || '📝';
  };

  const handleDeleteMemory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/memory/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete memory');
      }

      // Reload memories and categories after deletion
      await loadMemories(selectedCategory);
      await loadCategories();
    } catch (err) {
      console.error('Error deleting memory:', err);
      setError('Failed to delete memory. Please try again.');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchExplanation('');
      return;
    }

    setSearching(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/memory/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResults(data.results);
      setSearchExplanation(data.explanation || '');
    } catch (err) {
      setError('Failed to search memories. Please try again.');
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchExplanation('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setUploadMessage('');
    }
  };

  const handleDocumentUpload = async () => {
    if (!uploadFile) {
      setUploadMessage('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await fetch(`${API_URL}/api/memory/parse-document`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setUploadMessage(`✅ ${data.message}`);
      setUploadFile(null);

      // Reset file input
      const fileInput = document.getElementById('doc-upload-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Reload memories to show the new ones
      loadMemories();
      loadCategories();
    } catch (error) {
      setUploadMessage(`❌ Error: ${error instanceof Error ? error.message : 'Upload failed'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="form-group">
        <label htmlFor="memory-input">Tell Me Something to Remember</label>
        <div className="input-with-mic">
          <textarea
            id="memory-input"
            placeholder="Speak or type something you want me to remember... (e.g., 'my favorite coffee is a vanilla latte', 'I work at Aspire Impact Network', 'therapy is every Tuesday at 2pm')"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={isRecording ? 'listening' : ''}
            disabled={isTranscribing}
          />
          <button
            type="button"
            className={`mic-button ${isRecording ? 'recording' : ''} ${isTranscribing ? 'transcribing' : ''}`}
            onClick={handleVoiceToggle}
            disabled={isTranscribing}
            title={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Start voice dictation'}
          >
            {isTranscribing ? '⏳' : isRecording ? '⏹' : '🎤'}
          </button>
        </div>
        {isRecording && (
          <div className="recording-indicator">
            🔴 Recording... speak now
          </div>
        )}
        {isTranscribing && (
          <div className="transcribing-indicator">
            ⏳ Transcribing your audio...
          </div>
        )}
        {recordingError && (
          <div className="warning-message">
            {recordingError}
          </div>
        )}
      </div>

      <button
        className="action-button"
        onClick={handleAddMemory}
        disabled={loading || isRecording || isTranscribing}
      >
        {loading ? 'Processing...' : 'Remember This'}
      </button>

      {error && <div className="error-message">{error}</div>}

      {lastAdded && (
        <div className="result-container">
          <h3>Memory Added Successfully!</h3>
          <div className="email-result">
            <div className="email-field">
              <label>What you said:</label>
              <div className="email-field-content">{lastAdded.original}</div>
            </div>
            <div className="email-field">
              <label>How I'll remember it:</label>
              <div className="email-field-content">{lastAdded.formatted}</div>
            </div>
            <div className="email-field">
              <label>Metadata:</label>
              <div className="email-field-content">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: 'var(--primary)',
                    borderRadius: '12px',
                    fontSize: '13px'
                  }}>
                    {getCategoryIcon(lastAdded.metadata.category)} {lastAdded.metadata.category}
                  </span>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: 'var(--secondary)',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '13px'
                  }}>
                    {lastAdded.metadata.memory_type}
                  </span>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: getImportanceColor(lastAdded.metadata.importance_level),
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '13px'
                  }}>
                    {lastAdded.metadata.importance_level}
                  </span>
                </div>
                {lastAdded.metadata.tags.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-dark)' }}>
                    Tags: {lastAdded.metadata.tags.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="result-container" style={{ marginTop: '30px' }}>
        <h3>Search Memories</h3>
        <div className="form-group">
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Ask me anything... (e.g., 'what's my boss's name?', 'where do I work?', 'what are my hobbies?')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--background-light)',
                color: 'var(--text-light)',
                fontSize: '14px'
              }}
            />
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--primary)',
                color: 'white',
                cursor: searching ? 'wait' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
            {searchResults !== null && (
              <button
                onClick={clearSearch}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--background-light)',
                  color: 'var(--text-light)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Document Upload Section */}
        <div style={{ marginTop: '24px', marginBottom: '24px' }}>
          <div style={{
            padding: '16px',
            background: 'var(--background-light)',
            borderRadius: '8px',
            borderLeft: '4px solid #9b59b6'
          }}>
            <div style={{ fontWeight: '500', marginBottom: '12px', color: '#9b59b6' }}>
              📄 Upload Document to Extract Memories
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-dark)', marginBottom: '12px' }}>
              Upload a text document and AI will automatically extract important information and save it as memories.
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="file"
                accept=".txt,.md,.doc,.docx"
                onChange={handleFileChange}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '14px',
                  flex: '1',
                  minWidth: '200px'
                }}
              />
              {uploadFile && (
                <div style={{ fontSize: '13px', color: 'var(--text-dark)' }}>
                  {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
              <button
                onClick={handleDocumentUpload}
                disabled={!uploadFile || uploading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: uploadFile && !uploading ? '#9b59b6' : '#ccc',
                  color: 'white',
                  cursor: uploadFile && !uploading ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {uploading ? 'Processing...' : 'Upload & Parse'}
              </button>
            </div>
            {uploadMessage && (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: uploadMessage.includes('✅') ? '#d4edda' : '#f8d7da',
                color: uploadMessage.includes('✅') ? '#155724' : '#721c24',
                borderRadius: '6px',
                fontSize: '13px'
              }}>
                {uploadMessage}
              </div>
            )}
          </div>
        </div>

        {searchResults !== null && (
          <div style={{ marginTop: '16px', marginBottom: '24px' }}>
            <div style={{
              padding: '12px',
              background: 'var(--background-light)',
              borderRadius: '8px',
              borderLeft: '4px solid var(--primary)'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '8px', color: 'var(--primary)' }}>
                🔍 Search Results ({searchResults.length})
              </div>
              {searchExplanation && (
                <div style={{ fontSize: '13px', color: 'var(--text-dark)', marginBottom: '8px' }}>
                  {searchExplanation}
                </div>
              )}
              {searchResults.length === 0 ? (
                <div style={{ fontSize: '14px', color: 'var(--text-dark)' }}>
                  No memories found matching your query.
                </div>
              ) : (
                <div className="memory-list" style={{ marginTop: '12px' }}>
                  {searchResults.map((memory) => (
                    <div key={memory.id} className="memory-item">
                      <div style={{ marginBottom: '8px' }}>{memory.content}</div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginTop: '8px'
                      }}>
                        <span style={{
                          padding: '3px 10px',
                          backgroundColor: 'var(--primary)',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {getCategoryIcon(memory.category)} {memory.category}
                        </span>
                        {memory.tags && memory.tags.length > 0 && (
                          <span style={{
                            fontSize: '12px',
                            color: 'var(--text-dark)'
                          }}>
                            🏷️ {memory.tags.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="result-container" style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0 }}>All Stored Memories ({memories.length})</h3>
          <div>
            <label htmlFor="category-filter" style={{ marginRight: '8px', fontSize: '14px', color: 'var(--text-dark)' }}>
              Filter:
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--background-light)',
                color: 'var(--text-light)',
                fontSize: '14px'
              }}
            >
              <option value="all">All Categories</option>
              {Object.entries(categories)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, count]) => (
                  <option key={category} value={category}>
                    {getCategoryIcon(category)} {category} ({count})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {memories.length === 0 ? (
          <div className="memory-empty">
            {selectedCategory === 'all'
              ? 'No memories stored yet. Tell me something about yourself!'
              : `No memories in the "${selectedCategory}" category yet.`}
          </div>
        ) : (
          <div className="memory-list">
            {memories.map((memory) => (
              <div key={memory.id} className="memory-item" style={{ position: 'relative' }}>
                <button
                  onClick={() => handleDeleteMemory(memory.id)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    opacity: 0.7,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                  title="Delete this memory"
                >
                  Delete
                </button>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                  paddingRight: '70px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '8px' }}>{memory.content}</div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '8px'
                    }}>
                      <span style={{
                        padding: '3px 10px',
                        backgroundColor: 'var(--primary)',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {getCategoryIcon(memory.category)} {memory.category}
                      </span>
                      <span style={{
                        padding: '3px 10px',
                        backgroundColor: 'var(--secondary)',
                        color: 'white',
                        borderRadius: '10px',
                        fontSize: '12px'
                      }}>
                        {memory.memory_type}
                      </span>
                      <span style={{
                        padding: '3px 10px',
                        backgroundColor: getImportanceColor(memory.importance_level),
                        color: 'white',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {memory.importance_level}
                      </span>
                    </div>
                    {memory.tags && memory.tags.length > 0 && (
                      <div style={{
                        marginTop: '6px',
                        fontSize: '12px',
                        color: 'var(--text-dark)'
                      }}>
                        🏷️ {memory.tags.join(', ')}
                      </div>
                    )}
                    {memory.related_entities && memory.related_entities.length > 0 && (
                      <div style={{
                        marginTop: '4px',
                        fontSize: '12px',
                        color: 'var(--text-dark)'
                      }}>
                        🔗 {memory.related_entities.join(', ')}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-dark)',
                    whiteSpace: 'nowrap'
                  }}>
                    {new Date(memory.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
