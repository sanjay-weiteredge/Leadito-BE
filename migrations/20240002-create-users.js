'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('users', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            phone: {
                type: Sequelize.STRING(15),
                allowNull: false,
                unique: true,
            },
            businessName: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            businessType: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            businessAddress: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            city: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            state: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            logoUrl: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            isOnboarded: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            isActive: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                comment: 'Set to true by admin after payment',
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
        await queryInterface.dropTable('users');
    },
};
