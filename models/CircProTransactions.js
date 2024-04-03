const { DataTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;
const Sequelize = require('sequelize');

// Override timezone formatting for MSSQL
Sequelize.DATE.prototype._stringify = function _stringify(date, options) {
  return this._applyTimezone(date, options).format('YYYY-MM-DD HH:mm:ss.SSS');
};

const CircProTranx = sequelize.define('CircProTransactions', {
    CircProTranxID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    UserID: {
        type: DataTypes.STRING(128),
        allowNull: true,
    },
    AccountID: {
        type: DataTypes.STRING(128),
        allowNull: true,
    },
    EmailAddress: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    DistributionTypeID: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    PublicationDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    DistributionAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    ReturnDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    ReturnAmount: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    ConfirmDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    ConfirmedAmount: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    ConfirmReturn: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    Status: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
    CreatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    UpdatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    },
    IsDisputed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    }
}, {
    tableName: 'CircProTransactions',
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
    
module.exports = CircProTranx;
