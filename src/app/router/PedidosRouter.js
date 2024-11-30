const { Router } = require("express");
const router = Router();
const path = require("path");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const timestamp = Date.now();
const printer = require("pdf-to-printer");
const pedido=require('../models/modelPedido')
const { exec } = require('child_process'); // Importa el módulo child_process
const { execSync } = require('child_process');


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
    const decodedImpresora = decodeURIComponent(impresora);

    const pedidos = await pedido.find({ Estado: 'Sin imprimir' });

    if (pedidos.length === 0) {
      return res.status(404).json({ error: "No hay pedidos sin imprimir" });
    }

    const promises = pedidos.map(async (pedidoItem) => {
      const timestamp = Date.now();
      const outputPath = path.join(__dirname, `pedido_${pedidoItem._id}_${timestamp}.pdf`);

      const doc = new PDFDocument({
        size: "A7",
        margin: 10,
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      const date = new Date(timestamp);

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
        .text(`Mesa: ${pedidoItem.Mesa}`, { align: 'left' })
        .text(`Mesera: ${pedidoItem.Mesera}`, { align: 'left' })
        .moveDown(0.5)
        .text(`Pedido: ${pedidoItem.Mensaje}`, { align: 'left' })
        .text(`Powered by CODEX`, { align: 'right' })
        .text("-----------------------------------", {});

      doc.end();

      return new Promise((resolve, reject) => {
        writeStream.on('finish', async () => {
          let printerError = null;
          try {
            // Windows-specific print command
            try {
              // Use Start-Process to print the PDF
              execSync(`powershell -command "Start-Process -FilePath '${outputPath}' -Verb Print"`, 
              { 
                encoding: 'utf8',
                maxBuffer: 1024 * 1024 // Increase buffer size
              });
              console.log(`Impresión enviada para pedido ${pedidoItem._id}`);
            } catch (printError) {
              printerError = printError;
              console.error(`Error de impresión: ${printError}`);
            }

            // Update pedido state
            await pedido.findByIdAndUpdate(pedidoItem._id, { 
              Estado: 'Impreso',
              ErrorImpresion: printerError ? printerError.message : null
            });
            
            resolve({
              id: pedidoItem._id,
              pdfPath: outputPath,
              impresionExitosa: !printerError
            });
          } catch (updateError) {
            console.error("Error al actualizar el estado del pedido:", updateError);
            reject(updateError);
          }
        });
      });
    });

    const results = await Promise.all(promises);

    // Separate successful and failed prints
    const exitosos = results.filter(r => r.impresionExitosa);
    const fallidos = results.filter(r => !r.impresionExitosa);

    return res.status(200).json({
      message: "Pedidos procesados",
      pedidosExitosos: exitosos.length,
      pedidosFallidos: fallidos.length,
      detalles: results
    });

  } catch (error) {
    console.error("Error en la ruta /pedidos/Imprimir:", error);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});




// Diagnostic route to list printers
router.get("/impresoras", (req, res) => {
  try {
    const printersOutput = execSync('powershell -command "Get-Printer | Select-Object Name"').toString();
    const printers = printersOutput.split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== 'Name' && line !== '----');
    
    res.json(printers);
  } catch (error) {
    console.error("Error listando impresoras:", error);
    res.status(500).json({ error: "No se pudieron listar las impresoras" });
  }
});
module.exports = router;