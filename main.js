const express = require('express');
const bodyParser = require('body-parser');
const confetti = require('canvas-confetti');
require('dotenv').config();

const {client} = require("./db/database");

const app = express();
const port = process.env.PORT || 3000;

//BODY PARSER TO PARSE REQUESTS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// SET VIEW PATH FOR EJS TEMPLATING
app.set("view engine", "ejs");
app.use("/public", express.static(__dirname + "/views/public"));

//ROUTES IMPORTS
const index = require('./routes/index');
const home = require('./routes/home');
const auth = require('./routes/auth');
const commande = require('./routes/commande');
const delivery = require('./routes/livraison');
const panier = require('./routes/panier');

app.use('/',index);
app.use('/home',home);
app.use('/auth',auth);
app.use('/commande',commande);
app.use('/delivery',delivery);
app.use('/panier',panier);

//CONNECTION VERS PSQL (ELEPHANT SQL)
client.connect((err)=>{
    if(err){
        console.log(err);
    }else{
        console.log("successful connection to the db!");
    }
});

app.listen(port, () => {
    console.log(`App running on port ${port}`);
});

