'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Video extends Model {
        static associate(models) {
            // Associations if any
        }
    }

    Video.init({
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
            allowNull: true,
        },
        videoUrl: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'URL of the video file (e.g. S3 link)',
        },
        thumbnailUrl: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'URL of the thumbnail image',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        }
    }, {
        sequelize,
        modelName: 'Video',
        tableName: 'videos',
        timestamps: true,
    });

    return Video;
};
