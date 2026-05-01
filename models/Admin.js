'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Admin extends Model {
        static associate(models) {
            Admin.hasMany(models.AdsReport, { foreignKey: 'updatedByAdmin', as: 'adsReports' });
        }
    }

    Admin.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING(15),
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'Admin',
        tableName: 'admins',
        timestamps: true,
    });

    return Admin;
};
