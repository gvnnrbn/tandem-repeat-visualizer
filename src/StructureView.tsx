import React, { useEffect, useRef, useState } from 'react';
import './App.css';
// @ts-ignore
import { PDBeMolstarPlugin } from 'pdbe-molstar/lib';

import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { AnimateCameraSpin } from 'molstar/lib/mol-plugin-state/animation/built-in/camera-spin';
import { AnimateCameraRock } from 'molstar/lib/mol-plugin-state/animation/built-in/camera-rock';

declare const FeatureViewer: any;

interface StructureViewProps {
  proteinId: string;
  proteinIdType: string;
  length: number;
  pdbStructure: string;
  chainId?: string;
  repeats: any[];
  sequence: string;
}

const StructureView: React.FC<StructureViewProps> = ({
  proteinId,
  proteinIdType,
  length,
  pdbStructure,
  chainId,
  repeats,
  sequence,
}) => {
  const molstarRef = useRef<HTMLDivElement>(null);
  const ftRef = useRef<HTMLDivElement>(null);
  const pluginInstance = useRef<any>(null);
  const [selectedRepeat, setSelectedRepeat] = useState<number | null>(null);
  const [pfamFeatures, setPfamFeatures] = useState<any[]>([]);
  const [coverageFeatures, setCoverageFeatures] = useState<any[]>([]);
  const [uniprotInfo, setUniprotInfo] = useState({ uniprotId: '', name: '' });
  const [pdbInfo, setPdbInfo] = useState<string[]>([]);
  const [proteinFamilies, setProteinFamilies] = useState<string[]>([]);
  const [publications, setPublications] = useState<{ year: number, journal: string, pubmed_id: string }[]>([]);
  const [viewerReady, setViewerReady] = useState(false);
  const [isRocking, setIsRocking] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Toggle Rock animation button
  const toggleRock = () => {
    const molstar = pluginInstance.current?.plugin; // Access native Molstar API
    if (!molstar) return;

    if (isRocking) {
      molstar.managers.animation.stop();
      setIsRocking(false);
    } else {
      // Stop spin if it's currently running to prevent conflicts
      if (isSpinning) {
        molstar.managers.animation.stop();
        setIsSpinning(false);
      }
      molstar.managers.animation.play(AnimateCameraRock, {});
      setIsRocking(true);
    }
  };

  // Toggle Spin Animation button
  const toggleSpin = () => {
    const molstar = pluginInstance.current?.plugin; 
    if (!molstar) return;

    if (isSpinning) {
      molstar.managers.animation.stop();
      setIsSpinning(false);
    } else {
      // Stop rock if it's currently running
      if (isRocking) {
        molstar.managers.animation.stop();
        setIsRocking(false);
      }
      molstar.managers.animation.play(AnimateCameraSpin, {});
      setIsSpinning(true);
    }
  };

  // Reset camera button
  
  const resetView = () => {
    // Trigger the recoloring of repeats
    setSelectedRepeat(null);

    // reset zoom, center and clipping planes
    if (pluginInstance.current) {
      const molstar = pluginInstance.current.plugin;

      // 1. Stop any ongoing animations
      molstar.managers.animation.stop();
      setIsRocking(false);
      setIsSpinning(false);

      // 2. PDBe wrapper API to reset zoom, center, and clipping planes
      pluginInstance.current.visual.reset({ camera: true });

      // 3. Orient Axes: Reorient the camera to a standard state using native commands
      PluginCommands.Camera.Reset(molstar, {});
    }
  };

  // =================================================================
  // EFFECT 1: Molstar 3D rendering from PDB file string
  // =================================================================
  useEffect(() => {
    if (!molstarRef.current || pluginInstance.current || !pdbStructure) return;
    
    const initMolstar = async () => {
      const viewer = new PDBeMolstarPlugin();
      
      const blob = new Blob([pdbStructure], { type: 'text/plain' });
      const pdbUrl = URL.createObjectURL(blob);

      await viewer.render(molstarRef.current, {
        customData: {
          url: pdbUrl,
          format: 'pdb'
        },
        hideControls: true,
        hideCanvasControls: [''],
        bgColor: { r: 255, g: 255, b: 255 }
      });
      
      pluginInstance.current = viewer;
      setViewerReady(true);

    };

    initMolstar();

    const handleMolstarClick = (e: any) => {
      const eventData = e.detail;
      if (eventData && eventData.residueNumber) {
        const res = eventData.residueNumber;
        const found = repeats.find(rep => res >= rep.start && res <= rep.end);
        
        if (found) {
          setSelectedRepeat(found.start);
        }
      }
    };

    document.addEventListener('PDB.molstar.click', handleMolstarClick);

    return () => {
      document.removeEventListener('PDB.molstar.click', handleMolstarClick);
    };
  }, [pdbStructure, repeats]);

  // =================================================================
  // EFFECT 2: UPDATE MOL* COLORS WHEN STATE CHANGES (INITIAL & CLICKS)
  // =================================================================
  useEffect(() => {
    if (!pluginInstance.current || repeats.length === 0 || !viewerReady) return;

    const activeRepeats = repeats.filter(rep => 
      selectedRepeat === null || rep.start === selectedRepeat
    );

    const colorData = activeRepeats.map(rep => ({
      start_residue_number: rep.start,
      end_residue_number: rep.end,
      // struct_asym_id: 'A',
      color: rep.rgb,
      focus: selectedRepeat === rep.start 
    }));

    // Apply colors
    const applyColors = () => {
      try {
        pluginInstance.current.visual.select({
          data: colorData,
          nonSelectedColor: { r: 240, g: 240, b: 240 }
        });
      } catch (e) {
        console.warn("Molstar is not ready yet", e);
      }
    };

    // 150ms delay to try coloring default
    const timeoutId = setTimeout(applyColors, 150);

    // Avoid memory leaks
    return () => clearTimeout(timeoutId);

  }, [selectedRepeat, repeats, viewerReady]);


  
    // =================================================================
  // EFFECT: PFAM MAPPINGS REQUEST
  // =================================================================
  useEffect(() => {
    const fetchPfam = async () => {
      try {
        let response;
        if(proteinIdType === 'uniprot') {
          response = await fetch(`https://www.ebi.ac.uk/pdbe/api/v2/mappings/uniprot_to_pfam/${proteinId}`);
        }
        else {
          response  = await fetch(`https://www.ebi.ac.uk/pdbe/api/v2/mappings/pfam/${proteinId}`);
        }
        const json = await response?.json();
        
        const pfamData = json[proteinId].Pfam;
        const features: any[] = [];
        const uniqueFamilies = new Set<string>();
        for (const id in pfamData) {
          const domain = pfamData[id];
          // Filtered by chain if id from PDB
          if(proteinIdType === 'uniprot') {
             uniqueFamilies.add(domain.description);
             features.push({
              x: domain.mappings[0].unp_start,
              y: domain.mappings[0].unp_end,
              description: `${id}: ${domain.name}`,
            });
          }
          else if(proteinIdType === 'pdb') {
            const validMappings = domain.mappings.filter((m: any) => m.chain_id === chainId);
             if (validMappings.length > 0) {
               uniqueFamilies.add(domain.description);
               validMappings.forEach((m: any) => {
                 features.push({
                   x: m.start.residue_number,
                   y: m.end.residue_number,
                   description: `${id}: ${domain.name}`,
                 });
               });
             }
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
  // EFFECT: FETCH SIFTS (UniProt) + POLYMER COVERAGE (PDB) + publications
  // =================================================================
  useEffect(() => {
    const fetchData = async () => {
      const chainId = 'A';

      try {
        let siftsRes;
        let proteinData;
        if (proteinIdType === 'uniprot') {
          // All isoforms for UniProt accession
          siftsRes = await fetch(`https://www.ebi.ac.uk/pdbe/api/v2/mappings/all_isoforms/${proteinId}`);
          const siftsJson = await siftsRes.json();
          proteinData = siftsJson[proteinId].PDB;
          setPdbInfo((prev) => Array.from(new Set([...prev, ...Object.keys(proteinData)])));
          // Coverage not available
          const emptyCoverage = [{
            x: 1,
            y: length,
            description: "Coverage not available for this UniProt entry",
            color: "#bdc3c7"
          }];
          setCoverageFeatures(emptyCoverage);
          
        }
        else{
          // Isoforms for PDB id
          siftsRes = await fetch(`https://www.ebi.ac.uk/pdbe/api/v2/mappings/isoforms/${proteinId}`);
          const siftsJson = await siftsRes.json();
          proteinData = siftsJson[proteinId].UniProt;
          for (const entity in proteinData) {
            const hasChainA = proteinData[entity].mappings.some((m: any) => m.chain_id === chainId);
            if (hasChainA) {
              setUniprotInfo({ 
                uniprotId: entity, 
                name: proteinData[entity].name 
              });
              break;
            }
          }
          // Coverage for PDB id + chain
          const covRes = await fetch(`https://www.ebi.ac.uk/pdbe/api/v2/pdb/entry/polymer_coverage/${proteinId}/chain/${chainId}`);
          const covJson = await covRes.json();
          
          const observed = covJson[proteinId].molecules[0].chains[0].observed;
          const covMapped = observed.map((obs: any) => ({
            x: obs.start.residue_number,
            y: obs.end.residue_number,
            description: `Author numbering: ${obs.start.author_residue_number}-${obs.end.author_residue_number}`,
            color: "#2ecc71"
          }));
          setCoverageFeatures(covMapped);
        }

        // Publications
        const url = proteinIdType === 'pdb' 
          ? `https://www.ebi.ac.uk/pdbe/api/v2/pdb/entry/publications/${proteinId}`
          : `https://www.ebi.ac.uk/pdbe/api/v2/mappings/uniprot_publications/${proteinId}`;

        try {
          const response = await fetch(url);
          const data = await response.json();
          // Access the main data object using the provided ID
          const entry = data[proteinId]; 
          let rawList: any[] = [];

          if (proteinIdType === 'pdb') {
            // PDB entries are simple arrays
            rawList = entry || [];
          } else {
            // UniProt entries: Flatten every category containing "Articles"
            const sources = [
              entry?.primary_citation?.Articles,
              entry?.appears_without_citation?.Articles,
              entry?.cited_by?.Articles,
              entry?.uniprot_publications?.Articles
            ];
            rawList = sources.flat().filter(Boolean);
          }

          // Normalize and sort
          const processed = rawList
            .map(pub => {
              // Handle variations in field names depending on API response
              const year = parseInt(proteinIdType === 'pdb' ? pub.journal_info?.year : pub.year) || 0;
              const journal = proteinIdType === 'pdb' ? pub.journal_info?.ISO_abbreviation : pub.journal;
              return { year, journal, pubmed_id: pub.pubmed_id };
            })
            .filter(pub => pub.pubmed_id && pub.year > 0) // Keep only valid entries
            .sort((a, b) => b.year - a.year) // Newest first
            .slice(0, 3); // Take top 3

          setPublications(processed);
        } catch (error) {
          console.error("Error fetching publications:", error);
        }
      } catch (e) {
        console.error("Error fetching metadata:", e);
      }
    };
    fetchData();
  }, []);


  // =================================================================
  // EFFECT 3: CONTROL FEATURE VIEWER VIA REACT STATE
  // =================================================================
  useEffect(() => {
    if (typeof FeatureViewer === 'undefined' || !ftRef.current || !sequence) {
      return; 
    }
    ftRef.current.innerHTML = '';
    
    var options = {
      showAxis: true, showSequence: true,
      brushActive: true, toolbar:true, 
      bubbleHelp: true, zoomMax:30 
    };
    const ft = new FeatureViewer(sequence, "#fv-container", options);

    

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

    // Behavior when selecting and deselecting a feature
    ft.onFeatureSelected((event: any) => {
      const { start, end } = event.detail;
      setSelectedRepeat(start);
    });

    // ft.onFeatureDeselected(() => {
    //   console.log(`[FeatureViewer Event] Track deselected. Restoring all colors...`);
    //   setSelectedRepeat(null); // Restarting effect 2 to recolor everything
    // });

    return () => clearTimeout(zoomTimeout);

  }, [selectedRepeat, pfamFeatures, coverageFeatures,sequence]);

  

  return (<>
    <div style={{display:'flex', flexDirection:'column', gap: '10px'}}>
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
              Structure: {uniprotInfo.name || proteinId}
            </h3>
            {/* ESCENARIO 1: PDB ID */}
            {proteinIdType === 'pdb' && (
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: 0 }}>
                PDB: <strong>{proteinId}</strong> {' | '}
                UniProt: 
                <a href={`https://www.uniprot.org/uniprotkb/${uniprotInfo.uniprotId}`} target="_blank" rel="noreferrer" style={{ marginLeft: '5px' }}
                >
                  {uniprotInfo.uniprotId}
                </a>
              </p>
            )}

            {/* ESCENARIO 2: UNIPROT ID */}
            {proteinIdType === 'uniprot' && (
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: 0 }}>
                PDBs: {pdbInfo.length > 0 ? (
                  pdbInfo.map((id, index) => (
                    <React.Fragment key={id}>
                      <a href={`https://www.rcsb.org/structure/${id}`} target="_blank" rel="noreferrer">{id}</a>
                      {index < pdbInfo.length - 1 ? ', ' : ''}
                    </React.Fragment>
                  ))
                ) : ('None')}
                {' | '}
                UniProt:<strong><a href={`https://www.uniprot.org/uniprotkb/${proteinId}`} target="_blank" rel="noreferrer" style={{ marginLeft: '5px' }}>
                    {proteinId}
                  </a></strong>
              </p>
            )}

            {/* --- PFAM FAMILY --- */}
            {proteinFamilies.length > 0 && (
              <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#B3C7F7', borderRadius: '6px', border: '1px solid #d9e2ec' }}>
                <strong style={{ fontSize: '0.85rem', color: '#0550B9', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Protein Family / Domains</strong>
                <p style={{ fontSize: '0.95rem', color: '#0550B9', margin: '5px 0 0 0', fontWeight: 500 }}>
                  {proteinFamilies.join(' | ')}
                </p>
              </div>
            )}
            {/* --- PUBLICATIONS --- */}
            {publications.length > 0 && (
              <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#F2F2F7', borderRadius: '6px', border: '1px solid #d9e2ec' }}>
                <strong style={{ fontSize: '0.85rem', color: '#535353', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                  Literature Mentions
                </strong>
                <p style={{ fontSize: '0.80rem', color: '#535353', marginBottom: '8px' }}>
                  Latest 3 articles citing the primary publication (Source: Europe PMC)
                </p>
                <div style={{ fontSize: '0.80rem', color: '#535353', fontWeight: 500, marginLeft: '100px' }}>
                  {publications.map((pub) => (
                    <p key={pub.pubmed_id} style={{ margin: '2px 0', textAlign: 'left' }}>
                      • {pub.year} | Journal: {pub.journal}{' | '}
                      <a 
                        href={`https://pubmed.ncbi.nlm.nih.gov/${pub.pubmed_id}/`} 
                        target="_blank" 
                        rel="noreferrer"
                      >
                        PubMed ID: {pub.pubmed_id}
                      </a>
                    </p>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
        <div style={{display: 'flex', flexDirection:'row', gap:'1rem'}}>
          <button onClick={toggleSpin} className='camera-button'>{isSpinning ? '↻ Stop' : '↻ Spin'}</button>
          <button onClick={toggleRock}className='camera-button'>{isRocking ? '↔ Stop' : '↔ Rock'}</button>
          <button onClick={resetView} className='camera-button'>Reset View</button>
        </div>
      </div>
    </div>
    <div style={{ border: '1px solid #ccc', padding: '0px 10px', height: '100%', borderRadius: '8px', background: 'white',flex: 1, overflowY: 'auto' }}>
      <h3 style={{ margin: 0 }}>Amino Acid Sequence ({proteinId}_A)</h3>
      <div id="fv-container" ref={ftRef} />
    </div>
    </div>
  </>);
};

export default StructureView;