/*app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new pgSession({
        conString: 'postgres://niecimxd:Z_7WlqYTt-v-Tdyg8OPDpTYRN0xlhTRs@ruby.db.elephantsql.com/niecimxd',
      })
}));


passport.use(new LocalStrategy(function verify(email, password, cb) {
    client.get('SELECT id, * FROM users WHERE email = ?', [ email ], function(err, row) {
      if (err) { return cb(err); }
      if (!row) { return cb(null, false, { message: 'Incorrect username or password.' }); }
  
      crypto.pbkdf2(password, row.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
        if (err) { return cb(err); }
        if (!crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
          return cb(null, false, { message: 'Incorrect username or password.' });
        }
        return cb(null, row);
      });
    });
  }));


//PASSPORT
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.email });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

  //AUTHENTIFICATION
 /*app.post('/register' , async (req,res)=>{
    
}); 

app.post('/login',async (req,res)=>{
    const { email, password } = req.body;
    try{
        console.log("rentre");
        const  data  =  await client.query(`SELECT * FROM users WHERE email= $1;`, [email]); //Checking if user already exists
        const  arr  =  data.rows;
        if (arr.length  ==  0) {
            return  res.status(400).json({
            error: "User is not registered yet, signup first.",
            });
        } else {
            console.log("bcrypt");

            bcrypt.compare(password, arr[0].password, (err, result) => {
                if (err){
                    res.status(err).json({error: "Server error"});
                }else if(result===true){
                    const  token  = jwt.sign(
                        {email:email},
                        process.env.SECRET_KEY
                    );
                    res.status(200).json({
                        message: "User signed in!",
                        token: token,
                    });
                }else{
                    if(result!= true){
                        res.status(400).json({
                            error: "Enter correct password!",
                        });
                    }
                }
            });
            console.log("bcrypt fini");
        }
    }catch(err){
        console.log(err);
        res.status(500).json({
            error: "database error for signin in user"
        });
    }

})*/



/*
app.post('/register',async (req,res)=>{

    var salt = crypto.randomBytes(16);

    const {name,email,phonenumber,password,role} = req.body;

    crypto.pbkdf2(password, salt, 310000, 32, 'sha256', (err, hash) => {
        if (err)
            res.status(err).json({error: "Server error"});
        const  user  = {
            name,
            email,
            phonenumber,
            password: hash,
            role
        };
        //Inserting data into the database

        client
        .query(`INSERT INTO users (name, email, phonenumber, password,role) VALUES ($1,$2,$3,$4,$5);`, [user.name, user.email, user.phonenumber, user.password,user.role], (err) => {
            console.log("query insert");
            if (err) {
                console.error(err);
                return res.status(500).json({error: "Database error"})
            } else {
                req.flash('success','User created.');
                var user = {
                    id: this.lastID,
                    email: req.body.email
                };
                req.login(user, function(err) {
                if (err) { return next(err); }
                res.redirect('/');
                });
            }
        });
    });         

})

app.post('login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/register'
}));
*/