const { Router } = require("express");
const router = Router();
const {datos}=require ("../datos.json")
const path = require('path');

// Ruta para obtener todas las meseras
router.get('/AllMeseras', async (req, res) => {
  const datosPath = path.join(__dirname, '../datos.json');
  const datos = require(datosPath);
  
  res.json(datos);
});

module.exports = router;