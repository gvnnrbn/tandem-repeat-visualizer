import { useState } from 'react';
import InputView from './InputView';
import StructureView from './StructureView';
import StructureSelectionView from './StructureSelectionView'; // Import the new view
import './index.css';
import './App.css';

type ViewState = 'INPUT' | 'STRUCTURE' | 'CHOICES' | 'GUIDE' | 'LOADING';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('INPUT');
  
  // Updated to any[] to hold the objects {af_id, uniprot, length...} instead of just strings
  const [availableChoices, setAvailableChoices] = useState<any[]>([]);
  const [pendingConfig, setPendingConfig] = useState({ query: '', chainId: '', chainMode: 'all' });

  const handleMultipleChoices = (options: any[], query: string, chainId: string, chainMode: string) => {
    setAvailableChoices(options);
    setPendingConfig({ query, chainId, chainMode });
    setCurrentView('CHOICES');
  };

  const handleSuccess = () => {
    setCurrentView('STRUCTURE');
  };

  const handleSelectChoice = async (selectedId: string) => {
    try {
      setCurrentView('LOADING');
      const baseUrl = 'http://localhost:8000';
      
      const formData = new FormData();
      formData.append('text_query', selectedId);
      formData.append('chain_id', pendingConfig.chainId || 'A'); 

      const response = await fetch(`${baseUrl}/api/prepare-structure/text`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to fetch the specific model');

      const result = await response.json();
      if (result.status === 'success') {
        handleSuccess();
      }
    } catch (error) {
      console.error('Error selecting choice:', error);
      setCurrentView('CHOICES'); // Return to choices if it fails
    }
  };

  const headerStyle = {
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
          <InputView 
            onSubmitSuccess={handleSuccess} 
            onSubmitMultipleChoices={handleMultipleChoices} 
          />
        )}
        
        {currentView === 'CHOICES' && (
          <StructureSelectionView
            options={availableChoices}
            originalQuery={pendingConfig.query}
            onSelect={handleSelectChoice}
            onGoBack={() => setCurrentView('INPUT')}
          />
        )}
        
        {currentView === 'STRUCTURE' && (
          <StructureView 
            onGoHome={() => setCurrentView('INPUT')} 
            onGoStructure={() => setCurrentView('STRUCTURE')} 
            // In the future, pass structureData to your Molstar/FeatureViewer inside StructureView
          />
        )}
        {currentView === 'LOADING' && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '400px',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '24px', color: '#111827' }}>
              Processing Structure...
            </h2>
            <p style={{ fontSize: '18px', color: '#4b5563' }}>
              Analyzing tandem repeats. Please wait.
            </p>
            <div className="loader"></div>
          </div>
        )}
      </main>
    </div>
  );
}