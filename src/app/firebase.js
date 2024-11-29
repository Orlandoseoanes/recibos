const { getFirestore } = require('firebase-admin/firestore');
var admin = require("firebase-admin");
const { getStorage } = require("firebase-admin/storage"); 


var serviceAccount = require("../../firebase.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://comandas-ab878-default-rtdb.firebaseio.com/",

  });

const storage = admin.storage(); // No es necesario pasar admin como parámetro
// Obtener la instancia de Firestore
const db = getFirestore();

module.exports = {
  db,storage
};



