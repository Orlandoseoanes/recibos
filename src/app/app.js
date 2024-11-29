const express= require("express");
const morgan =require("morgan");
const app=express();
const cors = require("cors"); // Agregar CORS
const connectDB = require('../app/conexion');

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






module.exports=app;