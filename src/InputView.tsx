import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FC, FormEvent } from 'react';

interface InputViewProps {
  onSubmitMock?: () => void;
  onSubmitSuccess?: (data: any) => void;
  onSubmitMultipleChoices: (options: any[], originalQuery: string, chainId: string, chainMode: string) => void;
}

const InputView: FC<InputViewProps> = ({ onSubmitMock, onSubmitSuccess, onSubmitMultipleChoices }) => {
  const allowedFileExtensions = ['.pdb', '.cif', '.fasta'];
  const [proteinStructure, setProteinStructure] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chainMode, setChainMode] = useState<'all' | 'single'>('all');
  const [chainId, setChainId] = useState<string>('');
  
  // New states for handling API requests
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileExtension = (fileName: string) => {
    const normalizedFileName = fileName.trim().toLowerCase();
    const extensionIndex = normalizedFileName.lastIndexOf('.');
    return extensionIndex >= 0 ? normalizedFileName.slice(extensionIndex) : '';
  };

  const hasTextQuery = proteinStructure.trim().length > 0;
  const hasFileQuery = selectedFile !== null;
  const hasAllowedFileExtension = !selectedFile || allowedFileExtensions.includes(getFileExtension(selectedFile.name));
  const hasValidChainSelection = chainMode === 'all' || chainId.trim().length > 0;
  const isExclusiveInputValid = !(hasTextQuery && hasFileQuery);
  const isFileSelectionValid = !hasFileQuery || hasAllowedFileExtension;
  const isReadyForSubmit = isExclusiveInputValid && hasValidChainSelection && isFileSelectionValid;

  const readinessTooltip = (() => {
    if (!isExclusiveInputValid) {
      return 'Pick only one input source: either the text area or a file upload.';
    }
    if (hasFileQuery && !hasAllowedFileExtension) {
      return 'Only .pdb, .cif, or .fasta files can enable submit.';
    }
    if (!hasValidChainSelection) {
      return 'Select Single chain ID and enter one character, or keep All chains selected.';
    }
    return 'Ready to submit.';
  })();

  useEffect(() => {
    setIsEmpty(!isReadyForSubmit);
  }, [isReadyForSubmit]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (onSubmitMock) {
      alert("onSubmitMock")
      onSubmitMock();
      return;
    }

    if (!onSubmitSuccess || !onSubmitMultipleChoices) {
      alert(onSubmitSuccess + " and " + onSubmitMultipleChoices)
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let response;
      const baseUrl = 'http://127.0.0.1:8000';

      if (selectedFile) {
        // Handle physical file upload using FormData
        const formData = new FormData();
        formData.append('file_upload', selectedFile);
        // formData.append('chain_mode', chainMode);
        if (chainMode === 'single') formData.append('chain_id', chainId);

        response = await fetch(`${baseUrl}/api/prepare-structure/file`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Handle text input (PDB ID, Uniprot, AlphaFold ID) using JSON
        const formDataText = new FormData();
        formDataText.append('text_query', proteinStructure);
        // TODO
        formDataText.append('chain_id', chainId/*,chain_mode */); 

        response = await fetch(`${baseUrl}/api/prepare-structure/text`, {
          method: 'POST',
          body: formDataText,
        });
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status === 'multiple_choices') {
        onSubmitMultipleChoices(result.options || result.data, proteinStructure, chainId, chainMode);
      } else if (result.status === 'success') {
        onSubmitSuccess(result);
      } else {
        throw new Error('Unknown status received from the server.');
      }

    } catch (err: any) {
      console.error('Submission failed:', err);
      if (err.message.includes('404')){
        setError('No matching structure found. Please check your input and try again.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProteinStructureChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setProteinStructure(e.target.value);
    setError(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChainIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setChainId(e.target.value.toUpperCase());
    setError(null);
  };

  const handleChainModeChange = (mode: 'all' | 'single') => {
    setChainMode(mode);
    setError(null);
    if (mode === 'all') {
      setChainId('');
    }
  };

  // --- STYLES ---
  const formStyle = { display: 'flex', flexDirection: 'column' as const, gap: '2rem' };
  const sectionStyle = { display: 'flex', flexDirection: 'column' as const, gap: '1rem' };
  const labelStyle = { fontSize: '20px', fontWeight: 700, lineHeight: 1.2, color: '#111827' };
  const textareaStyle = {
    width: '100%', minHeight: '160px', padding: '14px 16px', borderRadius: '8px',
    border: '1px solid #8f96a3', boxSizing: 'border-box' as const, laily: 'inherit',
    fontSize: '18px', resize: 'vertical' as const, outline: 'none', backgroundColor: '#fff',
  };
  const helperStyle = { fontSize: '20px', fontWeight: 700, color: '#111827' };
  const uploadButtonStyle = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 'fit-content',
    minWidth: '108px', padding: '8px 18px', borderRadius: '8px', border: '1px solid #5c6f99',
    background: 'linear-gradient(180deg, #b7c8f3 0%, #9eb7ea 100%)', color: '#111827',
    fontSize: '16px', fontWeight: 500, cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), 0 2px 3px rgba(0,0,0,0.15)',
  };
  const radioGroupStyle = { display: 'flex', flexDirection: 'column' as const, gap: '14px' };
  const radioRowStyle = { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: '#111827' };
  const shortInputStyle = {
    width: '76px', height: '2rem', padding: '0 12px', borderRadius: '8px', border: '1px solid #8f96a3',
    boxSizing: 'border-box' as const, fontFamily: 'inherit', fontSize: '16px',
    textTransform: 'uppercase' as const, backgroundColor: chainMode === 'single' ? '#fff' : '#f3f4f6', color: '#111827',
  };
  const submitButtonStyle = {
    padding: '8px 20px', background: 'linear-gradient(180deg, #b7c8f3 0%, #9eb7ea 100%)',
    border: '1px solid #5c6f99', borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer',
    fontSize: '17px', alignSelf: 'center' as const, fontWeight: 'bold' as const,
    minWidth: '104px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), 0 2px 3px rgba(0,0,0,0.15)',
    opacity: isLoading ? 0.7 : 1, marginTop: '-10px',
  };
  const errorStyle = 
  {
    color: '#dc2626',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.35,
    backgroundColor: '#ffeded',
    border: '1px solid #feaaaa',
    borderRadius: '8px',
    padding: '10px 12px',
  }
  const warningStyle = {
    color: '#b45309',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.35,
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: '8px',
    padding: '10px 12px',
    marginBottom: '-1rem'
  };

  return (
    <form style={formStyle} onSubmit={handleSubmit}>
      <section style={sectionStyle}>
        <div style={labelStyle}>1. Enter 4-character PDB ID, Accession ID, AlphaFold ID or Sequence:</div>
        <textarea
          style={textareaStyle}
          value={proteinStructure}
          onChange={handleProteinStructureChange}
          placeholder=""
          disabled={isLoading}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={helperStyle}>or upload a pdb/mmCIF/FASTA file</div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center' }}>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept=".pdb,.cif,.fasta"
              disabled={isLoading}
            />
            <button
              type="button"
              style={uploadButtonStyle}
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              Upload
            </button>
            {selectedFile && (
              <div style={{ display: 'flex', flexDirection: 'row', gap: '8px',}}>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Selected: {selectedFile.name}</span>
                {!isLoading && (<a
                  onClick={handleRemoveFile}
                  style={{
                    color: '#dd0000',
                    textDecoration: 'underline',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Remove file
                </a>)}
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={labelStyle}>2. Select chain(s) to be searched:</div>
        <div style={radioGroupStyle}>
          {/* <label style={radioRowStyle}>
            <input
              type="radio"
              name="chain-mode"
              checked={chainMode === 'all'}
              onChange={() => handleChainModeChange('all')}
              style={{ transform: 'scale(1.35)' }}
              disabled={isLoading}
            />
            <span>All chains</span>
          </label> */}
          <label style={radioRowStyle}>
            <input
              type="radio"
              name="chain-mode"
              checked={chainMode === 'single'}
              onChange={() => handleChainModeChange('single')}
              style={{ transform: 'scale(1.35)' }}
              disabled={isLoading}
            />
            <span>Single chain ID:</span>
            <input
              type="text"
              style={shortInputStyle}
              value={chainId}
              onChange={handleChainIdChange}
              maxLength={1}
              disabled={chainMode !== 'single' || isLoading}
              aria-label="Single chain ID"
            />
          </label>
        </div>
      </section>

      {!isExclusiveInputValid && (
        <div style={warningStyle}>Please enter input through only one source: either the text area or a file upload.</div>
      )}

      {hasFileQuery && !hasAllowedFileExtension && (
        <div style={warningStyle}>Only .pdb, .cif, or .fasta files can enable submit.</div>
      )}

      {chainMode === 'single' && !chainId.trim() && (
        <div style={warningStyle}>Single chain mode needs exactly one chain ID character.</div>
      )}

      {error && <div style={errorStyle}>{error}</div>}

      <button
        type="submit"
        style={submitButtonStyle}
        disabled={isLoading || isEmpty}
        title={isLoading ? 'Please wait while the request is processing.' : readinessTooltip}
      >
        {isLoading ? 'Processing...' : 'Submit'}
      </button>
    </form>
  );
};

export default InputView;