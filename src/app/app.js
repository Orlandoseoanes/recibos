const express= require("express");
const morgan =require("morgan");
const app=express();
const cors = require("cors"); // Agregar CORS
const connectDB = require('../app/conexion');
const axios = require("axios");
const cron = require("node-cron");

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({extended:false}));
connectDB();


// Agregar middleware de CORS
app.use(cors());

const routerMeseras =require("../app/router/MeserasRouter");
const pedidosRouter =require("../app/router/PedidosRouter")
///////////
app.use(morgan("dev"));
app.get('/', (req, res) => {
    res.send('express');
});
app.use(express.json());



app.use("/api/v1",routerMeseras);
app.use("/api/v1",pedidosRouter);


cron.schedule("*/10 * * * *", async () => {
    try {
        const url = "https://recibos-fdrw.onrender.com/api/v1/pedidos/sin-imprimir"
        const respuesta = await axios.get(url);
        console.log("Manteniendo activo el servicio:", respuesta.status);
    } catch (error) {
        console.error("Error en el ping:", error.message);
    }
});



module.exports=app;