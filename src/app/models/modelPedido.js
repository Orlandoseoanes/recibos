const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  Mesera: { type: String, required: true },
  Mesa: { type: String },
  Mensaje: { type: String, required: true },
  Estado: { type: String, default: 'Sin imprimir' },
  Categoria: {type:String,required:true},
  fecha: { type:Date, default: Date.now } // Captura automática de la fecha y hora actual
});

const Pedido = mongoose.model('Pedido', pedidoSchema);

module.exports = Pedido;
