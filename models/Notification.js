'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Notification extends Model {
        static associate(models) {
            Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        }
    }

    Notification.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING, // e.g. 'lead_created', 'status_changed', 'new_report'
            defaultValue: 'general',
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
        }
    }, {
        sequelize,
        modelName: 'Notification',
        tableName: 'notifications',
        timestamps: true,
    });

    return Notification;
};
