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
            comment: 'Price in INR (direct value, not paise)',
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
        adBudget: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        expectedLeads: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        features: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of feature objects',
        },
    }, {
        sequelize,
        modelName: 'Plan',
        tableName: 'plans',
        timestamps: true,
    });

    return Plan;
};
