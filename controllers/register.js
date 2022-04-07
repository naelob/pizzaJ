const bcrypt = require("bcryptjs");

const client = require("./../db/database");

const jwt = require("jsonwebtoken");

exports.register = async(req,res)=>{
    const {name,email,phonenumber,password} = req.body;
    try{
        console.log("rentre");
        const  data  =  await client.query(`SELECT * FROM users WHERE email= $1;`, [email]); //Checking if user already exists
        const  arr  =  data.rows;
        if (arr.length  !=  0) {
            return  res.status(400).json({
            error: "Email already there, No need to register again.",
            });
        } else {
            console.log("bcrypt");

            bcrypt.hash(password, 10, (err, hash) => {
                if (err)
                    res.status(err).json({error: "Server error"});
                const  user  = {
                    name,
                    email,
                    phonenumber,
                    password: hash,
                };
                var flag  =  1; //Declaring a flag

                //Inserting data into the database

                client
                .query(`INSERT INTO users (name, email, phonenumber, password) VALUES ($1,$2,$3,$4);`, [user.name, user.email, user.phonenumber, user.password], (err) => {
                    console.log("query insert");
                    if (err) {
                        flag  =  0; //If user is not inserted is not inserted to database assigning flag as 0/false.
                        console.error(err);
                        return res.status(500).json({error: "Database error"})
                    } else {
                        flag  =  1;
                        res.status(200).send({ message: 'User added to database, not verified' });
                    }
                });
                if (flag) {
                    console.log("insere donc sign");

                    const  token  = jwt.sign( //Signing a jwt token
                    {
                    email: user.email
                    },
                    process.env.SECRET_KEY
                    );
                };
            });

            console.log("bcrypt fini");
        }
    }catch(err){
        console.log(err);
        res.status(500).json({
            error: "database error for registering user"
        });
    }
}