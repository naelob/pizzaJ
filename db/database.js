const {Client} = require('pg');

require('dotenv').config();

const client = new Client(process.env.DB_URL);

module.exports = client;
    /*async query(t,p){
        try{
            const res = await client.query(t,p);
            return res;
        }catch(error){
            console.log("error in query");
            throw error;
        }
    }*/
