'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('lead_notes', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            leadId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'leads', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            note: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('lead_notes');
    },
};
