'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Lead extends Model {
        static associate(models) {
            Lead.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
            Lead.hasMany(models.LeadNote, { foreignKey: 'leadId', as: 'notes' });
        }
    }

    Lead.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
        source: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'e.g. Facebook, Instagram, Walk-in',
        },
        status: {
            type: DataTypes.ENUM('new', 'not_answered', 'interested', 'not_interested', 'follow_up', 'appointment_booked', 'closed'),
            defaultValue: 'new',
        },
        followUpDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'Lead',
        tableName: 'leads',
        timestamps: true,
    });

    return Lead;
};
