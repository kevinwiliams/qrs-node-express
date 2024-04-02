const { DataTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;

const QRSActivityLogs = sequelize.define('QRSActivityLogs', {
    ActivityLogID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    AccountID: {
      type: DataTypes.STRING, // Change the data type according to your database schema
      allowNull: true
    },
    IPAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    LogInformation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    SystemInformation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    UserName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    EmailAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    PublicationDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    ReturnAmount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    Status: {
      type: DataTypes.STRING(10), // Adjust the length according to your database schema
      allowNull: true
    },
    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    DistributionAmount: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'QRSActivityLogs',
    timestamps: false,
});

// Sync the model with the database
sequelize.sync()
    .then(() => {
        console.log('Database synchronized');
    })
    .catch(err => {
        console.error('Error synchronizing database:', err);
    });

module.exports = QRSActivityLogs;
