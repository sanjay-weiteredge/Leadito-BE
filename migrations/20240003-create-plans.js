'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('plans', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            price: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'Price in paise (INR × 100)',
            },
            durationDays: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 30,
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
        await queryInterface.dropTable('plans');
    },
};
