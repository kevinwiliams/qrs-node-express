const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('QRS_DB', 'sa', '9Teen8ty5', {
  host: 'localhost',
  dialect: 'mssql',
  dialectOptions: {
    options: {
      trustServerCertificate: true,
      encrypt: false, // If you are connecting to Azure SQL Database, set this to true
    },
  },
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('Connected to MSSQL database');
  } catch (error) {
    console.error('Error connecting to database:', error.message);
  }
}

module.exports = { sequelize, connectDB };
