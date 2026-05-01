'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('services', {
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
                allowNull: false,
            },
            iconUrl: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: 'URL for the service icon/image',
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
        await queryInterface.dropTable('services');
    },
};
