import React, { ChangeEvent, FormEvent, useRef, useState } from 'react';

interface InputViewProps {
  onSubmitMock: () => void;
}

const InputView: React.FC<InputViewProps> = ({ onSubmitMock }) => {
  const [proteinStructure, setProteinStructure] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chainMode, setChainMode] = useState<'all' | 'single'>('all');
  const [chainId, setChainId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmitMock();
  };

  const handleProteinStructureChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setProteinStructure(e.target.value);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleChainIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setChainId(e.target.value.toUpperCase());
  };

  const handleChainModeChange = (mode: 'all' | 'single') => {
    setChainMode(mode);
    if (mode === 'all') {
      setChainId('');
    }
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '28px',
  };

  const sectionStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  };

  const labelStyle = {
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: 1.2,
    color: '#111827',
  };

  const textareaStyle = {
    width: '100%',
    minHeight: '160px',
    padding: '14px 16px',
    borderRadius: '8px',
    border: '1px solid #8f96a3',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
    fontSize: '18px',
    resize: 'vertical' as const,
    outline: 'none',
    backgroundColor: '#fff',
  };

  const helperStyle = {
    fontSize: '22px',
    fontWeight: 700,
    color: '#111827',
  };

  const uploadButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'fit-content',
    minWidth: '108px',
    padding: '8px 18px',
    borderRadius: '8px',
    border: '1px solid #5c6f99',
    background: 'linear-gradient(180deg, #b7c8f3 0%, #9eb7ea 100%)',
    color: '#111827',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), 0 2px 3px rgba(0,0,0,0.15)',
  };

  const radioGroupStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  };

  const radioRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
  };

  const shortInputStyle = {
    width: '76px',
    height: '38px',
    padding: '0 12px',
    borderRadius: '8px',
    border: '1px solid #8f96a3',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
    fontSize: '18px',
    textTransform: 'uppercase' as const,
    backgroundColor: chainMode === 'single' ? '#fff' : '#f3f4f6',
    color: '#111827',
  };

  const submitButtonStyle = {
    padding: '8px 20px',
    background: 'linear-gradient(180deg, #b7c8f3 0%, #9eb7ea 100%)',
    border: '1px solid #5c6f99',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '17px',
    alignSelf: 'center' as const,
    fontWeight: 'bold' as const,
    minWidth: '104px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), 0 2px 3px rgba(0,0,0,0.15)',
  };

  return (
    <form style={formStyle} onSubmit={handleSubmit}>
      <section style={sectionStyle}>
        <div style={labelStyle}>1. Enter 4-character PDB ID, Accession ID, AlphaFold ID or Sequence:</div>
        <textarea
          style={textareaStyle}
          value={proteinStructure}
          onChange={handleProteinStructureChange}
          placeholder="Q5VSL9"
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={helperStyle}>or upload a pdb/mmCIF/FASTA file</div>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept=".pdb,.cif,.fasta,.fa"
          />
          <button
            type="button"
            style={uploadButtonStyle}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload
          </button>
          {selectedFile && <span style={{ fontSize: '12px' }}>Selected: {selectedFile.name}</span>}
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={labelStyle}>2. Select chain(s) to be searched:</div>
        <div style={radioGroupStyle}>
          <label style={radioRowStyle}>
            <input
              type="radio"
              name="chain-mode"
              checked={chainMode === 'all'}
              onChange={() => handleChainModeChange('all')}
              style={{ transform: 'scale(1.35)' }}
            />
            <span>All chains</span>
          </label>
          <label style={radioRowStyle}>
            <input
              type="radio"
              name="chain-mode"
              checked={chainMode === 'single'}
              onChange={() => handleChainModeChange('single')}
              style={{ transform: 'scale(1.35)' }}
            />
            <span>Single chain ID:</span>
            <input
              type="text"
              style={shortInputStyle}
              value={chainId}
              onChange={handleChainIdChange}
              maxLength={1}
              disabled={chainMode !== 'single'}
              aria-label="Single chain ID"
            />
          </label>
        </div>
      </section>

      <button type="submit" style={submitButtonStyle}>Submit</button>
    </form>
  );
};

export default InputView;