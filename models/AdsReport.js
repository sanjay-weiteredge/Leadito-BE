'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AdsReport extends Model {
        static associate(models) {
            AdsReport.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
            AdsReport.belongsTo(models.Admin, { foreignKey: 'updatedByAdmin', as: 'admin' });
        }
    }

    AdsReport.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        updatedByAdmin: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        platform: {
            type: DataTypes.ENUM('facebook', 'instagram', 'google', 'all', 'meta'),
            defaultValue: 'meta',
        },
        reportType: {
            type: DataTypes.ENUM('monthly', 'weekly'),
            defaultValue: 'monthly',
        },
        month: {
            type: DataTypes.STRING(7),
            allowNull: false,
            comment: 'Format: YYYY-MM e.g. 2024-04',
        },
        weekNumber: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '1-52',
        },
        adBudget: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        amountSpent: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        leads: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        costPerLead: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        closedDeals: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        revenue: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        roi: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        closedRatio: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Conversion percentage (Closed Deals / Leads * 100)',
        },
        notes: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of strings for the "Notes & Updates" section',
        },
        campaignStatus: {
            type: DataTypes.ENUM('active', 'published', 'issue', 'budget_low', 'paused'),
            allowNull: true,
            defaultValue: null,
        },
        paymentStatus: {
            type: DataTypes.ENUM('pending', 'paid', 'overdue'),
            allowNull: true,
            defaultValue: 'pending',
        },
        status: {
            type: DataTypes.ENUM('draft', 'published'),
            defaultValue: 'draft',
        },
    }, {
        sequelize,
        modelName: 'AdsReport',
        tableName: 'ads_reports',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'month', 'platform', 'reportType', 'weekNumber'],
                name: 'unique_user_report',
            },
        ],
    });

    return AdsReport;
};
