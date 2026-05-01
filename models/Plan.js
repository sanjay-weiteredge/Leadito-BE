'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Plan extends Model {
        static associate(models) {
            Plan.hasMany(models.Subscription, { foreignKey: 'planId', as: 'subscriptions' });
        }
    }

    Plan.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Price in paise (INR × 100)',
        },
        durationDays: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 30,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    }, {
        sequelize,
        modelName: 'Plan',
        tableName: 'plans',
        timestamps: true,
    });

    return Plan;
};
