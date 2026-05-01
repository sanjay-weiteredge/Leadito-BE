'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('testimonials', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            role: {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'e.g. Boutique Owner or Company Name',
            },
            feedback: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            avatarUrl: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: 'URL of the client profile picture',
            },
            rating: {
                type: Sequelize.DECIMAL(2, 1),
                defaultValue: 5.0,
            },
            socialIcon: {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'e.g. twitter, facebook, linkedin',
            },
            isActive: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },
            order: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
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
        await queryInterface.dropTable('testimonials');
    },
};
