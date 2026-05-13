'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'leadStatus', {
            type: Sequelize.ENUM('New Lead', 'Call Not Answered', 'Interested', 'Not Interested', 'Follow-Up', 'Appointment Booked', 'Payment Pending', 'Closed'),
            defaultValue: 'New Lead',
            allowNull: true
        });

        await queryInterface.addColumn('users', 'nextFollowUpDate', {
            type: Sequelize.DATEONLY,
            allowNull: true
        });

        await queryInterface.addColumn('users', 'adminNotes', {
            type: Sequelize.TEXT,
            allowNull: true
        });

        await queryInterface.addColumn('users', 'lastActivity', {
            type: Sequelize.DATE,
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'leadStatus');
        await queryInterface.removeColumn('users', 'nextFollowUpDate');
        await queryInterface.removeColumn('users', 'adminNotes');
        await queryInterface.removeColumn('users', 'lastActivity');
        // Note: ENUM might need special handling to remove if DB is Postgres
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_leadStatus";');
    }
};
