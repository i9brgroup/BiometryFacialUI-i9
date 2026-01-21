const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_PATH = path.join(__dirname, 'public', 'assets', 'dados.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'assets', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = req.params.id;
    // preserve extension
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${id}${ext}`);
  }
});
const upload = multer({ storage });

function readData() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}
function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// GET /api/funcionarios/:term -> find by id or badge
app.get('/api/funcionarios/:term', (req, res) => {
  const term = req.params.term;
  try {
    const data = readData();
    const emp = data.employees.find(e => e.id === term || e.badge === term);
    if (!emp) return res.status(404).json({ status: 404, message: 'Usuário não encontrado' });
    return res.json({ employee: emp });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 500, message: 'Erro interno' });
  }
});

// PUT /api/funcionarios/:id/biometria -> accept file 'file'
app.put('/api/funcionarios/:id/biometria', upload.single('file'), (req, res) => {
  const id = req.params.id;
  try {
    const data = readData();
    const idx = data.employees.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ status: 404, message: 'Usuário não encontrado' });
    const filename = req.file ? `/assets/uploads/${req.file.filename}` : null;
    const now = new Date().toISOString();
    const updated = Object.assign({}, data.employees[idx]);
    updated.tem_biometria = true;
    if (filename) updated.photoUrl = filename;
    updated.biometry = updated.biometry || {};
    updated.biometry.type = 'face';
    updated.biometry.version = 'mock-1.0';
    updated.biometry.capturedAt = now;
    updated.updatedAt = now;

    data.employees[idx] = updated;
    writeData(data);

    return res.json({ employee: updated, message: 'Biometria atualizada (mock)' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 500, message: 'Erro ao salvar biometria' });
  }
});

const port = process.env.MOCK_PORT || 3000;
app.listen(port, () => console.log(`Mock server listening on http://localhost:${port}`));

