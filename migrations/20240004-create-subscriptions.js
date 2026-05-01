'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('subscriptions', {
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
            planId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'plans', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            status: {
                type: Sequelize.ENUM('active', 'expired', 'cancelled'),
                defaultValue: 'active',
            },
            paymentId: {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'Razorpay payment_id or manual reference',
            },
            orderId: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            signature: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            amount: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'Amount paid in paise',
            },
            startDate: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            expiryDate: {
                type: Sequelize.DATEONLY,
                allowNull: false,
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
        await queryInterface.dropTable('subscriptions');
    },
};
