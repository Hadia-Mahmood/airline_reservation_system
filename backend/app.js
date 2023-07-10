
const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const cookieParser = require("cookie-parser");
var router = express.Router();
const { createTokens, validateToken } = require("./JWT");



var connection = require('./database');
const app = express();

// for  templating  we will use ejs  and all ejs files will be in 
// view folder
app.set('view engine', 'ejs');

// we will clean cache so that user can not go to restricted pages from back button 
app.use(function (req, res, next) {

    res.set('Cache-Control', 'no-cache,private,must-revalidate,no-store');
    next();

});



// we will use body parser to pass our request in the form of forms 
app.use(bodyParser.urlencoded({
    extended: true
}));

const staticPath = path.join(__dirname, "../frontend");
const viewPath = path.join(__dirname,"../views")



// to store all our static files like css , images ,audios etc we will use public folder
app.use(express.static(staticPath));

app.use(cookieParser());

// ////////////////////////////////ROUTES///////////////////////////////////////////////////////



app.get("/aboutus",function(req,res){
    // res.sendFile(staticPath+'/aboutus.html');
    res.sendFile(staticPath + '/aboutus.html');
 });



app.get("/flights",function(req,res){
    // res.sendFile(staticPath+'/flights_available.html');
    res.sendFile(staticPath + '/flights_available.html');
 });


app.get("/register",function(req,res){
    // res.sendFile(staticPath+'/account.html');
    res.sendFile(staticPath + '/account.html');

 });

//  this page will only be available if user is authenticated ///
app.get("/adminpage", validateToken ,function(req,res){
    // res.sendFile(staticPath+'/admin.html');

    res.render(viewPath + "/admin");
    // ********************************
 });

//  this page will only be available if user is authenticated ///
app.get("/customerpage", validateToken ,function(req,res){
    // res.sendFile(staticPath+'/customer.html');
    res.sendFile(staticPath +'/customer.html');
 }); 

//  this page will only be available if user is authenticated ///
app.get("/bookingpage", validateToken ,function(req,res){
    // res.sendFile(staticPath+'/booking.html');
    res.sendFile(staticPath + '/booking.html');

 }); 


///////////////////////////////////////// admin sign in///////////////////////////////////////
app.post("/adminsignin", function (req, res) {
    //getting data from frontend//
    var adminEmail = String(req.body.email);
    var adminPassword = String(req.body.password);
    console.log(adminEmail, adminPassword);

    //getting data from database
    var sql = "select a.email, a.password from user_info a inner join user  b on  b.email=a.email where b.ID=(SELECT Admin_id FROM admin)";


    // checking database and frontend data
    connection.query(sql, function (error, result) {
        if (error) { console.log(error); }
        else {
            //we are using result[0]because we know that our database 
            // has only 1 admin  and we know our query will return with only 1 result
            if (result[0].email === adminEmail && result[0].password === adminPassword) {
                console.log(result);
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
            else {
                console.log('not a match');
                res.redirect('/');

            };
        }

    });
});

////////////////////////////////////////// suggestions code//////////////////////////////////////////////////////////

//////////////////////////////// Define a route to handle GET requests for fetching data source////////////////////////////////////////
app.get('/get_data', (req, res) => {
    const searchQuery = req.query.search_query;
    const query = "SELECT DISTINCT source FROM flight WHERE source LIKE '%" + searchQuery + "%' LIMIT 10";

    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error executing MySQL query: ' + error.stack);
            res.status(500).json([]);
            return;
        }
        res.json(results);
    });
});

app.get('/get_data2', function (req, res) {
    var search_query = req.query.search_query;
    var query = "SELECT DISTINCT destination FROM flight WHERE destination LIKE '%" + search_query + "%' LIMIT 10";

    connection.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.status(500).send('Error occurred while fetching data.');
        } else {
            res.json(results);
        }
    });
});


module.exports = router;


// Execute the query for trending flights
app.get("/", function (req, res) {
    connection.query(
      `SELECT f.flight_id, f.destination, f.date, f.departure_time, c.price, c.discount
       FROM flight AS f
       JOIN class AS c ON f.flight_id = c.flight_id
       WHERE c.discount > 0;`,
      (error, results) => {
        if (error) {
          console.error('Error executing query:', error);
          console.log(results);
          res.render(viewPath + "/index", { flights: [] }); // Pass an empty array if an error occurs
          return;
        }
        console.log("result")
        console.log(results);
        res.render(viewPath + "/index", { flights: results }); // Pass the results to the EJS template for rendering
      }
    );
  });
  

//////////////////////////////////////// customer register///////////////////



app.post("/register", function (req, res) {

    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        //getting data from form//
        var Firstname = req.body.Firstname;
        var Lastname = req.body.Lastname;
        var email = req.body.email;
        var password = hash;

        var sql = "INSERT INTO user_info(email,password) VALUES('" + email + "','" + password + "'); INSERT INTO user(email) VALUES('" + email + "'); INSERT INTO  customer(customer_id,first_name,last_name) VALUES((SELECT ID FROM user WHERE email='" + email + "'),'" + Firstname + "','" + Lastname + "') ";

        // inserting form data into database //
        connection.query(sql, function (error, results, fields) {
            if (error) {
                console.log(error);
                res.redirect('/register');
            }
            else {
                res.redirect('/customerpage');
                console.log(results[0]);
                console.log(results[1]);
                console.log(results[2]);
            }

        });

    });

});


/////////////////////////////////////////// CUSTOMER LOGIN ///////////////////////////////////////////////////
app.post("/customerLogin", function (req, res) {
    //getting data from form//
    var customerEmail = String(req.body.email);
    var customerPassword = String(req.body.password);
    console.log(customerEmail, customerPassword);

    //getting data from database
    var sql = "SELECT * FROM user_info WHERE email = '" + customerEmail + "' ";


    // checking database and frontend email
    connection.query(sql, function (error, result) {
        if (error) { console.log(error); }
        else {
            //    no email found
            if (result.length === 0) {
                console.log('not a match');
                // res.redirect('/');
                res.send('error');
            }
            // email found
            else {
                //check password
                bcrypt.compare(customerPassword, result[0].password).then(isMatch => {
                    //   if  passwords not match
                    if (isMatch === false) {
                        console.log('not a match');
                        // res.redirect('/');
                        res.send('error');


                    }

                    // passwords match
                    else {

                        console.log(result);
                        //  creating cookie 
                        const accessToken = createTokens(result[0]);
                        // STORE THIS COOKIE IN USERS BROWSER 
                        res.cookie("access-token", accessToken, {
                            // EXPIRATION OF THIS COOKIE IN MILI SECONDS = 30 DAYS EXPIRATION TIME 
                            maxAge: 60 * 60 * 24 * 30 * 1000,
                            httpOnly: true,
                        });

                        // res.redirect('/customerpage');
                        res.send('success')
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



// admin page :   creating new flights ////////////////////////////

app.post("/createFlight",function(req,res){
    //getting data from form//
    var flightID=req.body.flightID;
    var source=req.body.source;
    var Destination=req.body.Destination;
    var Date=req.body.Date;
    var AirplaneName=req.body.AirplaneName;
    var Terminal=req.body.Terminal;
    
    var Departure=req.body.Departure;
    var Arrival=req.body.Arrival;
    
    var BTotalSeats=req.body.BTotalSeats;
    var BPrice=req.body.BPrice;
    var BDiscount=req.body.BDiscount;


    var ETotalSeats=req.body.ETotalSeats;
    var EPrice=req.body.EPrice;
    var EDiscount=req.body.EDiscount;
    
    
    var sql = "INSERT INTO flight VALUES('"+flightID+"',LOWER('"+source+"'),LOWER('"+Destination+"'),'"+Date+"','"+Departure+"','"+Arrival+"','"+AirplaneName+"','available','"+Terminal+"',(SELECT Admin_id FROM admin));INSERT INTO class VALUES('"+flightID+"','Business','"+BTotalSeats+"','"+BTotalSeats+"','"+BPrice+"','"+BDiscount+"');INSERT INTO class VALUES('"+flightID+"','Economy','"+ETotalSeats+"','"+ETotalSeats+"','"+EPrice+"','"+EDiscount+"')";
    // 
    // inserting form data into database //
    connection.query(sql,function(error,results, fields){
        if (error) {
            console.log(error);
            var error= 'sorry please insert again';
            res.render(viewPath+"/message",{display:error});
        }
        else{
                // var success='congrats new flight created';
                // res.render("message",{display:success});
                res.redirect(viewPath + '/admincrudoperations');
                 
                
        }
       
    });
        
    });



//  ADMIN PAGE : CRUD OPERATIONS 
//  see all flights
app.get('/admincrudoperations',function(req,res){
    var sql = "select f.flight_id,f.source,f.destination,f.date, f.departure_time, f.arrival_time,f.airplane_name,f.status,f.terminal,c.class,c.total_seats,c.seats_left,c.price,c.discount from flight f , class c where f.flight_id=c.flight_id";
    connection.query(sql,function(error,result){
        if (error) {
            console.log(error);
            var error= 'sorry please provide valid info ';
            res.render("message",{display:error});
        }
        else{
            res.render(viewPath+"/admincrudoperations",{flights:result});
                 
                
        }
       
    });
});

//  admin :delete flight
app.get('/delete-flight',function(req,res){
    var id = req.query.id;
    var sql = "update flight set status='cancelled' where flight_id='"+id+"'; delete from class where flight_id='"+id+"'";
    
    connection.query(sql,function(error,result){
        if (error) {
            console.log(error);
            var error= 'sorry please try again';
            res.render(viewPath + "/message",{display:error});
        }
        else{
            res.redirect(viewPath + '/admincrudoperations');
                 
                
        }
       
    });
}); 

// ################ admin : update flight
app.get('/updateflight',function(req,res){
    var sql="select f.flight_id,f.source,f.destination,f.date, f.departure_time, f.arrival_time,f.airplane_name,f.status,f.terminal,c.class,c.total_seats,c.seats_left,c.price,c.discount from flight f , class c where f.flight_id=c.flight_id";
    var id = req.query.id;
    
    
    connection.query(sql,[id],function(error,result){
        if (error) {
            console.log(error);
            var error= 'sorry please try again';
            res.render(viewPath + "/message",{display:error});
        }
        else{
            res.render(viewPath + "/updateflight",{flights:result});
                 
                
        }
       
    });
}); 



app.post("/updateflight",function(req,res){
    //getting data from form//
    var flightID=req.body.flight_id;
    var Date=req.body.Date;
    var AirplaneName=req.body.AirplaneName; 
    var status=req.body.status;
    var Terminal=req.body.Terminal; 
    var Departure=req.body.Departure;
    var Arrival=req.body.Arrival;
    var BPrice=req.body.BPrice;
    var BDiscount=req.body.BDiscount;
    var EPrice=req.body.EPrice;
    var EDiscount=req.body.EDiscount;
    
    
    var sql="UPDATE flight set date=?,airplane_name=?, status=? , terminal=? ,departure_time=? , arrival_time=? where flight_id=? ; UPDATE class set price=? ,discount=? where flight_id=? AND class='Business'; UPDATE class set price=? ,discount=? where flight_id=? AND class='Economy' ";
    
    
    // inserting form data into database //
    connection.query(sql,[Date,AirplaneName,status,Terminal,Departure,Arrival,flightID,BPrice,BDiscount,flightID,EPrice,EDiscount,flightID],function(error){
        if (error) {
            console.log(error);
            var error= 'sorry please insert again';
            res.render(viewPath + "/message",{display:error});
        }
        else{
            res.redirect(viewPath + '/admincrudoperations')
        }
        
    });
        
    });

// ***********************************

connection.connect(function(err){
    if(err)
         throw(err);
    console.log("connection successfull....");
});



app.listen(3000, function(){
    console.log("server started on port 3000")

});
