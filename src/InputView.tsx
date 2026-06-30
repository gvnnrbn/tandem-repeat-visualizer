import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FC, FormEvent } from 'react';
import './App.css';
interface InputViewProps {
  onSubmitSuccess?: (data: any) => void;
  onSubmitMultipleChoices: (options: any[], originalQuery: string) => void;
  onLoadingStart: (proteinId: string) => void;  
  onLoadingError: (err: any) => void;
}

const InputView: FC<InputViewProps> = ({ onSubmitSuccess, onSubmitMultipleChoices, onLoadingStart, onLoadingError }) => {
  const allowedFileExtensions = ['.pdb', '.cif', '.fasta'];
  const [proteinStructure, setProteinStructure] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
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
  
  const hasAtLeastOneInput = hasTextQuery || hasFileQuery;
  const isExclusiveInputValid = hasAtLeastOneInput && !(hasTextQuery && hasFileQuery);
  const isFileSelectionValid = !hasFileQuery || hasAllowedFileExtension;
  
  const isReadyForSubmit = isExclusiveInputValid && isFileSelectionValid;

  const readinessTooltip = (() => {
    if (!hasAtLeastOneInput) {
      return 'Please provide either a text query or a file upload.';
    }
    if (hasTextQuery && hasFileQuery) {
      return 'Pick only one input source: either the text area or a file upload.';
    }
    if (hasFileQuery && !hasAllowedFileExtension) {
      return 'Only .pdb, .cif, or .fasta files can enable submit.';
    }
    return 'Ready to submit.';
  })();

  useEffect(() => {
    setIsEmpty(!isReadyForSubmit);
  }, [isReadyForSubmit]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!onSubmitSuccess || !onSubmitMultipleChoices) {
      return;
    }
    setIsLoading(true);
    setError(null);
    
    if (onLoadingStart) onLoadingStart(proteinStructure); 

    try {
      let response;
      const baseUrl = 'http://127.0.0.1:8000';
      try{
        if (selectedFile) {
          const formData = new FormData();
          formData.append('file_upload', selectedFile);

          response = await fetch(`${baseUrl}/api/prepare-structure/file`, {
            method: 'POST',
            body: formData,
          });
        } else {
          const formDataText = new FormData();
          formDataText.append('text_query', proteinStructure);

          response = await fetch(`${baseUrl}/api/prepare-structure/text`, {
            method: 'POST',
            body: formDataText,
          });
        }
      } catch (networkError) {
        throw new Error('Failed to connect to the server. Please verify that the backend is running.');
      }
      
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        if (!response.ok) {
          throw new Error(response.status === 500 ? 'Internal Server Error (500).' : `HTTP Error: ${response.status}`);
        }
        throw new Error('Received invalid JSON from server.');
      }

      if (!response.ok || result.status === 'error') {
        throw new Error(result.message || (response.status === 500 ? 'Internal Server Error.' : `Server error: ${response.status}`));
      }

      if (result.status === 'multiple_choices') {
        onSubmitMultipleChoices(result, proteinStructure);
      } else if (result.status === 'success') {
        onSubmitSuccess(result);
      } else {
        throw new Error('Unknown status received from the server.');
      }

    } catch (err: any) {
      console.error('Submission failed:', err);
      if (onLoadingError) onLoadingError(err);
      setError(err.message);
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

  // STYLES 
  const formStyle = { display: 'flex', flexDirection: 'column' as const, gap: '2rem' };
  const sectionStyle = { display: 'flex', flexDirection: 'column' as const, gap: '1rem' };
  const labelStyle = { fontSize: '20px', fontWeight: 700, lineHeight: 1.2, color: '#111827' };
  const textareaStyle = {
    width: '100%', minHeight: '160px', padding: '14px 16px', borderRadius: '8px',
    border: '1px solid #8f96a3', boxSizing: 'border-box' as const, fontFamily: 'inherit',
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
  const errorStyle = {
    color: '#dc2626', fontSize: '14px', fontWeight: 600, lineHeight: 1.35, backgroundColor: '#ffeded',
    border: '1px solid #feaaaa', borderRadius: '8px', padding: '10px 12px',
  };
  const warningStyle = {
    color: '#b45309', fontSize: '14px', fontWeight: 600, lineHeight: 1.35, backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px 12px', marginBottom: '-1rem'
  };

  return (
    <form style={formStyle} onSubmit={handleSubmit}>
      <section style={sectionStyle}>
        <div style={labelStyle}>Enter 4-character PDB ID, Accession ID, AlphaFold ID or Sequence:</div>
        <textarea
          style={textareaStyle}
          value={proteinStructure}
          onChange={handleProteinStructureChange}
          placeholder=""
          disabled={isLoading}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={helperStyle}>or upload a pdb / mmCIF / FASTA file</div>
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
                  style={{ color: '#dd0000', textDecoration: 'underline', fontSize: '13px', cursor: 'pointer', }}
                >
                  Remove file
                </a>)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- CONDITIONAL WARNINGS --- */}
      {(hasTextQuery && hasFileQuery) && (
        <div style={warningStyle}>Please enter protein structure through only one source: either the text area or a file upload.</div>
      )}

      {hasFileQuery && !hasAllowedFileExtension && (
        <div style={warningStyle}>Only .pdb, .cif, or .fasta files are permitted.</div>
      )}

      {error && <div style={errorStyle}>{error}</div>}
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', alignItems: 'center', justifyContent: 'center' }}>
        <button
          type="submit"
          className="btn-submit"
          disabled={isLoading || isEmpty}
          title={isLoading ? 'Please wait while the request is processing.' : readinessTooltip}
        >
          {isLoading ? 'Processing...' : 'Continue'}
        </button>
      </div>
    </form>
  );
};

export default InputView;