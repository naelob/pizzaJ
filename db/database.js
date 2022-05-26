const {Client} = require('pg');

require('dotenv').config();

const client = new Client(process.env.DB_URL);

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

module.exports = {
    client,
    fetch,
    fetchPendingOrders,
    addCommandeDB,
    addClientDB,
    addItemToCommandeDB
};
