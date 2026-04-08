const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function addAdmin() {
  try {
    // Connexion à la base de données
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'blacksank'
    });

    console.log('✅ Connexion à la base de données réussie');

    // Hash du mot de passe
    const password = 'winner';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Mot de passe hashé:', hashedPassword);

    // Insertion de l'admin
    const [result] = await connection.execute(
      'INSERT INTO admins (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Winner Ngereza', 'winnerngereza4@gmail.com', hashedPassword, 'admin', 'active']
    );

    console.log('✅ Admin ajouté avec succès, ID:', result.insertId);

    await connection.end();
    console.log('✅ Connexion fermée');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addAdmin();
