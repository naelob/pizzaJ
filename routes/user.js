const express = require('express');

const router = express.Router();

const {register} = require("../controllers/register");

const {login} = require("../controllers/login");

router.post('/register' , (req,res)=>{
    register
}); 

router.post('/login' , (req,res)=>{
    login
}); 

module.exports = router;