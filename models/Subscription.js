'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Subscription extends Model {
        static associate(models) {
            Subscription.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
            Subscription.belongsTo(models.Plan, { foreignKey: 'planId', as: 'plan' });
        }
    }

    Subscription.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        planId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('active', 'expired', 'cancelled'),
            defaultValue: 'active',
        },
        paymentId: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Razorpay payment_id or manual reference',
        },
        orderId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        signature: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Amount paid in paise',
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        expiryDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'Subscription',
        tableName: 'subscriptions',
        timestamps: true,
    });

    return Subscription;
};
