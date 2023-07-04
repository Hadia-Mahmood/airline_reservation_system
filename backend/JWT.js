require('dotenv').config()
// import two main functions sign and verify from jwt library
const { sign, verify } = require("jsonwebtoken");

// a token is just an object  with information whatever information you want  you can put  that information in it 
// function that create token and set that token in users browser 
// we are going to receive a user in our argument  with all of its info that is retrieved from the 
// table then we are going to generate a token  with username  and whatever data you have for that user
//  and a secret that you should convert in env ////////////////////////////////
const createTokens = (user) => {
    // this user is object ` that you get from database that has all the columns info
  const accessToken = sign(
    // user.email is from database 
    { username: user.email},
    // secret //
    process.env.SECRET
  );

  return accessToken;
};


// to verify user has authentication 
// next is funtion that we call when we want to move forward with the request
const validateToken = (req, res, next) => {
    // grabbing token using req from browser 
  const accessToken = req.cookies["access-token"];
//   if user browser has no token  it means he has not logged in 
  if (!accessToken)
    return res.redirect("/");

  try {
    
    // try to verify if token is valid 
    // verify compares browser token with our token 
    const validToken = verify(accessToken, process.env.SECRET);
    if (validToken) {
      req.authenticated = true;
      return next();
    }
  } catch (err) {
    return res.status(400).json({ error: err });
  }
};

module.exports = { createTokens, validateToken };

