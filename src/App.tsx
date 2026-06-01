import React, { useState } from 'react';
import InputView from './InputView';
import StructureView from './StructureView';
import Visor1 from './Visor1';

type ViewState = 'INPUT' | 'STRUCTURE' | 'VISOR1';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('INPUT');

  const handleMockSubmit = () => {
    setCurrentView('STRUCTURE'); 
  };

  const headerStyle = {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    textAlign: 'center' as const,
    fontSize: '28px',
    margin: 0,
    padding: '18px 20px',
    background: '#0b78e3',
    color: '#ffffff',
    borderBottomLeftRadius: '16px',
    borderBottomRightRadius: '16px',
    letterSpacing: '0.3px',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
      
      <h1 style={headerStyle}>PROTEIN TANDEM REPEAT VISUALIZER</h1>

      <main style={{ flex: 1, padding: '26px 30px 30px' }}>
        {currentView === 'INPUT' && (
          <InputView onSubmitMock={handleMockSubmit} />
        )}
        
        {currentView === 'STRUCTURE' && (
          <StructureView 
            onGoHome={() => setCurrentView('INPUT')} 
            onGoStructure={() => setCurrentView('STRUCTURE')} 
          />
        )}
      </main>
      
    </div>
  );
}