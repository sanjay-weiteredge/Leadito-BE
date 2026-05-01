'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('videos', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            videoUrl: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: 'URL of the video file (e.g. S3 link)',
            },
            thumbnailUrl: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: 'URL of the thumbnail image',
            },
            isActive: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('videos');
    },
};
