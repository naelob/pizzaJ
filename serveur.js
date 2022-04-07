const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const chaine = process.env.STRIPE_SECRET ;
const stripe = require('stripe')("sk_test_51KkWY9EJLywbHbqu5xcuTA6wDmiMFAVvwqoeT90FjY751uIX231ZgJOubMYP8bt5DNP6e9oH3yUDKYmcj09HlabT00o0YaMEVE");

require('dotenv').config();

const client = require("./db/database");
const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");
app.use("/public", express.static(__dirname + "/views/public"));

app.use(cors());


//CONNECTION VERS PSQL (ELEPHANT SQL)

client.connect((err)=>{
    if(err){
        console.log(err);
    }else{
        console.log("successful connection to the db!");
    }
});

//AUTHENTIFICATION
app.post('/register' , async (req,res)=>{
    const {name,email,phonenumber,password} = req.body;
    try{
        console.log("rentre");
        const  data  =  await client.query(`SELECT * FROM users WHERE email= $1;`, [email]); //Checking if user already exists
        const  arr  =  data.rows;
        if (arr.length  !=  0) {
            return  res.status(400).json({
            error: "Email already there, No need to register again.",
            });
        } else {
            console.log("bcrypt");

            bcrypt.hash(password, 10, (err, hash) => {
                if (err)
                    res.status(err).json({error: "Server error"});
                const  user  = {
                    name,
                    email,
                    phonenumber,
                    password: hash,
                };
                var flag  =  1; //Declaring a flag

                //Inserting data into the database

                client
                .query(`INSERT INTO users (name, email, phonenumber, password) VALUES ($1,$2,$3,$4);`, [user.name, user.email, user.phonenumber, user.password], (err) => {
                    console.log("query insert");
                    if (err) {
                        flag  =  0; //If user is not inserted is not inserted to database assigning flag as 0/false.
                        console.error(err);
                        return res.status(500).json({error: "Database error"})
                    } else {
                        flag  =  1;
                        res.status(200).send({ message: 'User added to database, not verified' });
                    }
                });
                if (flag) {
                    console.log("insere donc sign");

                    const  token  = jwt.sign( //Signing a jwt token
                    {
                    email: user.email
                    },
                    process.env.SECRET_KEY
                    );
                };
            });

            console.log("bcrypt fini");
        }
    }catch(err){
        console.log(err);
        res.status(500).json({
            error: "database error for registering user"
        });
    }
}); 

app.post('/login',async (req,res)=>{
    const { email, password } = req.body;
    try{
        console.log("rentre");
        const  data  =  await client.query(`SELECT * FROM users WHERE email= $1;`, [email]); //Checking if user already exists
        const  arr  =  data.rows;
        if (arr.length  ==  0) {
            return  res.status(400).json({
            error: "User is not registered yet, signup first.",
            });
        } else {
            console.log("bcrypt");

            bcrypt.compare(password, arr[0].password, (err, result) => {
                if (err){
                    res.status(err).json({error: "Server error"});
                }else if(result===true){
                    const  token  = jwt.sign(
                        {email:email},
                        process.env.SECRET_KEY
                    );
                    res.status(200).json({
                        message: "User signed in!",
                        token: token,
                    });
                }else{
                    if(result!= true){
                        res.status(400).json({
                            error: "Enter correct password!",
                        });
                    }
                }
            });
            console.log("bcrypt fini");
        }
    }catch(err){
        console.log(err);
        res.status(500).json({
            error: "database error for signin in user"
        });
    }

})

//REQUETE VERS PSQL POUR RECUP LES MENUS AVEC INFOS
async function fetch(table){
    try{
        //console.log(`rentre pour fetch les ${table}`);
        const  data  =  await client.query(`SELECT * FROM ${table}`);
        const  arr  =  data.rows;
        if (arr.length  ==  0) {
            return  res.status(400).json({
            error: `Aucun ${table} present.`,
            });
        } else {
            //console.log(`${table} trouves`);
            return arr;
        }
    }catch(err){
        console.log(err);
        res.status(500).json({
            error: `database error for fetching ${table}`
        });
    }
}


//ROUTES GET


app.get('/', async (req,res)=>{
    const menus = await fetch("menus");
    const entrees = await fetch("entrees");
    const boissons = await fetch("boissons");
    const pizzas = await fetch("pizzas");

    res.render("homepage",{ menus , entrees, boissons, pizzas });
    
});

app.get('/menu', (req,res)=>{
    res.render("menu");
});

app.get('/livraison', (req,res)=>{
    // verification si la personne connectée est bien un livreur
    // si oui, lui afficher les commandes outstanding de la table outstandingCommandes
    // ORDER BY HORAIRE ASC
    // verifier qu'elle n'est pas prise en charge par un autre livreur
    // si non, erreur
    // 2 boutons : prendre en charge / confirmer livraison (affichage uniquement selon la personne connectee)
    // possibilite de confirmer une commande livrée pour un client => statut livrée
    // ajout dans la table deliveredCommandes
    // suppression dans la table outStandingCommandes
    res.render("livraison");
});

//TODO : creation route /statutCommande:idCommande pour un client avec un id valide d'une commande
    // verification si l'id de la commande est valide
    // si oui, lui afficher les commandes en attente non livrees 
    // si non, erreur
    // possibilite d'afficher  le nv statut commande livrée pour un client => statut livrée

app.get('/panier', (req,res)=>{
    res.render("panier");
});
app.get('/success.html',(req,res)=>{
    res.render("order_confirmation");
});
app.get('/cancel.html',(req,res)=>{
    res.render("error_confirmation");
});

app.get('/finaliser_commande',(req,res)=>{
    res.render("finaliser_commande");
});
app.get('/finaliser_commande/:id',(req,res)=>{
    var id = req.params.id;
    res.render("finaliser_commande",{id:id});
});

app.get('/contact.ejs',(req,res)=>{
    res.render("contact");
});

app.get('/la_carte.ejs',(req,res)=>{
    res.render("la_carte");
});
app.get('/connexion.ejs',(req,res)=>{
    res.render("connexion");
});

//ROUTES POST
app.post('/order_conf', (req,res)=>{
    res.render("order_confirmation");
});

var donneesCommandeEnCours;
app.post("/envoiPanier", (req, res) => {
    donneesCommandeEnCours = {
        id: req.body.id,
        articlesList : req.body.articlesList,
        totalPrix : req.body.totalCommande,
    };
    res.json({
        articlesList: req.body.articlesList,
        totalCommande: req.body.totalCommande,
        id: req.body.id
    });
    //ajouter un unique id par commande coté client 'header.js'
})

//PAIEMENT STRIPE PAR POST
app.post('/create-checkout-session', async (req,res)=>{

    //recuperer les infos du client avec details commande pour l'afficher sur stripe
    const customer = {
        prenom: req.body.prenom,
        nom: req.body.nom,
        email: req.body.email,
        telephone: req.body.num,
        addresse: req.body.addresse,
        heureSouhaitee: req.body.heure
    }

    //essai pour un article
    const product = await stripe.products.create({name: donneesCommandeEnCours.articlesList[0].title});
    const product1 = await stripe.products.create({name: donneesCommandeEnCours.articlesList[1].title});

    const price = await stripe.prices.create({
        product: product.id,
        unit_amount: donneesCommandeEnCours.articlesList[0].price*100,
        currency: 'eur',
    });
    const price1 = await stripe.prices.create({
        product: product1.id,
        unit_amount: donneesCommandeEnCours.articlesList[1].price*100,
        currency: 'eur',
    });

    const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
          {
            price: price1.id,
            quantity: 1,
          }
        ],
        mode: 'payment',
        success_url: `http://localhost:${process.env.PORT}/success.html`,
        cancel_url: `http://localhost:${process.env.PORT}/cancel.html`,
      });

      //TODO : creation d'une nouvelle commande<>livraison dans la table Livraison avec psql
      //ajout dans la table outstandingCommandes
      //donneesCommandeEnCours = {};
      res.redirect(303, session.url);
});
app.listen(port, () => {
    console.log(`App running on port ${port}`);
})


/*
TODO OPTIONS : 

-> CREER DES STATUTS POUR CLIENTS : LIVREURS

NOMBRE DE POINTS PAR COMMANDE LIVREE POUR LES LIVREURS => CREER UN BADGE SUR LE PROFIL DU LIVREUR
NOMBRE DE POINTS PAR COMMANDE PASSEE POUR LES CLIENTS => ACCES AU FAMEUX MENU DOLCE  
AJOUT D'UN ESPACE CLIENT POUR LIVREURS/CLIENTS SI TEMPS RESTANT AVEC Prix Degressif pour chaque menu enfant
si personne en couple avec plusieurs enfants

*/

