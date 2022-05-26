const express= require('express');
const router = express.Router();
const md5 = require("md5");
const chaine = process.env.STRIPE_SECRET ;
const stripe = require('stripe')("sk_test_51KkWY9EJLywbHbqu5xcuTA6wDmiMFAVvwqoeT90FjY751uIX231ZgJOubMYP8bt5DNP6e9oH3yUDKYmcj09HlabT00o0YaMEVE");

const {update_client,handle_payment_order} = require("./../controllers/panier");


var donneesCommandeEnCours;
router.post("/envoiPanier", (req, res) => {
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
});

//PAIEMENT STRIPE PAR POST
router.post('/create-checkout-session',async (req,res)=>{

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
        success_url: `http://localhost:${process.env.PORT}/panier/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://localhost:${process.env.PORT}/panier/cancel`,
        metadata: orderInfo
      });
      
      //donneesCommandeEnCours = {};
      res.redirect(303, session.url);
}); //handle paymentÒ

router.get('/success', update_client);

router.get('/cancel',(req,res)=>{
    res.render("error_confirmation");
});


module.exports = router;