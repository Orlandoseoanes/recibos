const { Router } = require("express");
const router = Router();
const pedido = require("../models/modelPedido");
const moment = require("moment-timezone");

router.post("/pedidos/pedir", async (req, res) => {
  try {
    const { Mesera, Mesa, Mensaje, Categoria } = req.body;
    const fechaBogota = moment().subtract(5, "hours").toDate();

    if (!Mesera || !Mensaje) {
      return res.status(400).json({ error: "Mesera y Mensaje son requeridos" });
    }

    const newPedido = new pedido({
      Mesera,
      Mesa,
      Mensaje,
      Categoria,
      fecha:fechaBogota
    });
    console.log(fechaBogota)
    const savedPedido = await newPedido.save();

    return res.status(201).json({ id: savedPedido._id });
  } catch (error) {
    console.error("Error en la ruta /pedidos/pedir:", error);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

router.get("/pedidos/sin-imprimir", async (req, res) => {
  try {
    const pedidos = await pedido.find({ Estado: "Sin imprimir" });

    const formattedPedidos = pedidos.map((pedido) => ({
      id: pedido._id,
      Mesera: pedido.Mesera,
      Mensaje: pedido.Mensaje,
      Mesa: pedido.Mesa,
      Categoria: pedido.Categoria,
    }));

    return res.status(200).json(formattedPedidos);
  } catch (error) {
    console.error("Error en la ruta /pedidos/sin-imprimir:", error);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
