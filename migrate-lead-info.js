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

        console.log('Adding leadStatus...');
        try {
            await queryInterface.addColumn('users', 'leadStatus', {
                type: DataTypes.ENUM('New Lead', 'Call Not Answered', 'Interested', 'Not Interested', 'Follow-Up', 'Appointment Booked', 'Payment Pending', 'Closed'),
                defaultValue: 'New Lead',
                allowNull: true
            });
        } catch (e) { console.log('leadStatus already exists or error:', e.message); }

        console.log('Adding nextFollowUpDate...');
        try {
            await queryInterface.addColumn('users', 'nextFollowUpDate', {
                type: DataTypes.DATEONLY,
                allowNull: true
            });
        } catch (e) { console.log('nextFollowUpDate already exists or error:', e.message); }

        console.log('Adding adminNotes...');
        try {
            await queryInterface.addColumn('users', 'adminNotes', {
                type: DataTypes.TEXT,
                allowNull: true
            });
        } catch (e) { console.log('adminNotes already exists or error:', e.message); }

        console.log('Adding lastActivity...');
        try {
            await queryInterface.addColumn('users', 'lastActivity', {
                type: DataTypes.DATE,
                allowNull: true
            });
        } catch (e) { console.log('lastActivity already exists or error:', e.message); }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
