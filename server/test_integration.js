const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('🚀 Iniciando pruebas de integración...\n');

  // 1. Login
  console.log('1️⃣  Probando Login...');
  let token;
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' })
    });
    const data = await response.json();
    
    if (response.ok && data.success) {
      token = data.token;
      console.log('✅ Login exitoso. Token recibido.');
    } else {
      console.error('❌ Login fallido:', data);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error de conexión en Login:', error.message);
    process.exit(1);
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 2. Search Clients
  console.log('\n2️⃣  Probando Búsqueda de Clientes...');
  try {
    const response = await fetch(`${BASE_URL}/clients?query=Juan`, { headers });
    const data = await response.json();
    if (response.ok && data.success) {
      console.log(`✅ Clientes encontrados: ${data.data.length}`);
      console.log('   Primer cliente:', data.data[0].displayname);
    } else {
      console.error('❌ Búsqueda fallida:', data);
    }
  } catch (error) {
    console.error('❌ Error en búsqueda:', error.message);
  }

  // 3. Get Loan Details
  console.log('\n3️⃣  Probando Detalle de Préstamo...');
  try {
    const response = await fetch(`${BASE_URL}/loans/100`, { headers });
    const data = await response.json();
    if (response.ok && data.success) {
      console.log('✅ Detalle de préstamo recibido.');
      console.log(`   ID: ${data.data.id}, Producto: ${data.data.loanProductName}`);
      console.log(`   Principal: ${data.data.principal}`);
    } else {
      console.error('❌ Detalle de préstamo fallido:', data);
    }
  } catch (error) {
    console.error('❌ Error en detalle de préstamo:', error.message);
  }

  // 4. Make Repayment
  console.log('\n4️⃣  Probando Realizar Pago...');
  try {
    const payload = {
      transactionDate: '2025-12-03',
      transactionAmount: 150.00,
      note: 'Pago de prueba'
    };
    const response = await fetch(`${BASE_URL}/loans/100/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (response.ok && data.success) {
      console.log('✅ Pago registrado exitosamente.');
      console.log(`   Resource ID: ${data.data.resourceId}`);
    } else {
      console.error('❌ Pago fallido:', data);
    }
  } catch (error) {
    console.error('❌ Error en pago:', error.message);
  }

  // 5. Reverse Transaction
  console.log('\n5️⃣  Probando Reversión de Pago...');
  try {
    const payload = { loanId: 100 };
    const trxId = 999;
    const response = await fetch(`${BASE_URL}/transactions/${trxId}/reverse`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (response.ok && data.success) {
      console.log('✅ Reversión exitosa.');
      console.log(`   Status: ${data.data.status}`);
    } else {
      console.error('❌ Reversión fallida:', data);
    }
  } catch (error) {
    console.error('❌ Error en reversión:', error.message);
  }

  console.log('\n🏁 Pruebas finalizadas.');
}

// Wait for server to start (simple delay)
setTimeout(runTests, 3000);
