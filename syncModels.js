const sequelize = require('./config/database');
const Wallet = require('./entities/Wallet');
const Transaction = require('./entities/Transaction');

async function syncentities() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida.');

    // Sincronizar todos los modelos
    await sequelize.sync({ force: false }); // IMPORTANTE: force: true borra todos los datos
    console.log('✅ Todos los modelos fueron sincronizados exitosamente.');
    
    console.log('\n📊 Estructura de la base de datos:');
    console.log('   - Tabla wallets ✓');
    console.log('   - Tabla transactions ✓');
  } catch (error) {
    console.error('❌ Error al sincronizar modelos:', error);
  } finally {
    await sequelize.close();
  }
}

syncentities();
