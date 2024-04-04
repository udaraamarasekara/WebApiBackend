const express = require('express');
const axios = require('axios');
const cors = require('cors');
var mysql = require('mysql');

const app = express();

const api = axios.create({
     baseURL: `https://web-api-data-generator-666d4a95c768.herokuapp.com/`,
    headers:{
      'X-Requested-With':'XMLHttpRequest',
      'Accept':'Applicarion/json'
    },
    withCredentials: true,
  });


app.get('/', async(req, res) => {
    // const response = await api.get('/');
    // console.log(response)
    res.send({
        response:'response.data'
});
});



app.listen(process.env.PORT || 3001)