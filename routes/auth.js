const express = require('express');
const router = express.Router();

const {register_client,login_client} = require("../controllers/client");

router.post('/register',register_client); 

router.post('/login',login_client); 

module.exports = router;