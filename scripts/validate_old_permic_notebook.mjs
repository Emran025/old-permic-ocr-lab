import fs from 'node:fs';

const notebookPath = 'training/notebooks/old_permic_yolo_training.ipynb';
const notebook = JSON.parse(fs.readFileSync(notebookPath, 'utf8'));

if (notebook.nbformat !== 4) {
  throw new Error(`Unexpected notebook format: ${notebook.nbformat}`);
}

if (!Array.isArray(notebook.cells) || notebook.cells.length < 10) {
  throw new Error(`Unexpected notebook cell count: ${notebook.cells?.length ?? 'missing'}`);
}

const hasOldPermicLabel = notebook.cells.some((cell) =>
  Array.isArray(cell.source) && cell.source.join('').includes('البرمية القديمة'),
);

const hasGurmukhiProjectName = notebook.cells.some((cell) =>
  Array.isArray(cell.source) && cell.source.join('').includes('Gurmukhi_YOLO_Project'),
);

if (!hasOldPermicLabel || hasGurmukhiProjectName) {
  throw new Error('Notebook did not complete the intended script adaptation.');
}

console.log(`Notebook cells: ${notebook.cells.length}`);
console.log(`Notebook format: ${notebook.nbformat}`);
console.log('Notebook validation: passed');
