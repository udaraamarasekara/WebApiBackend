const express = require('express');
const axios = require('axios');
var mysql = require('mysql');

const app = express();
const basicAuth = require('basic-auth')
var cors = require('cors')
app.use(cors())


currentData = [];




const user = "backenduser";
const pass = "backendpass";
const encodedCredentials = Buffer.from(`${user}:${pass}`).toString('base64');


const USERNAME = "frontenduser";
const PASSWORD = "frontendpass";
const auth = (req, res, next) => {
  const credentials = basicAuth(req);
   if (!credentials || credentials.name !== USERNAME || credentials.pass !== PASSWORD) {
    res.set('WWW-Authenticate', 'Basic realm="Authorization Required"');
      return res.status(401).send('Unauthorized');
  }

  return next();
};
app.use(auth);

const api = axios.create({
     baseURL: `https://web-api-data-generator-666d4a95c768.herokuapp.com/`,
    // baseURL:`http://localhost:3000/`,
    headers:{
      'X-Requested-With':'XMLHttpRequest',
      'Accept':'Application/json',
      'Authorization': `Basic ${encodedCredentials}`,
      'Content-Type': 'application/json'

    },
    withCredentials: true,
  });

  
  
async function executeFunctionOncePerDay() {

    var con =  await mysql.createConnection({
      host: "us-cluster-east-01.k8s.cleardb.net",
      user: "bb3f70534e7af5",
      password: "74ab675c",
      database: "heroku_4b0f42ef002fea1"
  
    }); 
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 10);
     con.connect(async function (err) {
      if (err) throw err;
        await currentData.forEach((tmpObj) => {
         for (const [key, value] of Object.entries(tmpObj)) {
           if (key !== 'district') {
             var sql = `INSERT INTO dailyweather (amount, district, time, weatherCondition) VALUES (${value}, '${tmpObj.district}', '${formattedDate}', '${key}')`;
             con.query(sql, function (err, result) {
               if (err) throw err;
               console.log("1 record inserted");
             });
           }
         }
      });
    });
 
  }

  function findMaxValue(array, condition) {
    // Use map() to extract the values of the specified property based on condition

        let maxObject = null;
        let maxValue = Number.NEGATIVE_INFINITY;
      
        for (const obj of array) {
          if (obj['amount'] > maxValue && obj['weatherCondition'] == condition) {
            maxValue= obj['amount']
            maxObject = obj;
          }
        }
      
        return maxObject;

  }
  function findMinValue(array, condition) {
    // Use map() to extract the values of the specified property based on condition

        let minObject = null;
        let minValue = Number.POSITIVE_INFINITY;
      
        for (const obj of array) {
         if( obj['weatherCondition'] == condition) 
          {          
          if (obj['amount'] < minValue) {
              minObject = obj;
              minValue= obj['amount']
            }
          }
        }

      
        return minObject;

  }
  queryDataArray=[];


  async function queryData() {

    var con =  await mysql.createConnection({
      host: "us-cluster-east-01.k8s.cleardb.net",
      user: "bb3f70534e7af5",
      password: "74ab675c",
      database: "heroku_4b0f42ef002fea1"
  
    }); 
    const currentDate = new Date().toISOString().slice(0, 10);
   await  con.connect(async function (err) {
      if (err) throw err;
        
             var sql = `SELECT * FROM dailyweather WHERE DATE(time)=DATE('${currentDate}') `;
             await con.query(sql,async function (err, result) {
               if (err) throw err;
                maxTmpOfDay =  await findMaxValue(result,'temperatureMax');
                maxHumidityOfDay = await findMaxValue(result,'humidityMax');
                maxAirPressureOfDay = await findMaxValue(result,'maxPressure');
                minTmpOfDay = await findMinValue(result,'temperatureMin');
                minHumidityOfDay = await findMinValue(result,'humidityMin');
                minAirPressureOfDay = await findMinValue(result,'minPressure');
            
            queryDataArray.push( {
              maxTmpOfDay :maxTmpOfDay,
                maxHumidityOfDay:maxHumidityOfDay ,
                maxAirPressureOfDay :maxAirPressureOfDay,
                minTmpOfDay :minTmpOfDay,
                minHumidityOfDay :minHumidityOfDay,
                minAirPressureOfDay:minAirPressureOfDay
            
            }  );
             
    });
  });
  }

function scheduleNextExecution() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); 

    const timeUntilNextExecution = tomorrow.getTime() - now.getTime();
    setTimeout(() => {
        executeFunctionOncePerDay();
        scheduleNextExecution(); 
    }, timeUntilNextExecution);
}

executeFunctionOncePerDay();
scheduleNextExecution();


function updateCurrnet(data)
{
 if(currentData.length) 
 { data.forEach((obj)=>{
    currentData.forEach((curObj)=>{
        if(obj.district==curObj.district)
        {
          if(obj.temperature < curObj.temperatureMin)
          {
            curObj.temperatureMin = obj.temperature
          }  
          if(obj.temperature > obj.temperatureMax)
          {
            obj.temperatureMax = obj.temperature
          }
          if(obj.humidity < curObj.humidityMin)
          {
            curObj.humidityMin = obj.humidity
          }  
          if(obj.humidity > obj.humidityMax)
          {
            obj.humidityMax = obj.humidity
          }
          if(obj.airPressure < curObj.airPressureMin)
          {
            curObj.airPressureMin = obj.airPressure
          }  
          if(obj.airPressure > obj.airPressureMax)
          {
            obj.airPressureMax = obj.airPressure
          }
        }
    });
   });
  }else{
    data.forEach((obj)=>{
        currentData.push({
           district:obj.district,  
           temperatureMax:obj.temperature,
           temperatureMin:obj.temperature,
           humidityMax:obj.humidity,
           humidityMin:obj.humidity,
           maxPressure:obj.airPressure,
           minPressure:obj.airPressure
          });
        });

  }
}


  app.get('/' ,async(req, res) => {
    const response = await api.get('/');
    updateCurrnet(response.data.globalObj);

    res.send({
         response:response.data
});
});

app.get('/quries' ,async(req, res) => {
   
  
  const response = await queryData();
  res.send({queryDataArray});
});



// app.listen(3001)

app.listen(process.env.PORT || 3001)