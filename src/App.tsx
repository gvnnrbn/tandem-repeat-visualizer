import { useEffect, useState } from 'react';
import InputView from './InputView';
import StructureView from './StructureView';
import StructureSelectionView from './StructureSelectionView';
import './index.css';
import './App.css';
import HomeButton from './components/HomeButton';
import { LoadingView } from './components/LoadingView';

type ViewState = 'INPUT' | 'STRUCTURE' | 'CHOICES' | 'LOADING' | 'ERROR_VIEW';
interface ErrorState {
  type: 'NOT_FOUND' | 'NO_REPEATS' | 'SERVER_ERROR';
  message: string;
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('INPUT');
  // const [availableChoices, setAvailableChoices] = useState<any[]>([]);
  // const [pendingConfig, setPendingConfig] = useState({ query: '' });
  const [multipleChoicesData, setMultipleChoicesData] = useState<any>(null);
  const [originalQuery, setOriginalQuery] = useState<string>('');

  const [structureData, setStructureData] = useState<any>(null);
  const [currentLoadingInfo, setCurrentLoadingInfo] = useState({ proteinId: '' });
  const [errorConfig, setErrorConfig] = useState<ErrorState | null>(null);

  const handleStartLoading = (proteinId: string) => {
    setCurrentLoadingInfo({ proteinId });
    setCurrentView('LOADING');
  };

  const handleMultipleChoices = (data: any, query: string) => {
    setMultipleChoicesData(data);
    setOriginalQuery(query);
    setCurrentView('CHOICES');
  };

  const handleSuccess = (result: any) => {
    const hasRepeats = result.chain_id === 'ALL' 
      ? Object.values(result.chains_data || {}).some((res: any) => res && res.length > 0)
      : (result.repeats && result.repeats.length > 0);
      if (!hasRepeats) {
        setErrorConfig({
          type: 'NO_REPEATS',
          message: `The microservice successfully processed protein ${result.protein_id.toUpperCase()}, but the TAPO algorithm did not detect significant tandem repeats in the selected chain.`
        });
        setCurrentView('ERROR_VIEW');
        return;
      }
      
      console.log('Has repeats:', hasRepeats, 'Result:', result);
    setStructureData(result);
    setCurrentView('STRUCTURE');
  };

  const handleProcessError = (err: any) => {
    console.error(err);
    setErrorConfig({
      type: 'SERVER_ERROR',
      message: err.message || 'An unknown error occurred while communicating with the server.'
    });
    setCurrentView('ERROR_VIEW');
  };

  const handleSelectChoice = async (selectedOption: any) => {
    setCurrentView('LOADING');
    setCurrentLoadingInfo({ proteinId: multipleChoicesData.protein_id });
    setErrorConfig(null);
    
    try {
      // Build payload matching our new DetectRepeatsRequest Pydantic schema
      const payload = {
        protein_id: multipleChoicesData.protein_id,
        id_type: multipleChoicesData.id_type,
        input_format: multipleChoicesData.input_format,
        choice_type: multipleChoicesData.choice_type,
        chain_id: selectedOption.chain_id,
        sequence: selectedOption.sequence,
        length: selectedOption.length,
        pdb_found: multipleChoicesData.pdb_found || null,
        pdb_url: selectedOption.pdbUrl || null
      };

      const response = await fetch('http://127.0.0.1:8000/api/detect-repeats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result.status === 'error') {
        throw new Error(result.message || 'Error processing selection.');
      }

      handleSuccess(result);

    } catch (err: any) {
      console.error('Error selecting choice:', err);
      setErrorConfig({
        type: 'SERVER_ERROR',
        message: err.message || 'Failed to analyze selected structure.'
      });
      setCurrentView('ERROR_VIEW');
    }
  };

  const headerStyle = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    textAlign: 'center',
    fontSize: '16px',
    margin: 0,
    padding: '0 1rem',
    background: '#0b78e3',
    color: '#ffffff',
    borderBottomLeftRadius: '20px',
    borderBottomRightRadius: '20px',
    letterSpacing: '0.5px',
    boxShadow: '0 3px 5px rgba(0, 0, 0, 0.4)',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
      <div style={headerStyle}>
        <HomeButton setCurrentView={setCurrentView} />
        <h1 style={{flex:2}}>PROTEIN TANDEM REPEAT VISUALIZER</h1>
      </div>

      <main style={{ flex: 1, padding: '10px 30px 30px' }}>
        {currentView === 'INPUT' && (
         <InputView 
            onSubmitSuccess={handleSuccess} 
            onSubmitMultipleChoices={handleMultipleChoices} 
            onLoadingStart={handleStartLoading}
            onLoadingError={handleProcessError}
          />
        )}
        
        {currentView === 'CHOICES' && multipleChoicesData && (
          <StructureSelectionView
            choiceType={multipleChoicesData.choice_type}
            options={multipleChoicesData.options}
            originalQuery={originalQuery}
            onSelect={handleSelectChoice}
            onCancel={() => setCurrentView('INPUT')}
          />
        )}
        
        {currentView === 'STRUCTURE' && structureData &&(
          <StructureView 
            proteinId={structureData.protein_id}
            proteinIdType={structureData.id_type}
            length={structureData.length}
            pdbStructure={structureData.pdb_found} 
            repeats={structureData.repeats} 
            chainId={structureData.chain_id}
            sequence={structureData.sequence}
          />
        )}
        {currentView === 'LOADING' && (
           <LoadingView 
             proteinId={currentLoadingInfo.proteinId} 
             chainId={"A"} 
           />
        )}
        
        {currentView === 'ERROR_VIEW' && errorConfig && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '400px', textAlign: 'center'
          }}>
            <div style={{ marginBottom: '10px', color: errorConfig.type === 'NO_REPEATS' ? '#0b78e3' : '#ef4444' }}>
              {errorConfig.type === 'NO_REPEATS' ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              )}
            </div>
            <h2 style={{ fontSize: '20px', color: '#111827', fontWeight: 600, marginBottom: '20px' }}>
              {errorConfig.type === 'NO_REPEATS' ? `No tandem repeats found for this protein` : errorConfig.message}
            </h2>
            {/* <p style={{ color: '#4b5563', fontSize: '16px', maxWidth: '500px', lineHeight: '1.6', marginBottom: '24px' }}>
              {errorConfig.message}
            </p> */}
            <button 
              onClick={() => setCurrentView('INPUT')}
              style={{
                padding: '10px 20px', backgroundColor: '#0b78e3', color: '#ffffff', marginTop: '20px',
                border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 500, cursor: 'pointer'
              }}
            >
              Return to Search
            </button>
          </div>
        )}
      </main>
    </div>
  );
}