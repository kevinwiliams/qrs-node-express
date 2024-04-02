const { DataTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;

const AspNetRoles = sequelize.define('AspNetRoles', {
    Id: {
        type: DataTypes.STRING(128),
        primaryKey: true,
    },
    Name: {
        type: DataTypes.STRING(256),
        allowNull: false,
    }
}, {
    tableName: 'AspNetRoles',
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

module.exports = AspNetRoles;
