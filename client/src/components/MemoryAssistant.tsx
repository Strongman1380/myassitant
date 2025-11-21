import React, { useState, useEffect } from 'react';
import { useAudioRecording } from '../hooks/useAudioRecording';

const API_URL = 'http://localhost:3001';

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
