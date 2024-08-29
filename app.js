const express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

const app = express();
const basicAuth = require('basic-auth')
var cors = require('cors')
app.use(cors())

 let currentData = [];
const USERNAME = "user";
const PASSWORD = "pass";
const auth = (req, res, next) => {
  const credentials = basicAuth(req);
   if (!credentials || credentials.name !== USERNAME || credentials.pass !== PASSWORD) {
    res.set('WWW-Authenticate', 'Basic realm="Authorization Required"');
      return res.status(401).send('Unauthorized');
  }

  return next();
};
app.use(auth);

async function storeLocationDataInDatabase(dataArray) {

    // var con =  await mysql.createConnection({
    //   host: "us-cluster-east-01.k8s.cleardb.net",
    //   user: "bb3f70534e7af5",
    //   password: "74ab675c",
    //   database: "heroku_4b0f42ef002fea1"
  
    // }); 

    var con =  await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "webapi"
  
    }); 
    try {
      let date_time = new Date();

      // Start a transaction
      await con.beginTransaction();

      // Prepare your statement
      const query = `INSERT INTO traindetails (train, date_time, latitude, longitude) VALUES (?, ?, ?, ?)`;

      // Execute all queries
      const promises = dataArray.map(data => {
          return con.query(query, [data.train, date_time, data.lat, data.lng]);
      });

      // Wait for all queries to complete
      await Promise.all(promises);

      // Commit the transaction
      await con.commit();

      console.log("All records inserted");

  } catch (err) {
      console.error("Error occurred:", err);
      await con.rollback(); // Rollback transaction on error
  } finally {
      await con.end();
      console.log('MySQL connection closed.');
  }
  }

  async function clearDatabase() {

    // var con =  await mysql.createConnection({
    //   host: "us-cluster-east-01.k8s.cleardb.net",
    //   user: "bb3f70534e7af5",
    //   password: "74ab675c",
    //   database: "heroku_4b0f42ef002fea1"
  
    // }); 

    var con =  await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "webapi"
  
    }); 
    try {

      // Start a transaction
      await con.beginTransaction();

      // Prepare your statement
      const query = `DELETE FROM traindetails`;

      // Execute all queries
      const promises = await  con.query(query);
    

      // Wait for all queries to complete

      // Commit the transaction
      await con.commit();

      console.log("All records deleted");

  } catch (err) {
      console.error("Error occurred:", err);
      await con.rollback(); // Rollback transaction on error
  } finally {
      await con.end();
      console.log('MySQL connection closed.');
  }
  }


  function scheduleNextExecution() {
    let now = new Date();
    
    // Add 9 days to the current date
    let nextDay = new Date(now);
    nextDay.setDate(now.getDate() + 9);

    // Calculate the time until the next execution
    const timeUntilNextExecution = nextDay.getTime() - now.getTime();

    setTimeout(() => {
        clearDatabase();
        scheduleNextExecution(); 
    }, timeUntilNextExecution);
}


scheduleNextExecution();



app.post('/trainLocation' ,jsonParser,async(req, res) => {
   storeLocationDataInDatabase(req.body);
   currentData =req.body;
   res.send("done");
});

app.get('/updateCilent' ,async(req, res) => {
  res.send(currentData)
});



app.listen(3000)

// app.listen(process.env.PORT || 3001)