const express = require('express');
const bodyParser = require('body-parser');
//const cors = require('cors');
const bcrypt = require("bcryptjs");
//const jwt = require("jsonwebtoken");
const md5 = require("md5");
const confetti = require('canvas-confetti');

const chaine = process.env.STRIPE_SECRET ;
const stripe = require('stripe')("sk_test_51KkWY9EJLywbHbqu5xcuTA6wDmiMFAVvwqoeT90FjY751uIX231ZgJOubMYP8bt5DNP6e9oH3yUDKYmcj09HlabT00o0YaMEVE");

const passport = require("passport");
var crypto = require('crypto');

const flash = require("connect-flash");
const session = require('express-session');
const request = require('request');
const expressSession = require('express-session');

const pgSession = require('connect-pg-simple')(session);


const LocalStrategy = require('passport-local').Strategy;

require('dotenv').config();

const client = require("./db/database");
const app = express();
var logger = require('morgan');

const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");
app.use("/public", express.static(__dirname + "/views/public"));


app.use(flash());


//CONNECTION VERS PSQL (ELEPHANT SQL)

client.connect((err)=>{
    if(err){
        console.log(err);
    }else{
        console.log("successful connection to the db!");
    }
});



//fonctions REQUETE VERS PSQL POUR RECUP LES MENUS AVEC INFOS
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

async function fetchPendingOrders(){

    try{
        const  data  =  await client.query(`SELECT * FROM commandes WHERE status=$1;`, ["non livree"]);
        const  arr  =  data.rows;
        if (arr.length  ==  0) {
            return  res.status(400).json({
            error: `Aucune order presente.`,
            });
        } else {
            //console.log(`${table} trouves`);
            return arr;
        }
    }catch(err){
        console.log(err);
        res.status(500).json({
            error: `database error for fetching orders`
        });
    }
}

function addCommandeDB(res,id,idClient,status,heureSouhaitee){
    try{
        const  data4 = client.query(`INSERT INTO commandes (id, id_client, status,heure_livraison) VALUES ($1,$2,$3,$4);`, 
        [id,idClient,status,heureSouhaitee],(err) => {
            if(err){
                console.error(err);
                return res.status(500).json({error: "Database error COMMANDE"})
            }else{
                console.log("commande inseree");
            }
        });
    }catch(err){
        console.log(err);
        res.status(500).json({
            error: "database error for registering COMMANDE"
        });
    }
}
function addClientDB(res,id, prenom, nom, addresse, email, telephone){
    try{
        const data3  = client.query(`INSERT INTO clients (id, prenom, nom, addresse, email, telephone) VALUES ($1,$2,$3,$4,$5,$6);`,
            [id, prenom, nom, addresse, email, telephone], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Database error CLIENTS" });
                } else {
                    console.log("first clients reussi");
                    try{
                        const data4  = client.query(`UPDATE clients SET points_fidelite=points_fidelite + 350,
                            badge = (CASE 
                                WHEN points_fidelite <= 3000 
                                  THEN 'touriste'
                                WHEN points_fidelite <= 6000
                                  THEN 'connaisseur'
                                WHEN points_fidelite >6000
                                  THEN 'habitue'
                              END)
                            WHERE id = $1
                        ;`,
                            [id], (err) => {
                                if (err) {
                                    console.error(err);
                                    return res.status(500).json({ error: "Database error CLIENTS" });
                                } else {
                                    console.log("first clients reussi");
                                    
                                }
                            });
                    }catch(err){
                        console.log(err);
                        res.status(500).json({
                            error: "database error for registering client"
                        });
                    }
                }
            });
    }catch(err){
        console.log(err);
        res.status(500).json({
            error: "database error for registering client"
        });
    }
}
function addItemToCommandeDB(res,id,idClient,nameArticle,quantiteArticle,prixArticle){
    try{
        const  data4 = client.query(`INSERT INTO items_from_commande (id,idClient, nameArticle, quantiteArticle, prixArticle) VALUES ($1,$2,$3,$4,$5);`, 
        [id,idClient,nameArticle,quantiteArticle, prixArticle],(err) => {
            if(err){
                console.error(err);
                return res.status(500).json({error: "Database error ITEM_COMMANDE"})
            }else{
                console.log("item insere");
            }
        });
    }catch(err){
        console.log(err);
        res.status(500).json({
            error: "database error for registering ITEM_COMMANDE"
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


app.get('/livraison', async (req,res)=>{
    // verification si la personne connectée est bien un livreur
    // si oui, lui afficher les commandes outstanding de la table outstandingCommandes
    // ORDER BY HORAIRE ASC
    // verifier qu'elle n'est pas prise en charge par un autre livreur
    // si non, erreur
    // 2 boutons : prendre en charge (affichage uniquement selon la personne connectee)
    // possibilite de confirmer une commande livrée pour un client => statut livrée
    // ajout dans la table deliveredCommandes
    // suppression dans la table outStandingCommandes
    let pendingOrders;
    try{
        const  data  =  await client.query(`SELECT * FROM commandes WHERE status=$1 ORDER BY heure_livraison ASC;`, ["en preparation"]);
        const  arr  =  data.rows;
        if (arr.length  ==  0) {
            return  res.render('livraisonEmpty')
        } else {
            //console.log(`${table} trouves`);
            pendingOrders = arr;
        }
    }catch(err){
        console.log(err);
        res.status(500).json({
            error: `database error for fetching orders`
        });
    }
   
    console.log(pendingOrders);

    let pendingItems = [];
    let commandesDETAILED = [];
    let commandeOBJECT = {};
    let sumItems = 0;
    for(let i=0;i<pendingOrders.length;i++){
        try{
            const  data1  =  await client.query(`SELECT * FROM items_from_commande WHERE id=$1;`, [pendingOrders[i].id]);
            const  arr1  =  data1.rows;
            if (arr1.length  ==  0) {
                return  res.status(400).json({
                error: `Aucune ITEM presente.`,
                });
            } else {
                // ingredients contient tous les details d'une meme commande
                pendingItems.push(arr1);
                //pendingItems[i] => tableau d'items/ingredients de la commande pendingOrder[id]

                try{
                    const  data3  =  await client.query(`SELECT SUM(prixarticle) FROM items_from_commande WHERE id=$1;`, [pendingOrders[i].id]);
                    const  arr2  =  data3.rows;
                    if (arr2.length  ==  0) {
                        return  res.status(400).json({
                        error: `Aucune SUM presente.`,
                        });
                    } else {
                        //console.log(`${table} trouves`);
                        sumItems = arr2[0].sum;
                        commandeOBJECT = {
                            order_name: pendingOrders[i].id,
                            liste_items: pendingItems[i],
                            total: sumItems 
                        }
                        commandesDETAILED.push(commandeOBJECT);
                        console.log(commandeOBJECT);

                    }
                }catch(err){
                    console.log(err);
                    res.status(500).json({
                        error: `database error for fetching SUM`
                    });
                }
                
            }
        }catch(err){
            console.log(err);
            res.status(500).json({
                error: `database error for fetching items`
            });
        }
    }
    console.log(commandesDETAILED)
    res.render("livraison",{commandesDETAILED});
});

app.get('/panier', (req,res)=>{
    res.render("panier");
});

app.get('/cancel',(req,res)=>{
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

app.get('/la_carte.ejs',async (req,res)=>{
    const menus = await fetch("menus");
    res.render("la_carte",{menus});
});
app.get('/connexion.ejs',(req,res)=>{
    res.render('connexion');
    
});
app.get('/statutcommande', (req,res)=>{
    res.render('statut_commande');
});
app.get('/statut/:id/:payload/:livreur',(req,res)=>{
    let id = req.params.id;
    let payload = req.params.payload;
    let livreur = req.params.livreur;
    res.render("statut_comm_res",{id,payload,livreur});
});

app.get('/statut/:id/:payload',(req,res)=>{
    let id = req.params.id;
    let payload = req.params.payload;
    res.render("statut_comm_res",{id,payload});
});
app.get('/confirm_delivery',(req,res)=>{
    res.render('confirm_delivery');
})

//ROUTES POST

app.post('/priseCharge',(req,res)=>{
    let id = req.body.id;
    let livreur = 1;

    try{
        const  data4 = client.query(`UPDATE commandes SET status =$1, livreur=$2 WHERE id=$3;`, 
        ["en route",livreur,id],(err) => {
            if(err){
                console.error(err);
                return res.status(500).json({error: "Database error UPDATE COMMANDE LIVRAISON"})
            }else{
                console.log("UPDATE inseree");
            }
        });
    }catch(err){
        console.log(err);
        res.status(500).json({
            error: "database error for UPDATING COMMANDE"
        });
    }
    res.json({
        id: req.body.id,
        livreur_name: livreur
    });

})
app.post('/confirm_delivery',(req,res)=>{
    let id = req.body.order_delivered;
    try{
        const  data4 = client.query(`UPDATE commandes SET status =$1 WHERE id=$2;`, 
        ["livree",id],(err) => {
            if(err){
                console.error(err);
                return res.status(500).json({error: "Database error UPDATE COMMANDE LIVRAISON"})
            }else{
                console.log("COMMANDE LIVREE");
                try{
                    const  data5 = client.query(`UPDATE livreurs 
                    SET nb_livraisons = nb_livraisons + 1, nbpoints = nbpoints + 300,  
                    badge = (CASE 
                      WHEN nbpoints <= 3000 
                        THEN 'junior'
                      WHEN nbpoints <= 6000
                        THEN 'performer'
                      WHEN nbpoints >6000
                        THEN 'veteran'
                    END)
                    WHERE id = (SELECT C.livreur FROM commandes C WHERE C.id = $1)
                    ;`, 
                    [id],(err) => {
                        if(err){
                            console.error(err);
                            return res.status(500).json({error: "Database error UPDATE COMMANDE LIVRAISON"})
                        }else{
                            console.log("NB LIVRAISONS AUGMENTE");
                        }
                    });
                }catch(err){
                    console.log(err);
                    res.status(500).json({
                        error: "database error for UPDATING COMMANDE"
                    });
                }
            }
        });
    }catch(err){
        console.log(err);
        res.status(500).json({
            error: "database error for UPDATING COMMANDE"
        });
    }
    res.render("confirm_delivery_confetti");

});

//TODO : erreur css apres requetes
app.post('/statutcommande',async (req,res)=>{
    let idCommande = req.body.id;
    console.log(idCommande);
    let statut;
    let res_livreur="";
    // requete pour savoir si la commande est livree/en route/en preparation i.e 0 || 1 || 2
    try{
        const  data  =  await client.query(`SELECT status FROM commandes WHERE id=$1;`, [idCommande]);
        const  arr  =  data.rows;
        if (arr.length  ==  0) {
            return  res.status(400).json({
            error: `Aucune order presente.`,
            });
        } else {
            
            if(arr[0].status==="livree"){
                statut = 0;
            }else if(arr[0].status==="en route"){
                //UN LIVREUR S'EN EST DEJA OCCUPEE
                statut = 1;
                try{
                    const  data1  =  await client.query(`SELECT L.nom AS nom FROM livreurs L JOIN commandes C ON L.id=C.livreur WHERE C.id = $1;`, [idCommande]);
                    const  arr1  =  data1.rows;
                    if (arr1.length  ==  0) {
                        return  res.status(400).json({
                        error: `Aucune livreur en charge present.`,
                        });
                    } else {
                        res_livreur = arr1[0].nom;
                    }
                }catch(err){
                    console.log(err);
                    res.status(500).json({
                        error: `database error for fetching livreur en charge `
                    });
                }
            }else{
                statut = 2;
            }
        }
    }catch(err){
        console.log(err);
        res.status(500).json({
            error: `database error for fetching orders`
        });
    }
    res.json({
        id: req.body.id,
        payload: statut,
        livreur_name: res_livreur
    });
});

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
        id: req.body.id,
        articlesList : req.body.articlesList,
        totalPrix : req.body.totalCommande,
    });
})
//PAIEMENT STRIPE PAR POST
app.post('/create-checkout-session', async (req,res)=>{

    //recuperer les infos du client avec details commande pour l'afficher sur stripe
    const orderInfo = {
        prenom: req.body.prenom,
        nom: req.body.nom,
        email: req.body.email,
        telephone: req.body.num,
        addresse: req.body.addresse,
        heureSouhaitee: req.body.heure,
        orderId: req.body.idOrder
    }
    
    let prices = []

    for(var i=0;i<donneesCommandeEnCours.articlesList.length;i++){
        let product = await stripe.products.create({name: donneesCommandeEnCours.articlesList[i].title});
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: donneesCommandeEnCours.articlesList[i].price*100,
            currency: 'eur',
        });
        prices.push(price);
    }

    lineItems = []
    for(item of prices){
        lineItems.push({price:item.id,quantity: 1})
    }

    const session = await stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: 'payment',
        success_url: `http://localhost:${process.env.PORT}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://localhost:${process.env.PORT}/cancel`,
        metadata: orderInfo
      });
      
      //donneesCommandeEnCours = {};
      res.redirect(303, session.url);
});


app.get('/success', async (req, res) => {
    // ajout de la commande dans la table outstandingCommande(id,clientId,menu,qtyEntree,entree,qtyEntree,pizza,qtyPizza,boisson,qtyBoisson,deliveringStatus,heureSouhaitee,idLivreur)
    // tmp => outStandingCommande(id,clientId,article,prix)

    // ajout du client dans la table client(id,prenom,nom,addresse,email,numero)

    let paidArticles = []
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    const cus = session.metadata;
    const customer = await stripe.customers.retrieve(session.customer);
    const items = await stripe.checkout.sessions.listLineItems(req.query.session_id);

    let id_client = md5(cus.prenom + cus.nom);

    addClientDB(res,id_client, cus.prenom, cus.nom, cus.addresse, cus.email, cus.telephone);

    for(art of items.data){
        paidArticles.push({
            name: art.description,
            price: art.price.unit_amount,
            quantity: art.quantity
        })
    }
    const idOrder = cus.orderId;

    for(o of paidArticles){
        addItemToCommandeDB(res,idOrder,id_client,o.name,o.quantity,o.price/100);
    }
    addCommandeDB(res,idOrder,id_client,"en preparation",cus.heureSouhaitee);
    res.render("statut_commande",{id: idOrder});
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

*/

