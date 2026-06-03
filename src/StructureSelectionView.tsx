import { useMemo, useState } from 'react';

export interface AlphaFoldOption {
  af_id: string;
  uniprot: string;
  length: number;
  uniProtSequence: string;
}

interface StructureSelectionViewProps {
  options: AlphaFoldOption[];
  originalQuery: string;
  onSelect: (afId: string) => void;
  onGoBack: () => void;
}

const StructureSelectionView: React.FC<StructureSelectionViewProps> = ({
  options,
  originalQuery,
  onSelect,
  onGoBack,
}) => {
  const [selectedId, setSelectedId] = useState<string>('');
  // options =  [
  //       {
  //           "af_id": "AF-Q5VSL9-F1",
  //           "uniprot": "Q5VSL9",
  //           "length": 837,
  //           "uniProtSequence": "MEPAVGGPGPLIVNNKQPQPPPPPPPAAAQPPPGAPRAAAGLLPGGKAREFNRNQRKDSEGYSESPDLEFEYADTDKWAAELSELYSYTEGPEFLMNRKCFEEDFRIHVTDKKWTELDTNQHRTHAMRLLDGLEVTAREKRLKVARAILYVAQGTFGECSSEAEVQSWMRYNIFLLLEVGTFNALVELLNMEIDNSAACSSAVRKPAISLADSTDLRVLLNIMYLIVETVHQECEGDKAEWRTMRQTFRAELGSPLYNNEPFAIMLFGMVTKFCSGHAPHFPMKKVLLLLWKTVLCTLGGFEELQSMKAEKRSILGLPPLPEDSIKVIRNMRAASPPASASDLIEQQQKRGRREHKALIKQDNLDAFNERDPYKADDSREEEEENDDDNSLEGETFPLERDEVMPPPLQHPQTDRLTCPKGLPWAPKVREKDIEMFLESSRSKFIGYTLGSDTNTVVGLPRPIHESIKTLKQHKYTSIAEVQAQMEEEYLRSPLSGGEEEVEQVPAETLYQGLLPSLPQYMIALLKILLAAAPTSKAKTDSINILADVLPEEMPTTVLQSMKLGVDVNRHKEVIVKAISAVLLLLLKHFKLNHVYQFEYMAQHLVFANCIPLILKFFNQNIMSYITAKNSISVLDYPHCVVHELPELTAESLEAGDSNQFCWRNLFSCINLLRILNKLTKWKHSRTMMLVVFKSAPILKRALKVKQAMMQLYVLKLLKVQTKYLGRQWRKSNMKTMSAIYQKVRHRLNDDWAYGNDLDARPWDFQAEECALRANIERFNARRYDRAHSNPDFLPVDNCLQSVLGQRVDLPEDFQMNYDLWLEREVFSKPISWEELLQ"
  //       },
  //       {
  //           "af_id": "AF-Q5VSL9-4-F1",
  //           "uniprot": "Q5VSL9-4",
  //           "length": 212,
  //           "uniProtSequence": "MEPAVGGPGPLIVNNKQPQPPPPPPPAAAQPPPGAPRAAAGLLPGGKAREFNRNQRKDSEGYSESPDLEFEYADTDKWAAELSELYSYTEGPEFLMNRKCFEEDFRIHVTDKKWTELDTNQHRTHAMRLLDGLEVTAREKRLKVARAILYVAQGTFGECSSEAEVQSWMRYNIFLLLEVGTFNALVELLNMEIEHCCVRPAVSALAGGQAQD"
  //       },
  //       {
  //           "af_id": "AF-Q5VSL9-3-F1",
  //           "uniprot": "Q5VSL9-3",
  //           "length": 440,
  //           "uniProtSequence": "MLFGMVTKFCSGHAPHFPMKKVLLLLWKTVLCTLGGFEELQSMKAEKRSILGLPPLPEDSIKVIRNMRAASPPASASDLIEQQQKRGRREHKALIKQDNLDAFNERDPYKADDSREEEEENDDDNSLEGETFPLERDEVMPPPLQHPQTDRLTCPKGLPWAPKVREKDIEMFLESSRSKFIGYTLGSDTNTVVGLPRPIHESIKTLKQHKYTSIAEVQAQMEEEYLRSPLSGGEEEVEQVPAETLYQGLLPSLPQYMIALLKILLAAAPTSKAKTDSINILADVLPEEMPTTVLQSMKLGVDVNRHKEVIVKAISAVLLLLLKHFKLNHVYQVPTGLSLLSCGLGPRALLLLQPTRTGALAFDPLELCMNVLRHGPSAKAFHPWRKEGKVPRAAPFFFFFFSCWLQFEYMAQHLVFANCIPLILKFFNQNIMSYITAKNR"
  //       },
  //       {
  //           "af_id": "AF-Q5VSL9-2-F1",
  //           "uniprot": "Q5VSL9-2",
  //           "length": 742,
  //           "uniProtSequence": "MNRKCFEEDFRIHVTDKKWTELDTNQHRTHAMRLLDGLEVTAREKRLKVARAILYVAQGTFGECSSEAEVQSWMRYNIFLLLEVGTFNALVELLNMEIDNSAACSSAVRKPAISLADSTDLRVLLNIMYLIVETVHQECEGDKAEWRTMRQTFRAELGSPLYNNEPFAIMLFGMVTKFCSGHAPHFPMKKVLLLLWKTVLCTLGGFEELQSMKAEKRSILGLPPLPEDSIKVIRNMRAASPPASASDLIEQQQKRGRREHKALIKQDNLDAFNERDPYKADDSREEEEENDDDNSLEGETFPLERDEVMPPPLQHPQTDRLTCPKGLPWAPKVREKDIEMFLESSRSKFIGYTLGSDTNTVVGLPRPIHESIKTLKQHKYTSIAEVQAQMEEEYLRSPLSGGEEEVEQVPAETLYQGLLPSLPQYMIALLKILLAAAPTSKAKTDSINILADVLPEEMPTTVLQSMKLGVDVNRHKEVIVKAISAVLLLLLKHFKLNHVYQFEYMAQHLVFANCIPLILKFFNQNIMSYITAKNSISVLDYPHCVVHELPELTAESLEAGDSNQFCWRNLFSCINLLRILNKLTKWKHSRTMMLVVFKSAPILKRALKVKQAMMQLYVLKLLKVQTKYLGRQWRKSNMKTMSAIYQKVRHRLNDDWAYGNDLDARPWDFQAEECALRANIERFNARRYDRAHSNPDFLPVDNCLQSVLGQRVDLPEDFQMNYDLWLEREVFSKPISWEELLQ"
  //       }
  //   ]
  const selectedOption = useMemo(
    () => options.find((option) => option.af_id === selectedId) ?? null,
    [options, selectedId]
  );

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%',
    height: '100%',
    minHeight: '0',
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  };

  const subtitleStyle = {
    fontSize: '18px',
    color: '#374151',
    margin: 0,
  };

  const topBarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '16px',
    flexShrink: 0,
  };

  const backButtonStyle = {
    alignSelf: 'flex-start',
    padding: '8px 18px',
    backgroundColor: '#d7e2f7',
    border: '1px solid #5c6f99',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 600,
    color: '#111827',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 3px rgba(0,0,0,0.12)',
  };

  const scrollAreaStyle = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto' as const,
    paddingRight: '6px',
    maxHeight: '70vh'
  };

  const listStyle = {
    display: 'grid',
    gap: '14px',
  };

  const cardStyle = {
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    padding: '16px 18px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
  };

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '42px 170px 1fr',
    gap: '18px',
    alignItems: 'start',
  };

  const fieldNamesStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    fontSize: '16px',
    fontWeight: 700,
    color: '#111827',
    textAlign: 'right',
  };

  const fieldValuesStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    fontSize: '16px',
    color: '#111827',
    overflowWrap: 'anywhere' as const,
  };

  const footerStyle = {
    paddingTop: '16px',
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'center',
  };

  const selectButtonStyle = {
    padding: '8px 24px',
    background: 'linear-gradient(180deg, #b7c8f3 0%, #9eb7ea 100%)',
    border: '1px solid #5c6f99',
    borderRadius: '8px',
    cursor: selectedOption ? 'pointer' : 'not-allowed',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    color: '#111827',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), 0 2px 3px rgba(0,0,0,0.15)',
    opacity: selectedOption ? 1 : 0.65,
    minWidth: '120px',
  };

  return (
    <div style={containerStyle}>
      <div style={topBarStyle}>
        <button type="button" style={backButtonStyle} onClick={onGoBack}>
          Home
        </button>
      </div>

      <div style={{ marginBottom: '14px', flexShrink: 0 }}>
        <h2 style={titleStyle}>Multiple structural models found for {originalQuery} in PDB DB, please select one:</h2>
        <p style={subtitleStyle} />
      </div>

      <div style={scrollAreaStyle}>
        <div style={listStyle}>
        {options?.map((option) => (
          <div key={option.af_id} style={cardStyle}>
            <div style={rowStyle}>
              <label style={{ display: 'flex', alignItems: 'start', justifyContent: 'center', paddingTop: '3px' }}>
                <input
                  type="radio"
                  name="structure-choice"
                  checked={selectedId === option.af_id}
                  onChange={() => setSelectedId(option.af_id)}
                  style={{ transform: 'scale(1.3)' }}
                />
              </label>

              <div style={fieldNamesStyle}>
                <div>AlphaFold ID:</div>
                <div>Accession ID:</div>
                <div>Protein Length:</div>
                <div>Sequence:</div>
              </div>

              <div style={fieldValuesStyle}>
                <div>{option.af_id}</div>
                <div>{option.uniprot}</div>
                <div>{option.length}</div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.35 }}>{option.uniProtSequence}</div>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>

      <div style={footerStyle}>
        <button
          type="button"
          style={selectButtonStyle}
          disabled={!selectedOption}
          title={selectedOption ? 'Submit selected model' : 'Select one model to enable submit'}
          onClick={() => selectedOption && onSelect(selectedOption.af_id)}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default StructureSelectionView;