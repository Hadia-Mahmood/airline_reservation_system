require('dotenv').config()
const mysql=require('mysql');
//creating connection with mysql
var connection=mysql.createConnection({
    host:process.env.HOST,
    database:process.env.DATABASE,
    user:process.env.USER,
    password:process.env.PASSWORD,
    multipleStatements: true,
    insecureAuth : true 
    
})



module.exports = connection;