const {client} = require("./../db/database");


async function get_livraisons (req,res) {
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
}
function prendre_en_charge(req,res){
    let id = req.body.id;
    let livreur = req.body.livreur;

    try{
        const data4 = client.query(`UPDATE commandes SET status =$1, livreur=$2 WHERE id=$3;`, 
        ["en route",livreur,id],(err) => {
            if(err){
                console.error(err);
                return res.status(500).json({error: "Database error UPDATE COMMANDE LIVRAISON"})
            }else{
                console.log("UPDATE inseree");
                try{
                    // ajouter dans la table livreur, les infos du livreurs avec initialisation des champs
                    const d = client.query(`INSERT INTO livreurs(nom,nb_livraisons,nbpoints,badge) VALUES($1,$2,$3,$4)`, 
                    [livreur,0,0,"junior"],(err) => {
                        if(err){
                            console.error(err);
                            return res.status(500).json({error: "Database error INSERT INTO LIVREURS"})
                        }else{
                            console.log("INSERT INTO livreurs inseree");
                        }
                    });

                }catch(err){
                    console.log(err);
                    res.status(500).json({
                        error: "database error for INSERT INTO LIVREURS"
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
    res.json({
        id: req.body.id,
        livreur_name: livreur
    });
}
function confirmer_livraison(req,res){
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
                    WHERE nom = (SELECT C.livreur FROM commandes C WHERE C.id = $1)
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

}
module.exports = {
    get_livraisons,
    prendre_en_charge,
    confirmer_livraison
}