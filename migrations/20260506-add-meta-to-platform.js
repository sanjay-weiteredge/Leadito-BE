'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Add 'meta' to the enum_ads_reports_platform
        // Postgres requires 'ALTER TYPE' and it cannot be executed within a transaction block in some versions
        try {
            await queryInterface.sequelize.query("ALTER TYPE \"enum_ads_reports_platform\" ADD VALUE IF NOT EXISTS 'meta'");
            // Also migrate existing 'all' (which was the previous Meta label) to 'meta'
            await queryInterface.sequelize.query("UPDATE \"ads_reports\" SET \"platform\" = 'meta' WHERE \"platform\" = 'all'");
        } catch (error) {
            console.log('Error adding meta to enum, it might already exist or the type name is different:', error.message);
        }
    },

    async down(queryInterface, Sequelize) {
        // Removal from ENUM is complex in Postgres (requires dropping and recreating the type)
    }
};
