import { useState } from 'react';
import { AssistantMode } from './types';
import { TextAssistant } from './components/TextAssistant';
import { EmailAssistant } from './components/EmailAssistant';
import { CalendarAssistant } from './components/CalendarAssistant';
import { MemoryAssistant } from './components/MemoryAssistant';
import { DocumentUpload } from './components/DocumentUpload';
import './App.css';

const MODES: Array<{
  id: AssistantMode;
  label: string;
  description: string;
  hint: string;
  icon: string;
}> = [
  {
    id: 'text',
    label: 'Message Rewrite',
    description: 'Clean up casual texts, keep the tone warm, and copy to your clipboard automatically.',
    hint: 'Keep it short and kind',
    icon: '💬',
  },
  {
    id: 'email',
    label: 'Email Draft',
    description: 'Capture the intent, get a structured subject and body, then drop it straight into Gmail.',
    hint: 'Add the context and recipients',
    icon: '✉️',
  },
  {
    id: 'calendar',
    label: 'Calendar Parse',
    description: 'Describe the meeting and get ready-to-schedule event details with reminders.',
    hint: 'Time, location, goal',
    icon: '📅',
  },
  {
    id: 'memory',
    label: 'Personal Memory',
    description: 'Store facts about you, search them later, and keep everything organized by category.',
    hint: 'Facts, names, routines',
    icon: '🧠',
  },
  {
    id: 'upload' as AssistantMode,
    label: 'Document Upload',
    description: 'Upload and process text documents with AI assistance.',
    hint: 'Text files, code, logs',
    icon: '📄',
  },
];

function App() {
  const [mode, setMode] = useState<AssistantMode>('text');
  const activeMode = MODES.find((item) => item.id === mode) ?? MODES[0];

  const renderAssistant = () => {
    switch (mode) {
      case 'text':
        return <TextAssistant />;
      case 'email':
        return <EmailAssistant />;
      case 'calendar':
        return <CalendarAssistant />;
      case 'memory':
        return <MemoryAssistant />;
      case 'upload' as AssistantMode:
        return <DocumentUpload />;
      default:
        return <TextAssistant />;
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-badges">
          <span className="pill pill-live">Live workspace</span>
          <span className="pill pill-soft">Voice dictation ready</span>
          <span className="pill pill-outline">Clipboard auto-copy</span>
        </div>
        <h1>
          A modern canvas for your assistant
          <span className="hero-highlight"> across messages, email, calendar, and memory.</span>
        </h1>
        <p className="hero-subtitle">
          Rewrite casual texts, draft clean emails, parse calendar requests, and remember personal context without
          jumping between tools.
        </p>
        <div className="hero-metrics">
          <div className="metric">
            <div className="metric-number">4</div>
            <div className="metric-label">Smart modes</div>
          </div>
          <div className="metric">
            <div className="metric-number">Voice</div>
            <div className="metric-label">Dictate anywhere</div>
          </div>
          <div className="metric">
            <div className="metric-number">Share</div>
            <div className="metric-label">Copy & send quickly</div>
          </div>
        </div>
      </header>

      <div className="workspace">
        <aside className="mode-panel">
          <div className="mode-panel-header">
            <div>
              <p className="eyebrow">Mode switcher</p>
              <h3>Pick the assistant you need</h3>
            </div>
            <span className="pill pill-soft">Tap to switch</span>
          </div>
          <div className="mode-list">
            {MODES.map((item) => (
              <button
                key={item.id}
                className={`mode-card ${mode === item.id ? 'active' : ''}`}
                onClick={() => setMode(item.id)}
                type="button"
                aria-pressed={mode === item.id}
              >
                <div className="mode-icon">{item.icon}</div>
                <div className="mode-copy">
                  <div className="mode-label">{item.label}</div>
                  <div className="mode-hint">{item.hint}</div>
                </div>
                <span className="mode-caret">↗</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="assistant-panel">
          <div className="panel-header">
            <p className="eyebrow">Active mode</p>
            <div className="panel-title-row">
              <h2>{activeMode.label}</h2>
              <span className="pill pill-outline">{activeMode.icon} {activeMode.id}</span>
            </div>
            <p className="panel-subtitle">{activeMode.description}</p>
          </div>
          <div className="assistant-body">
            {renderAssistant()}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
