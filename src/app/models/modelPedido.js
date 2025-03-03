const mongoose = require('mongoose');
const moment = require("moment-timezone");

const pedidoSchema = new mongoose.Schema({
  Mesera: { type: String, required: true },
  Mesa: { type: String },
  Mensaje: { type: String, required: true },
  Estado: { type: String, default: 'Sin imprimir' },
  Categoria: {type:String,required:true},
  fecha: { type:Date} 
});

const Pedido = mongoose.model('Pedido', pedidoSchema);

module.exports = Pedido;
