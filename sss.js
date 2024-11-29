 // Crear una nueva instancia de un documento PDF
 const doc = new PDFDocument({
    size: "A7", // Tamaño de papel más pequeño (74 x 105 mm)
    margin: 10, // Margen de 10 puntos
  });

  // Establecer el nombre y la ubicación del archivo PDF
  const outputPath = path.join(__dirname, `pedido_${timestamp}.pdf`);
  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  const date = new Date(timestamp);

  // Document settings
  doc.font("Helvetica");

  // Header
  doc
    .fontSize(12)
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
    .text(`Mesa: ${Mesa}`, { align: 'left' })
    .text(`Mesera: ${Mesera}`, { align: 'left' })
    .moveDown(0.5)
    .text(`Pedido: ${Mensaje}`, { align: 'left' })
    .text(`Powered by CODEX`, { align: 'right' });

  // Ajustar el tamaño de la página según el contenido
  doc.end();
  // Wait for the file to be written
  writeStream.on('finish', async () => {
      try {
        await printer.printPDF(outputPath, { printer: pedido.Impresora });
        return res.status(200).json({
          message: "Pedido realizado correctamente",
          pedido,
        });
      } catch (printError) {
        console.error("Error al imprimir el PDF:", printError);
        return res.status(500).json({ error: "Error al imprimir el pedido" });
      }
    });
