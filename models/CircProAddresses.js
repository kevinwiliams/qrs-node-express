const { DataTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;

const CircProAddresses = sequelize.define('CircProAddresses', {
    AddressID: {
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
    AddressType: {
        type: DataTypes.STRING(5),
        allowNull: true,
    },
    EmailAddress: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    AddressLine1: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    AddressLine2: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    CityTown: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    StateParish: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    ZipCode: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
    CountryCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    CreatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
    }
}, {
    tableName: 'CircProAddresses',
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

module.exports = CircProAddresses;
