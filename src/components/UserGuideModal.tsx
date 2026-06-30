import { FC, MouseEvent } from 'react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Prevent clicks inside the modal content from closing the modal
  const handleContentClick = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={handleContentClick}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close guide">×</button>
        
        <h2>Tandem Repeat Visualizer User Guide</h2>
        <p>Welcome! This version of the visualizer exclusively utilizes the <strong>TAPO</strong> algorithm for tandem repeat detection.</p>
        
        <h3>1. Input and Selection</h3>
        <ul>
          <li><strong>Search or Upload:</strong> Enter a 4-character PDB ID, Accession ID, AlphaFold ID, or an amino acid sequence. Alternatively, you can upload a valid PDB, CIF, or FASTA file.</li>
          <li><strong>Refine Selection:</strong> If multiple chains or structural models are found, you will be prompted to select a specific one for analysis.</li>
          <li><strong>Analyze:</strong> Click "Analyze Selection" and wait for the detector to process the structure.</li>
        </ul>

        <h3>2. 3D Structure Viewer (Top Left)</h3>
        <ul>
          <li><strong>Controls:</strong> Rotate the model by dragging with your left mouse button. Zoom in and out using the scroll wheel.</li>
          <li><strong>Camera Tools:</strong> Use the <strong>Spin</strong>, <strong>Rock</strong>, and <strong>Reset View</strong> buttons in the upper right panel to easily manipulate the camera and restore default colors.</li>
          <li><strong>Residue Details:</strong> Click on a specific residue to reveal nearby atoms, ligands, and local non-covalent interactions. Click it again to hide them.</li>
        </ul>

        <h3>3. Sequence Feature Viewer (Bottom)</h3>
        <ul>
          <li><strong>Zoom In:</strong> Drag with the left mouse button over a specific region (start to end position) to zoom in up to 30 residues. <em>Note: Long sequences may only become fully visible once zoomed in.</em></li>
          <li><strong>Zoom Out:</strong> Right-click anywhere on the sequence to zoom out.</li>
          <li><strong>Details:</strong> Hover over any feature or repeat unit to see its description and exact start-end positions.</li>
          <li><strong>Sync with 3D:</strong> Click on a repeat unit to highlight and focus on it in both the sequence and the 3D viewer. To focus on a different unit, right-click to zoom out and select another one. You can always use the "Reset View" button to clear all selections.</li>
          <li>Some features will not be available depending on the input structure.</li>
        </ul>

        <h3>4. Additional Information (Top Right)</h3>
        <p>Access metadata such as the protein name, family, recent publications, and ID mappings. Clicking any of these links will open the corresponding database repository in a new browser tab.</p>
      </div>
    </div>
  );
};