'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('plans', 'adBudget', {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('plans', 'expectedLeads', {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('plans', 'features', {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Array of feature objects',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('plans', 'adBudget');
        await queryInterface.removeColumn('plans', 'expectedLeads');
        await queryInterface.removeColumn('plans', 'features');
    }
};
