const { Router } = require("express");
const router = Router();
const fs = require('fs');
const path = require('path');

// Ruta para obtener todas las meseras
router.get('/AllMeseras', async (req, res) => {
  // Usar fs.readFileSync para leer el archivo de manera síncrona
  const datosPath = path.join(__dirname, '../datos.json');
  const datos = JSON.parse(fs.readFileSync(datosPath, 'utf-8'));

  res.json(datos);
});

module.exports = router;
