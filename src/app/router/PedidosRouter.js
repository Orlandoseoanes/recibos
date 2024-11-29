const { Router } = require("express");
const router = Router();
const path = require("path");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const timestamp = Date.now();
const printer = require("pdf-to-printer");
const pedido=require('../models/modelPedido')


router.post("/pedidos/pedir", async (req, res) => {
  try {
    const { Mesera, Mesa, Mensaje } = req.body;

    if (!Mesera || !Mensaje) {
      return res.status(400).json({ error: "Mesera y Mensaje son requeridos" });
    }

    const newPedido = new pedido({
      Mesera,
      Mesa,
      Mensaje
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
    }));

    return res.status(200).json(formattedPedidos);
  } catch (error) {
    console.error("Error en la ruta /pedidos/sin-imprimir:", error);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

router.get("/pedidos/Imprimir/:impresora", async (req, res) => {
  try {
    const { impresora } = req.params;

    const pedidos = await pedido.find({ Estado: 'Sin imprimir' });

    if (pedidos.length === 0) {
      return res.status(404).json({ error: "No hay pedidos sin imprimir" });
    }

    const promises = pedidos.map(async (pedido) => {
      const timestamp = Date.now();
      const outputPath = path.join(__dirname, `pedido_${pedido._id}_${timestamp}.pdf`);

      const doc = new PDFDocument({
        size: "A7",
        margin: 10,
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      const date = new Date(timestamp);

      doc.font("Helvetica")
      .text("-----------------------------------", {})
      doc
        .fontSize(12)
        .text("Refresqueria Union del Valle", {
          align: "center",
          underline: true,
        })
        .text("COMANDA", {
          align: "center",
          underline: true,
        })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .text(`Fecha: ${date.toLocaleDateString()}`, { align: 'left' })
        .text(`Hora: ${date.toLocaleTimeString()}`, { align: 'left' })
        .text(`Mesa: ${pedido.Mesa}`, { align: 'left' })
        .text(`Mesera: ${pedido.Mesera}`, { align: 'left' })
        .moveDown(0.5)
        .text(`Pedido: ${pedido.Mensaje}`, { align: 'left' })
        .text(`Powered by CODEX`, { align: 'right' })
        .text("-----------------------------------", {});

      doc.end();

      await new Promise((resolve, reject) => {
        writeStream.on('finish', async () => {
          try {
            await printer.print(outputPath, { printer: impresora });
            await Pedido.findByIdAndUpdate(pedido._id, { Estado: 'Impreso' });
            console.log(`Pedido ${pedido._id} impreso y estado actualizado a 'Impreso'`);
            resolve();
          } catch (printError) {
            console.error("Error al imprimir el PDF o actualizar el estado:", printError);
            reject(printError);
          }
        });
      });

      return {
        id: pedido._id,
        pdfPath: outputPath
      };
    });

    const results = await Promise.all(promises);

    return res.status(200).json({
      message: "Pedidos impresos correctamente y estado actualizado.",
      pedidos: results
    });

  } catch (error) {
    console.error("Error en la ruta /pedidos/Imprimir:", error);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;