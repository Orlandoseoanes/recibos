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
const printPDFWindows = (filePath, printerName) => {
  const command = `print /D:"${printerName}" "${filePath}"`;
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('Error al imprimir el PDF:', err);
      return;
    }
    console.log('PDF enviado a la impresora:', stdout);
  });
};
const generatePDF = (pedido, outputPath, timestamp) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A7",
      margin: 10,
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    const date = new Date(timestamp);

    try {
      doc.font("Helvetica")
        .text("-----------------------------------", {})
        .fontSize(12)
        .text("Refresqueria Union del Valle", {
          align: "center",
          underline: true,
        })
        .text("COMANDA", {
          align: "center",
          underline: true,
        })
        .moveDown(0.5)
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
    } catch (error) {
      return reject(error);
    }

    writeStream.on('finish', () => resolve());
    writeStream.on('error', (error) => reject(error));
  });
};
const printPDF = (filePath, printerName) => {
  const platform = process.platform;
  if (platform === 'win32') {
    printPDFWindows(filePath, printerName);
  } else {
    console.error('Sistema operativo no soportado para la impresión');
  }
};
router.get("/pedidos/Imprimir/:impresora", async (req, res) => {
  try {
    const { impresora } = req.params;

    // Input validation
    if (!impresora) {
      return res.status(400).json({ error: "Nombre de impresora no proporcionado" });
    }

    const pedidos = await pedido.find({ Estado: 'Sin imprimir' });

    if (pedidos.length === 0) {
      return res.status(404).json({ error: "No hay pedidos sin imprimir" });
    }

    // Consider adding a transaction or using a more robust error handling mechanism
    const promises = pedidos.map(async (pedido) => {
      try {
        const timestamp = Date.now();
        const outputPath = path.join(__dirname, `pedido_${pedido._id}_${timestamp}.pdf`);

        // PDF Generation
        await generatePDF(pedido, outputPath, timestamp);

        // Printing
        printPDF(outputPath, impresora);

        // Update order status
        await pedido.findByIdAndUpdate(pedido._id, { Estado: 'Impreso' });

        return {
          id: pedido._id,
          pdfPath: outputPath
        };
      } catch (pedidoError) {
        console.error(`Error processing order ${pedido._id}:`, pedidoError);
        return {
          id: pedido._id,
          error: pedidoError.message
        };
      }
    });

    const results = await Promise.allSettled(promises);

    // Handle partial failures
    const successfulPrints = results.filter(result => result.status === 'fulfilled');
    const failedPrints = results.filter(result => result.status === 'rejected');

    return res.status(200).json({
      message: "Procesamiento de pedidos completado",
      successful: successfulPrints.length,
      failed: failedPrints.length,
      details: results
    });

  } catch (error) {
    console.error("Error en la ruta /pedidos/Imprimir:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;