'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Add proofUrl column
        await queryInterface.addColumn('subscriptions', 'proofUrl', {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'URL of the payment proof screenshot'
        });

        // 2. Add 'pending' to the status ENUM
        // Note: PostgreSQL doesn't support adding a value to an ENUM inside a transaction easily.
        // However, we can use ALTER TYPE.
        await queryInterface.sequelize.query('ALTER TYPE "enum_subscriptions_status" ADD VALUE IF NOT EXISTS \'pending\'');
    },

    down: async (queryInterface, Sequelize) => {
        // 1. Remove proofUrl column
        await queryInterface.removeColumn('subscriptions', 'proofUrl');

        // 2. ENUM values are hard to remove in Postgres migrations without recreating the type.
        // For safety in this environment, we'll leave the enum value but removing the column is usually enough.
    }
};
