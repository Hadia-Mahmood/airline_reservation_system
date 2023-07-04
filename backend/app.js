
const express = require("express");
const bodyParser =require("body-parser");
const path = require('path');
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const cookieParser = require("cookie-parser");

const { createTokens , validateToken} = require("./JWT");



var connection =require('./database');
const app = express();

// for  templating  we will use ejs  and all ejs files will be in 
// view folder
app.set('view engine' , 'ejs');

// we will clean cache so that user can not go to restricted pages from back button 
app.use(function(req,res,next){

    res.set('Cache-Control','no-cache,private,must-revalidate,no-store');
    next();
    
 }); 



// we will use body parser to pass our request in the form of forms 
app.use(bodyParser.urlencoded({
    extended: true
}));

const staticPath = path.join(__dirname,"../frontend");


// to store all our static files like css , images ,audios etc we will use public folder
app.use(express.static(staticPath));

app.use(cookieParser());

// ////////////////////////////////ROUTES///////////////////////////////////////////////////////


app.get("/",function(req,res){
    res.sendFile(staticPath+'/index.html');
 });


app.get("/aboutus",function(req,res){
    res.sendFile(staticPath+'/aboutus.html');
 });



app.get("/flights",function(req,res){
    res.sendFile(staticPath+'/flights_available.html');
 });


app.get("/register",function(req,res){
    res.sendFile(staticPath+'/account.html');
 });

//  this page will only be available if user is authenticated ///
app.get("/adminpage", validateToken ,function(req,res){
    res.sendFile(staticPath+'/admin.html');
 });

//  this page will only be available if user is authenticated ///
app.get("/customerpage", validateToken ,function(req,res){
    res.sendFile(staticPath+'/customer.html');
 }); 

//  this page will only be available if user is authenticated ///
app.get("/bookingpage", validateToken ,function(req,res){
    res.sendFile(staticPath+'/booking.html');
 }); 


///////////////////////////////////////// admin sign in///////////////////////////////////////
app.post("/adminsignin",function(req,res){
    //getting data from frontend//
    var adminEmail=String(req.body.email);
    var adminPassword=String(req.body.password);
    console.log(adminEmail,adminPassword);

    //getting data from database
    var sql="select a.email, a.password from user_info a inner join user  b on  b.email=a.email where b.ID=(SELECT Admin_id FROM admin)";
    

    // checking database and frontend data
    connection.query(sql,function(error,result){
        if (error) {console.log(error);}
        else{
            //we are using result[0]because we know that our database 
            // has only 1 admin  and we know our query will return with only 1 result
            if (result[0].email === adminEmail && result[0].password === adminPassword){
                console.log (result);
                console.log('congragulations');
                //  creating cookie 
                const accessToken = createTokens(result[0]);
                // STORE THIS COOKIE IN USERS BROWSER 
                res.cookie("access-token", accessToken, {
                        // EXPIRATION OF THIS COOKIE IN MILI SECONDS = 1 DAY EXPIRATION TIME 
                         maxAge: 60 * 60 * 24 * 1 * 1000,
                        //  to secure cookies even more set http to true  that will not allow anyone to access it using dom from browser
                         httpOnly: true, 
                            });
              // change this to render to route////////////////////////////////
                res.redirect('/adminpage');
                
            }
            else{
                console.log('not a match');
                res.redirect('/');
                
            };
        }
       
    });
});




//////////////////////////////////////// customer register///////////////////

app.post("/register",function(req,res){

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        //getting data from form//
    var Firstname=req.body.Firstname;
    var Lastname=req.body.Lastname;
    var email=req.body.email;
    var password=hash;

    var sql = "INSERT INTO user_info(email,password) VALUES('"+email+"','"+password+"'); INSERT INTO user(email) VALUES('"+email+"'); INSERT INTO  customer(customer_id,first_name,last_name) VALUES((SELECT ID FROM user WHERE email='"+email+"'),'"+Firstname+"','"+Lastname+"') ";

    // inserting form data into database //
    connection.query(sql,function(error,results, fields){
        if (error) {
            console.log(error);
            res.redirect('/register');
        }
        else{
                res.redirect('/customerpage');
                console.log(results[0]); 
                console.log(results[1]); 
                console.log(results[2]);
        }
       
    });
        
    });
    
});


/////////////////////////////////////////// CUSTOMER LOGIN ///////////////////////////////////////////////////
app.post("/customerLogin",function(req,res){
    //getting data from form//
    var customerEmail=String(req.body.email);
    var customerPassword=String(req.body.password);
    console.log(customerEmail,customerPassword);

    //getting data from database
    var sql="SELECT * FROM user_info WHERE email = '"+customerEmail+"' ";
    

    // checking database and frontend email
    connection.query(sql,function(error,result){
        if (error) {console.log(error);}
        else{
            //    no email found
            if (result.length === 0 ){
                console.log('not a match');
                res.redirect('/');
            }
            // email found
            else{
                //check password
                bcrypt.compare(customerPassword,result[0].password).then(isMatch=>{
                        //   if  passwords not match
                          if(isMatch===false){
                            console.log('not a match');
                            res.redirect('/');
                            }

                            // passwords match
                            else{
                
                                     console.log (result);
                                    //  creating cookie 
                                     const accessToken = createTokens(result[0]);
                                        // STORE THIS COOKIE IN USERS BROWSER 
                                     res.cookie("access-token", accessToken, {
                                                // EXPIRATION OF THIS COOKIE IN MILI SECONDS = 30 DAYS EXPIRATION TIME 
                                                 maxAge: 60 * 60 * 24 * 30 * 1000,
                                                 httpOnly: true, 
                                                    });
                                      
                                     res.redirect('/customerpage');
                                            };  
                        })


                
            };
        }
       
    });
});


// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ////////////////// admin and customer  logout route  //////////////////////

app.post('/logout', (req, res) => {
  res.clearCookie('access-token');
  res.redirect('/'); // Redirect to the home page
});


connection.connect(function(err){
    if(err)
         throw(err);
    console.log("connection successfull....");
});



app.listen(3000, function(){
    console.log("server started on port 3000")

});