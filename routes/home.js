const express= require('express');
const router = express.Router();

const {fetch} = require("./../db/database");

router.get('/', async (req,res)=>{
    const menus =  await fetch("menus");
    const entrees =  await fetch("entrees");
    const boissons =  await fetch("boissons");
    const pizzas =  await fetch("pizzas");
    res.render("homepage",{ menus , entrees, boissons, pizzas });
});

router.get('/connexion.ejs',(req,res)=>{
    res.render('connexion');
});

router.get('/contact.ejs',(req,res)=>{
    res.render("contact");
});

router.get('/la_carte.ejs',async (req,res)=>{
    const menus = await fetch("menus");
    res.render("la_carte",{menus});
});

module.exports = router;