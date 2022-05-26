const express = require('express');
const router = express.Router();

const {client} = require("./../db/database");
const {statut_commande} = require("./../controllers/commande");

//GET
router.get('/finaliser_commande',(req,res)=>{
    res.render("finaliser_commande");
});
router.get('/finaliser_commande/:id',(req,res)=>{
    var id = req.params.id;
    res.render("finaliser_commande",{id:id});
});
router.get('/statutcommande', (req,res)=>{
    res.render('statut_commande');
});

router.get('/statut/:id/:payload/:livreur',(req,res)=>{
    let id = req.params.id;
    let payload = req.params.payload;
    let livreur = req.params.livreur;
    res.render("statut_comm_res",{id,payload,livreur});
});

router.get('/statut/:id/:payload',(req,res)=>{
    let id = req.params.id;
    let payload = req.params.payload;
    res.render("statut_comm_res",{id,payload});
});

// POST
router.post('/statutcommande',statut_commande);

router.post('/order_conf', (req,res)=>{
    res.render("order_confirmation");
});

module.exports = router;