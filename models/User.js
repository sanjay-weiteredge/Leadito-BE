'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            User.hasMany(models.Subscription, { foreignKey: 'userId', as: 'subscriptions' });
            User.hasMany(models.Lead, { foreignKey: 'userId', as: 'leads' });
            User.hasMany(models.AdsReport, { foreignKey: 'userId', as: 'adsReports' });
        }
    }

    User.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: { isEmail: true }
        },
        phone: {
            type: DataTypes.STRING(15),
            allowNull: false,
            unique: true,
        },
        businessName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        businessType: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        businessAddress: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        state: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        logoUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isOnboarded: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Set to true by admin after payment',
        },
        leadStatus: {
            type: DataTypes.ENUM('New Lead', 'Call Not Answered', 'Interested', 'Not Interested', 'Follow-Up', 'Appointment Booked', 'Payment Pending', 'Closed'),
            defaultValue: 'New Lead',
        },
        nextFollowUpDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        adminNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        lastActivity: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
    });

    return User;
};
