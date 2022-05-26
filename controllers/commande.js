const {client} = require("./../db/database");

async function statut_commande(req,res) {
    let idCommande = req.body.id;
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
}

module.exports = {
    statut_commande
}