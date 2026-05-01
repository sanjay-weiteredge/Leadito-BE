'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Testimonial extends Model {
        static associate(models) {
            // Associations if any
        }
    }

    Testimonial.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'e.g. Boutique Owner or Company Name',
        },
        feedback: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        avatarUrl: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'URL of the client profile picture',
        },
        rating: {
            type: DataTypes.DECIMAL(2, 1),
            defaultValue: 5.0,
        },
        socialIcon: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'e.g. twitter, facebook, linkedin',
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
        modelName: 'Testimonial',
        tableName: 'testimonials',
        timestamps: true,
    });

    return Testimonial;
};
