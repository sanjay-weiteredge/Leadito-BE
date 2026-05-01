'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class LeadNote extends Model {
        static associate(models) {
            LeadNote.belongsTo(models.Lead, { foreignKey: 'leadId', as: 'lead' });
        }
    }

    LeadNote.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        leadId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'LeadNote',
        tableName: 'lead_notes',
        timestamps: true,
        updatedAt: true,
    });

    return LeadNote;
};
