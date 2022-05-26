const express= require('express');
const router = express.Router();

const {client} = require("./../db/database");

//CONTROLLER
const {get_livraisons,prendre_en_charge,confirmer_livraison} = require("./../controllers/livraison");

router.get('/livraison',get_livraisons);


router.get('/confirm_delivery',(req,res)=>{
    res.render('confirm_delivery');
})

//ROUTES POST

router.post('/priseCharge',prendre_en_charge);
router.post('/confirm_delivery',confirmer_livraison);

module.exports = router;