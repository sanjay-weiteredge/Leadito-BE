'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('notifications', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            type: {
                type: Sequelize.STRING,
                defaultValue: 'general',
            },
            isRead: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            metadata: {
                type: Sequelize.JSON,
                allowNull: true,
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
        await queryInterface.dropTable('notifications');
    },
};
