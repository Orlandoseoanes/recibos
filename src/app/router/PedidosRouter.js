const { Router } = require("express");
const router = Router();
const path = require("path");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const timestamp = Date.now();
const printer = require("pdf-to-printer");
const { db, } = require('../firebase');


router.post("/pedidos/pedir", async (req, res) => {
  try {
    const { Mesera, Mesa, Mensaje } = req.body;

    if (!Mesera || !Mensaje) {
      return res.status(400).json({ error: "Mesera y Mensaje son requeridos" });
    }

    const NewPedidoId = await db.collection("Pedidos").add({
        Mesera,
        Mesa,
        Mensaje,
        Estado:'Sin imprimir'
      });

    return res.status(201).json({ id: NewPedidoId.id });

  } catch (error) {
    console.error("Error en la ruta /pedidos/pedir:", error);
    return res.status(500).json({ error: "Error en el servidor" });
  }
});


router.get("/pedidos/sin-imprimir", async (req, res) => {
    try {
        const querySnapshot = await db.collection("Pedidos")
        .where("Estado", "==", "Sin imprimir") 
        .get();
  
  
        const Pedidos = querySnapshot.docs.map(doc => ({
            id: doc.id,
            Mesera: doc.data().Mesera,
            Mensaje: doc.data().Mensaje, 
            Mesa: doc.data().Mesa,
        }));
       return res.status(200).json(Pedidos);

    } catch (error) {
      console.error("Error en la ruta /pedidos/pedir:", error);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  });


  router.get("/pedidos/Imprimir/:impresora", async (req, res) => {
    try {
        const { impresora } = req.params;

      const querySnapshot = await db.collection("Pedidos")
        .where("Estado", "==", "Sin imprimir")
        .get();
  
      const pedidos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        Mesera: doc.data().Mesera,
        Mensaje: doc.data().Mensaje,
        Mesa: doc.data().Mesa,
      }));
  
      if (pedidos.length === 0) {
        return res.status(404).json({ error: "No hay pedidos sin imprimir" });
      }
  
      // Generar un PDF por cada pedido
      const promises = pedidos.map(async (pedido) => {
        const timestamp = Date.now(); // Obtiene el timestamp para los nombres de los archivos
        const outputPath = path.join(__dirname, `pedido_${pedido.id}_${timestamp}.pdf`);
  
        // Crear una nueva instancia de un documento PDF
        const doc = new PDFDocument({
          size: "A7",
          margin: 10,
        });
  
        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);
  
        const date = new Date(timestamp);
  
        // Document settings
        doc.font("Helvetica");
  
        // Header
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
  
        // Order details
        doc
          .fontSize(10)
          .text(`Fecha: ${date.toLocaleDateString()}`, { align: 'left' })
          .text(`Hora: ${date.toLocaleTimeString()}`, { align: 'left' })
          .text(`Mesa: ${pedido.Mesa}`, { align: 'left' })
          .text(`Mesera: ${pedido.Mesera}`, { align: 'left' })
          .moveDown(0.5)
          .text(`Pedido: ${pedido.Mensaje}`, { align: 'left' })
          .text(`Powered by CODEX`, { align: 'right' });
  
        doc.end();
  
        // Esperar a que el archivo PDF se genere
        await new Promise((resolve, reject) => {
          writeStream.on('finish', async () => {
            try {
                await printer.print(outputPath, { printer: impresora });
                await db.collection("Pedidos").doc(pedido.id).update({
                Estado: 'Impreso',
              });
  
              console.log(`Pedido ${pedido.id} impreso y estado actualizado a 'Impreso'`);
              resolve();
            } catch (printError) {
              console.error("Error al imprimir el PDF o actualizar el estado:", printError);
              reject(printError);
            }
          });
        });
  
        return {
          id: pedido.id,
          pdfPath: outputPath
        };
      });
  
      // Esperar a que se generen todos los PDF y se actualicen los estados
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