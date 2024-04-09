const axios = require('axios');
const CircproUsers = require('../models/CircproUsers');
const AspNetUsers = require('../models/AspNetUsers');
const CircProTranx = require('../models/CircProTransactions');

async function isEmailExist(email) {
  try {
    const user = await AspNetUsers.findOne({ where: { Email: email } });
    return !!user;
  } catch (error) {
    console.error('Error checking email existence:', error);
    throw error;
  }
}

async function postRequest(url, data) {
    try {
      const response = await axios.post(url, data);
      return response.data;
    } catch (error) {
      console.error('Error making POST request:', error);
      throw error;
    }
  }

module.exports = {
    isEmailExist,
    postRequest
  };