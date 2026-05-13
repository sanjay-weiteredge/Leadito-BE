const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config/config.json')['development'];

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    logging: console.log
});

async function run() {
    try {
        const queryInterface = sequelize.getQueryInterface();

        console.log('Adding highlightTag to plans...');
        try {
            await queryInterface.addColumn('plans', 'highlightTag', {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: null
            });
        } catch (e) { console.log('highlightTag already exists or error:', e.message); }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
