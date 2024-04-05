const { DataTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;

const AspNetUsers = sequelize.define('AspNetUsers', {
    Id: {
      type: DataTypes.STRING(128),
      primaryKey: true,
      allowNull: false,
    },
    Email: {
      type: DataTypes.STRING(256),
      allowNull: true,
    },
    EmailConfirmed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    PasswordHash: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    SecurityStamp: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    PhoneNumber: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    PhoneNumberConfirmed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    TwoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    LockoutEndDateUtc: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    LockoutEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    AccessFailedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    UserName: {
      type: DataTypes.STRING(256),
      allowNull: false,
    },
    FullName: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },
  },{
    timestamps: false // Disable timestamps handling
  });
  
  // Sync the model with the database
sequelize.sync()
.then(() => {
    console.log('Database synchronized');
})
.catch(err => {
    console.error('Error synchronizing database:', err);
});

module.exports = AspNetUsers;