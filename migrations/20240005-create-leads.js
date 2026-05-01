'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('leads', {
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
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            phone: {
                type: Sequelize.STRING(15),
                allowNull: true,
            },
            source: {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'e.g. Facebook, Instagram, Walk-in',
            },
            status: {
                type: Sequelize.ENUM('new', 'not_answered', 'interested', 'not_interested', 'follow_up', 'appointment_booked', 'closed'),
                defaultValue: 'new',
            },
            followUpDate: {
                type: Sequelize.DATEONLY,
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
        await queryInterface.dropTable('leads');
    },
};
