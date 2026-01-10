const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('usedollars', 'genesis', '', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false,
  port: 5432
});

module.exports = sequelize;
