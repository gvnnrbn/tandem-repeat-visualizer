import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import { PDBeMolstarPlugin } from 'pdbe-molstar/lib';

declare const FeatureViewer: any;

interface StructureViewProps {
  pdbData: string;
  chainId?: string;
  repeats: any[];
  onGoHome: () => void;
}

const StructureView: React.FC<StructureViewProps> = ({
  pdbData,
  chainId,
  repeats,
  onGoHome,
}) => {
  const molstarRef = useRef<HTMLDivElement>(null);
  const fvRef = useRef<HTMLDivElement>(null);
  
  const [pfamData, setPfamData] = useState<any>(null);
  const [siftsData, setSiftsData] = useState<any>(null);
  const [coverageData, setCoverageData] = useState<any>(null);

  const hardcodedPdbId = "2zzk";

  // Effect 1: Molstar 3D rendering from local PDB string
  useEffect(() => {
  //   console.log("Initializing Molstar with PDB data:", pdbData);
  //   console.log("Initializing Molstar with CHAN ID data:", chainId);
  //   console.log("Initializing Molstar with REPEATS ID data:", repeats.length);
    if (!molstarRef.current || !pdbData) return;

    let blobUrl = "";

    const initMolstar = async () => {
      const blob = new Blob([pdbData], { type: 'text/plain' });
      blobUrl = URL.createObjectURL(blob);

      const viewer = new PDBeMolstarPlugin();
      if (molstarRef.current) {
        await viewer.render(molstarRef.current, {
          customData: {
            url: blobUrl,
            format: 'pdb'
          },
          hideControls: true,
          bgColor: { r: 255, g: 255, b: 255 }
        });
      }
    };

    initMolstar();

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [pdbData]);

  // // Effect 2: External repository fetching (Pfam, SIFTS, Coverage)
  // useEffect(() => {
  //   const fetchExternalData = async () => {
  //     try {
  //       const pfamRes = await fetch(`https://www.ebi.ac.uk/pdbe/api/v2/mappings/pfam/${hardcodedPdbId}`);
  //       const pfamJson = await pfamRes.json();
  //       setPfamData(pfamJson[hardcodedPdbId]);

  //       const siftsRes = await fetch(`https://www.ebi.ac.uk/pdbe/api/v2/mappings/isoforms/${hardcodedPdbId}`);
  //       const siftsJson = await siftsRes.json();
  //       setSiftsData(siftsJson[hardcodedPdbId]);

  //       const coverageRes = await fetch(`https://www.ebi.ac.uk/pdbe/api/v2/pdb/entry/polymer_coverage/${hardcodedPdbId}/chain/${chainId}`);
  //       const coverageJson = await coverageRes.json();
  //       setCoverageData(coverageJson[hardcodedPdbId]);
  //     } catch (error) {
  //       console.error("Error fetching external repositories:", error);
  //     }
  //   };

  //   fetchExternalData();
  // }, []);

  // // Effect 3: Amino acid sequence rendering via FeatureViewer
  // useEffect(() => {
  //   if (!fvRef.current) return;
  //   fvRef.current.innerHTML = "";

  //   const fv = new FeatureViewer(
  //     `${hardcodedPdbId.toUpperCase()}_A`,
  //     fvRef.current,
  //     {
  //       showAxis: true,
  //       showSequence: true,
  //       brushActive: true
  //     }
  //   );

  //   // Render tandem repeats tracks
  //   repeats.forEach((repeat, index) => {
  //     fv.addFeature({
  //       data: [{ start: repeat.start, end: repeat.end }],
  //       name: repeat.desc || `Repeat Unit ${index + 1}`,
  //       className: `repeat-track-${index}`,
  //       color: repeat.hex
  //     });
  //   });

  //   // Additional tracks can safely utilize pfamData, siftsData, or coverageData here
  // }, [repeats, pfamData, siftsData, coverageData]);

  const ftRef = useRef<HTMLDivElement>(null);
  const pluginInstance = useRef<any>(null);
  const testpdbid = '2zzk'; // TODO: dynamic props
  
  // --- REACT STATE: THE SINGLE SOURCE OF TRUTH ---
  const [selectedRepeat, setSelectedRepeat] = useState<number | null>(null);
  const [status, setStatus] = useState("Initializing viewers...");
  const [pfamFeatures, setPfamFeatures] = useState<any[]>([]);
  const [coverageFeatures, setCoverageFeatures] = useState<any[]>([]);
  const [proteinInfo, setProteinInfo] = useState({ uniprotId: '', name: '' });
  const [proteinFamilies, setProteinFamilies] = useState<string[]>([]);

  
    // =================================================================
  // EFFECT: PFAM MAPPINGS REQUEST
  // =================================================================
  useEffect(() => {
    const fetchPfam = async () => {
      try {
        const pdbId = testpdbid; 
        const chainId = 'A';  
        const response = await fetch(`https://www.ebi.ac.uk/pdbe/api/v2/mappings/pfam/${pdbId}`);
        const json = await response.json();

        const pfamData = json[pdbId].Pfam;
        const features: any[] = [];
        const uniqueFamilies = new Set<string>(); // Usamos Set para evitar familias duplicadas
        for (const id in pfamData) {
          const domain = pfamData[id];
          // Filtrado estricto por Cadena
          const validMappings = domain.mappings.filter((m: any) => m.chain_id === chainId);

          if (validMappings.length > 0) {
            // Si la cadena tiene este dominio, agregamos su descripción general a las familias
            uniqueFamilies.add(domain.description);

            // Mapeamos cada aparición individual para el FeatureViewer
            validMappings.forEach((m: any) => {
              features.push({
                x: m.start.residue_number,
                y: m.end.residue_number,
                description: `${id}: ${domain.name}`,
              });
            });
          }
        }
        
        setPfamFeatures(features);
        setProteinFamilies(Array.from(uniqueFamilies)); // Guardamos en el estado

      } catch (error) {
        console.error("Error cargando Pfam:", error);
      }
    };
    fetchPfam();
  }, []);

  // =================================================================
  // EFFECT: FETCH SIFTS (UniProt) + POLYMER COVERAGE (PDB) TO SHOW IN FEATURE VIEWER
  // =================================================================
  useEffect(() => {
    const fetchData = async () => {
      const pdbId = testpdbid;
      const chainId = 'A';

      try {
        const siftsRes = await fetch(`https://www.ebi.ac.uk/pdbe/api/v2/mappings/isoforms/${pdbId}`);
        const siftsJson = await siftsRes.json();
        const uniprotData = siftsJson[pdbId].UniProt;

        for (const unpId in uniprotData) {
          const hasChainA = uniprotData[unpId].mappings.some((m: any) => m.chain_id === chainId);
          if (hasChainA) {
            setProteinInfo({ 
              uniprotId: unpId, 
              name: uniprotData[unpId].name 
            });
            break;
          }
        }

        const covRes = await fetch(`https://www.ebi.ac.uk/pdbe/api/v2/pdb/entry/polymer_coverage/${pdbId}/chain/${chainId}`);
        const covJson = await covRes.json();
        
        const observed = covJson[pdbId].molecules[0].chains[0].observed;
        const covMapped = observed.map((obs: any) => ({
          x: obs.start.residue_number,
          y: obs.end.residue_number,
          description: `Author numbering: ${obs.start.author_residue_number}-${obs.end.author_residue_number}`,
          color: "#2ecc71"
        }));
        setCoverageFeatures(covMapped);

      } catch (e) {
        console.error("Error fetching metadata:", e);
      }
    };
    fetchData();
  }, []);

  // =================================================================
  // EFFECT: UPDATE MOL* COLORS WHEN STATE CHANGES
  // =================================================================
  useEffect(() => {
    if (!pluginInstance.current) return;

    const colorData = repeats.map(rep => ({
      start_residue_number: rep.start,
      end_residue_number: rep.end,
      struct_asym_id: 'A',
      color: rep.rgb,
      focus: selectedRepeat === rep.start 
    }));

    pluginInstance.current.visual.select({
      data: colorData,
      nonSelectedColor: { r: 240, g: 240, b: 240 }
    });
  }, [selectedRepeat]);

  // =================================================================
  // EFFECT 3: CONTROL FEATURE VIEWER VIA REACT STATE
  // =================================================================
  useEffect(() => {
    if (typeof FeatureViewer === 'undefined' || !ftRef.current) return;

    ftRef.current.innerHTML = '';

    const sequence = "A".repeat(695);
    var options = {
      showAxis: true, showSequence: true,
      brushActive: true, toolbar:true, 
      bubbleHelp: true, zoomMax:30 
    };
    const ft = new FeatureViewer(sequence, "#fv-container", options);

    if (coverageFeatures.length > 0) {
      ft.addFeature({
        data: coverageFeatures,
        name: "PDB Coverage",
        className: "pdb-coverage",
        description: "Polymer coverage (PDB)",
        type: "rect",
        height: 18,
      });
    }

    ft.addFeature({
      data: repeats.map(rep => {
        const isSelected = selectedRepeat === rep.start;
        const isAnySelected = selectedRepeat !== null;
        
        return {
          x: rep.start,
          y: rep.end,
          description: rep.desc,
          color: (isAnySelected && !isSelected) ? "#cccccc" : rep.hex
        };
      }),
      name: "TAPO Repeats",
      className: "tapo-repeats",
      type: "rect",
      height: 32 
    });

    if (pfamFeatures.length > 0) {
      ft.addFeature({
        data: pfamFeatures.map(f => ({
          ...f,
          color: "#4A90E2"
        })),
        name: "Pfam Domains",
        className: "pfam-domains",
        type: "rect",
        height: 18
      });
    }

    let zoomTimeout: any;
    if (selectedRepeat !== null) {
      const target = repeats.find(r => r.start === selectedRepeat);
      if (target) {
        zoomTimeout = setTimeout(() => ft.zoom(target.start, target.end), 50);
      }
    }

    ft.onFeatureSelected((event: any) => {
      const { start, end } = event.detail;
      setStatus(`Sequence Click: ${start} - ${end}. Focusing 3D...`);
      setSelectedRepeat(start);
    });

    return () => clearTimeout(zoomTimeout);

  }, [selectedRepeat, pfamFeatures, coverageFeatures]);

  return (<>
    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
      <button 
        onClick={onGoHome}
        style={{ padding: '8px 16px', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#fff' }}
      >
        Back
      </button>
    </div>
    <div style={{display:'flex', flexDirection:'column', overflowY:'scroll'}}>
    <div style={{display: 'flex', flexDirection: 'row', gap: '10px', width: '100%', height: '50vh', fontFamily: 'sans-serif',}}>
      
      <style>{`
        #fv-container svg text {
          font-size: 14px !important; 
          font-family: monospace;
        }
      `}</style>
      
      <div style={{ height: '100%', border: '1px solid #ccc', borderRadius: '8px', flex: '0 0 60%' }}>
        <div ref={molstarRef} style={{ height: '100%', position: 'relative' }} />
      </div>

      <div style={{ border: '1px solid #ccc', padding: '20px 10px', height: '100%', borderRadius: '8px', background: 'white',flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'flex-start', alignItems: 'center'
       }}>
        <div style={{ width: '100%' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h3 style={{ marginBottom: '5px' }}>
              Structure: {proteinInfo.name || 'Loading...'}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: 0 }}>
              PDB: <strong>{testpdbid}</strong> | 
              UniProt: <a href={`https://www.uniprot.org/uniprotkb/${proteinInfo.uniprotId}`} target="_blank">
                {proteinInfo.uniprotId}
              </a>
            </p>

            {/* --- SECCIÓN NUEVA: TEXTO DE LA FAMILIA --- */}
            {proteinFamilies.length > 0 && (
              <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#f0f4f8', borderRadius: '6px', border: '1px solid #d9e2ec' }}>
                <strong style={{ fontSize: '0.85rem', color: '#334e68', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Protein Family / Domains</strong>
                <p style={{ fontSize: '0.95rem', color: '#102a43', margin: '5px 0 0 0', fontWeight: 500 }}>
                  {proteinFamilies.join(' | ')}
                </p>
              </div>
            )}
            
          </div>
        </div>
        <button style={{ width: '80%', padding: '8px', cursor: 'pointer' }}>action1</button>
        <button style={{ width: '80%', padding: '8px', cursor: 'pointer' }}>action1</button>
        <button style={{ width: '80%', padding: '8px', cursor: 'pointer' }}>action1</button>
      </div>
    </div>
    <div style={{ border: '1px solid #ccc', padding: '0px 10px', height: '100%', borderRadius: '8px', background: 'white',flex: 1, overflowY: 'auto' }}>
      <h3 style={{ margin: 0 }}>Amino Acid Sequence ({testpdbid}_A)</h3>
      <div id="fv-container" ref={ftRef} />
    </div>
    </div>
  </>);
};

export default StructureView;