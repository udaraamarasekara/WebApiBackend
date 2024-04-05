const express = require('express');
const axios = require('axios');
var mysql = require('mysql');

const app = express();

currentData = [];

const user = "backenduser";
const pass = "backendpass";
const encodedCredentials = Buffer.from(`${user}:${pass}`).toString('base64');


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
      database: "mydb"
  
    }); 
    const now = new Date();
    const formattedDate = now.toISOString();
     console.log(currentData)
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





//app.listen(3001)

app.listen(process.env.PORT || 3001)