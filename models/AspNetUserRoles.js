const { DataTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;

const AspNetUserRoles = sequelize.define('AspNetUserRoles', {
    UserId: {
        type: DataTypes.STRING(128),
        primaryKey: true,
    },
    RoleId: {
        type: DataTypes.STRING(128),
        primaryKey: true,
    }
}, {
    tableName: 'AspNetUserRoles',
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
    
module.exports = AspNetUserRoles;
