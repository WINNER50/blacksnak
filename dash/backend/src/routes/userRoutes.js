// =============================================
// User Routes
// =============================================

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /api/users - Liste des utilisateurs
router.get('/', authorize('super_admin', 'admin', 'moderator'), userController.getAllUsers);

// GET /api/users/:id - Détails d'un utilisateur
router.get('/:id', authorize('super_admin', 'admin', 'moderator'), userController.getUserById);

// PUT /api/users/:id - Modifier un utilisateur
router.put('/:id', authorize('super_admin', 'admin'), userController.updateUser);

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete('/:id', authorize('super_admin'), userController.deleteUser);

// PUT /api/users/:id/status - Changer le statut
router.put('/:id/status', authorize('super_admin', 'admin'), userController.updateUserStatus);

// GET /api/users/:id/stats - Statistiques d'un utilisateur
router.get('/:id/stats', authorize('super_admin', 'admin', 'moderator'), userController.getUserStats);

module.exports = router;
