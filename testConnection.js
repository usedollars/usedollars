const sequelize = require('./config/database');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa a PostgreSQL!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n💡 Solución:');
    console.log('1. Verifica que PostgreSQL esté ejecutándose');
    console.log('2. Revisa usuario/contraseña en config/database.js');
    console.log('3. Asegúrate de que la base de datos "usedollars" existe');
    process.exit(1);
  }
}

test();
