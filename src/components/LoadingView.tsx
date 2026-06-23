import { useState, useEffect, FC } from 'react';

interface LoadingViewProps {
  proteinId: string;
  chainId: string;
}

const LOADING_STEPS = [
  "Initializing structural analysis...",
  "Evaluating geometric and topological features...",
  "Computing intra-molecular distance matrices...",
  "Scanning for structural tandem repeat signatures...",
  "Aligning and refining repeat unit boundaries...",
  "Optimizing multi-domain cluster assignments...",
  "Finalizing results. Large or complex structures may require additional processing time..."
];

export const LoadingView: FC<LoadingViewProps> = ({ proteinId, chainId }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentStepIndex((prevIndex) => 
        prevIndex < LOADING_STEPS.length - 1 ? prevIndex + 1 : prevIndex
      );
    }, 5000);

    return () => clearInterval(messageInterval);
  }, []);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress < 40) return prevProgress + 1.5;
        if (prevProgress < 75) return prevProgress + 0.5;
        if (prevProgress < 95) return prevProgress + 0.1;
        return prevProgress;
      });
    }, 500);

    return () => clearInterval(progressInterval);
  }, []);

  const displayId = proteinId ? proteinId.toUpperCase() : "Sequence/File";
  const displayChain = chainId !== 'ALL' && chainId !== 'all' ? `(Chain ${chainId})` : '(All Chains)';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '400px', textAlign: 'center'
    }}>
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <div className="spinner" style={{
          width: '60px', height: '60px', border: '5px solid #e5e7eb',
          borderTop: '5px solid #0b78e3', borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>

      <h2 style={{ fontSize: '22px', color: '#111827', fontWeight: 600, margin: '0 0 12px 0' }}>
        Analyzing {displayId} {displayChain}
      </h2>

      <div style={{ width: '100%', maxWidth: '350px', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#0b78e3', transition: 'width 0.4s ease' }}></div>
      </div>

      <p style={{ color: '#4b5563', fontSize: '15px', maxWidth: '400px', lineHeight: '1.5', minHeight: '45px', margin: 0 }}>
        {LOADING_STEPS[currentStepIndex]}
      </p>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};