'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Service extends Model {
        static associate(models) {
        }
    }

    Service.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        iconUrl: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'URL for the service icon/image',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        }
    }, {
        sequelize,
        modelName: 'Service',
        tableName: 'services',
        timestamps: true,
    });

    return Service;
};
