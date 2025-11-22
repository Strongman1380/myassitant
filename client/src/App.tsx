import { useState } from 'react';
import { AssistantMode } from './types';
import { TextAssistant } from './components/TextAssistant';
import { EmailAssistant } from './components/EmailAssistant';
import { CalendarAssistant } from './components/CalendarAssistant';
import { MemoryAssistant } from './components/MemoryAssistant';
import './App.css';

function App() {
  const [mode, setMode] = useState<AssistantMode>('text');

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
      default:
        return <TextAssistant />;
    }
  };

  return (
    <div className="app">
      <div className="mode-selector">
        <button
          className={`mode-button ${mode === 'text' ? 'active' : ''}`}
          onClick={() => setMode('text')}
          title="Message"
        >
          💬
        </button>
        <button
          className={`mode-button ${mode === 'email' ? 'active' : ''}`}
          onClick={() => setMode('email')}
          title="Email"
        >
          ✉️
        </button>
        <button
          className={`mode-button ${mode === 'calendar' ? 'active' : ''}`}
          onClick={() => setMode('calendar')}
          title="Calendar"
        >
          📅
        </button>
        <button
          className={`mode-button ${mode === 'memory' ? 'active' : ''}`}
          onClick={() => setMode('memory')}
          title="Memory"
        >
          🧠
        </button>
      </div>

      <div className="assistant-container">
        {renderAssistant()}
      </div>
    </div>
  );
}

export default App;
