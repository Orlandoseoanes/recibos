const { Router } = require("express");
const router = Router();
const pedido=require('../models/modelPedido')



router.post("/pedidos/pedir", async (req, res) => {
  try {
    const { Mesera, Mesa, Mensaje,Categoria

     } = req.body;

    if (!Mesera || !Mensaje) {
      return res.status(400).json({ error: "Mesera y Mensaje son requeridos" });
    }

    const newPedido = new pedido({
      Mesera,
      Mesa,
      Mensaje,
      Categoria
    });

    const savedPedido = await newPedido.save();

    return res.status(201).json({ id: savedPedido._id });

  } catch (error) {
    console.error("Error en la ruta /pedidos/pedir:", error);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

router.get("/pedidos/sin-imprimir", async (req, res) => {
  try {
    const pedidos = await pedido.find({ Estado: 'Sin imprimir' });

    const formattedPedidos = pedidos.map(pedido => ({
      id: pedido._id,
      Mesera: pedido.Mesera,
      Mensaje: pedido.Mensaje,
      Mesa: pedido.Mesa,
      Categoria:pedido.Categoria
    }));

    return res.status(200).json(formattedPedidos);
  } catch (error) {
    console.error("Error en la ruta /pedidos/sin-imprimir:", error);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});


module.exports = router;