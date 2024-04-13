const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;

const CircproUsers = sequelize.define('CircproUsers', {
    UserID: {
        type: DataTypes.STRING(128),
        primaryKey: true,
    },
    Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
    },
    AccountID: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
    DistributionID: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    EmailAddress: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    FirstName: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    LastName: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    Company: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    PhoneNumber: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    CellNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    IpAddress: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    IsActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
    },
    AddressID: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    CreatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    LastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    NotifyEmail: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
    }
}, {
    tableName: 'CircproUsers',
    timestamps: false,
    modelName: 'CircproUsers'
});

// Define association with CircProAddress
CircproUsers.associate = function(models) {
    CircproUsers.hasMany(models.CircProAddresses, {
        foreignKey: 'UserID', // Assuming UserID is the foreign key in CircProAddress
        as: 'RetailerAddress' // Alias for the association
    });
};

// Sync the model with the database
sequelize.sync()
    .then(() => {
        console.log('Database synchronized');
    })
    .catch(err => {
        console.error('Error synchronizing database:', err);
    });
    
module.exports = CircproUsers;
