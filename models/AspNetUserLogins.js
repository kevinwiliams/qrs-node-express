const { DataTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;

const AspNetUserLogins = sequelize.define('AspNetUserLogins', {
    LoginProvider: {
        type: DataTypes.STRING(128),
        primaryKey: true,
    },
    ProviderKey: {
        type: DataTypes.STRING(128),
        primaryKey: true,
    },
    UserId: {
        type: DataTypes.STRING(128),
        primaryKey: true,
    }
}, {
    tableName: 'AspNetUserLogins',
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
    
module.exports = AspNetUserLogins;
