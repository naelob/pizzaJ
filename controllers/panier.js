const {client} = require("./../db/database");
const md5 = require("md5");
const chaine = process.env.STRIPE_SECRET ;
const stripe = require('stripe')("sk_test_51KkWY9EJLywbHbqu5xcuTA6wDmiMFAVvwqoeT90FjY751uIX231ZgJOubMYP8bt5DNP6e9oH3yUDKYmcj09HlabT00o0YaMEVE");

const {addClientDB,addCommandeDB,addItemToCommandeDB} = require("./../db/database");

async function update_client(req, res){
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
}
async function handle_payment_order(req,res){

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
}

module.exports = {
    update_client,
    handle_payment_order
}