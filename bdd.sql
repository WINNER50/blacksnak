-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql-winner55.alwaysdata.net
-- Generation Time: Apr 07, 2026 at 03:20 AM
-- Server version: 10.11.15-MariaDB
-- PHP Version: 8.4.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `winner55_snak`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('super_admin','admin','moderator') NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Administrateurs de la plateforme';

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `name`, `email`, `password_hash`, `role`, `status`, `created_at`, `updated_at`, `last_login`) VALUES
(1, 'Super Admin', 'admin@blacksnack.com', '$2b$10$xXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX', 'super_admin', 'active', '2026-02-25 01:15:28', '2026-02-25 01:15:28', NULL),
(2, 'Winner Ngereza', 'winnerngereza4@gmail.com', '$2b$10$QZKAxGRrOWWL2IXGyifmBO3EwuvKfD/mCnlNLDPUWlOxZcjMVsYHC', 'admin', 'active', '2026-02-28 14:18:57', '2026-03-31 01:52:14', '2026-03-31 01:52:14');

-- --------------------------------------------------------

--
-- Table structure for table `challenges`
--

CREATE TABLE `challenges` (
  `id` int(11) NOT NULL,
  `creator_id` int(11) NOT NULL,
  `opponent_id` int(11) DEFAULT NULL,
  `bet_amount_usd` decimal(10,2) NOT NULL,
  `challenge_type` enum('1v1','best_of_3','time_attack') NOT NULL,
  `status` enum('pending','accepted','in_progress','completed','cancelled','declined') DEFAULT 'pending',
  `winner_id` int(11) DEFAULT NULL,
  `creator_score` int(11) DEFAULT 0,
  `opponent_score` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `accepted_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Défis PvP 1v1';

-- --------------------------------------------------------

--
-- Table structure for table `challenge_participants`
--

CREATE TABLE `challenge_participants` (
  `id` int(11) NOT NULL,
  `challenge_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `score` int(11) DEFAULT 0,
  `is_winner` tinyint(1) DEFAULT 0,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `earnings_history`
--

CREATE TABLE `earnings_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `source` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'USD',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `earnings_history`
--

-- --------------------------------------------------------

-- --------------------------------------------------------

--
-- Table structure for table `game_history`
--

CREATE TABLE `game_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `duration_seconds` int(11) NOT NULL,
  `coins_collected` int(11) DEFAULT 0,
  `apples_eaten` int(11) DEFAULT 0,
  `game_mode` enum('classic','tournament','challenge') NOT NULL,
  `result` enum('win','loss','draw') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_gateways`
--

CREATE TABLE `payment_gateways` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(50) NOT NULL,
  `api_key_public` text DEFAULT NULL,
  `api_key_secret` text DEFAULT NULL,
  `merchant_id` varchar(100) DEFAULT NULL,
  `environment` enum('sandbox','live') DEFAULT 'sandbox',
  `webhook_secret` varchar(255) DEFAULT NULL,
  `webhook_url` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_gateways`
--

INSERT INTO `payment_gateways` (`id`, `name`, `slug`, `api_key_public`, `api_key_secret`, `merchant_id`, `environment`, `webhook_secret`, `webhook_url`, `is_active`, `updated_at`) VALUES
(1, 'PawaPay', 'pawapay', NULL, 'eyJraWQiOiIxIiwiYWxnIjoiRVMyNTYifQ.eyJ0dCI6IkFBVCIsInN1YiI6IjE4ODgzIiwibWF2IjoiMSIsImV4cCI6MjA5MDcxODI0MiwiaWF0IjoxNzc1MDk5MDQyLCJwbSI6IkRBRixQQUYiLCJqdGkiOiI0NGI0MDRkNC1hYzIzLTQ1YmYtODM3MS1kZjI2ZWE0ZWQwMzQifQ.NIFZk4UzLP03Bn7lBTZHApsCzs_BCXmj0d1ixXrdJovoyqkwAgY7mJ6mDUe-C8ssetCOui_H-qoIAWApqw9eBw', NULL, 'sandbox', NULL, 'https://winner55.alwaysdata.net/api/webhooks/pawapay', 0, '2026-04-06 03:39:44'),
(2, 'Shwary', 'shwary', NULL, 'shwary_b96ad5d8-90b5-426c-975f-31fb0af84589', 'eb72099d-0f11-44d3-8a77-da26c5107d1c', 'live', 'https://mean-rabbits-know.loca.lt/api/webhooks/shwary', 'https://winner55.alwaysdata.net', 1, '2026-04-07 00:46:50');

-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `type` enum('cartes_bancaires','mobile_money','maboko_banque') NOT NULL,
  `fee_percentage` decimal(5,2) DEFAULT 0.00,
  `is_enabled` tinyint(1) DEFAULT 1,
  `icon` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Méthodes de paiement supportées';

--
-- Dumping data for table `payment_methods`
--

INSERT INTO `payment_methods` (`id`, `name`, `type`, `fee_percentage`, `is_enabled`, `icon`, `created_at`, `updated_at`) VALUES
(1, 'Cartes Bancaires', 'cartes_bancaires', 2.50, 0, 'CreditCard', '2026-02-25 01:15:27', '2026-03-31 02:39:37'),
(2, 'Mobile Money', 'mobile_money', 1.50, 1, 'Smartphone', '2026-02-25 01:15:27', '2026-03-04 22:48:02'),
(3, 'Maboko (Banque)', 'maboko_banque', 0.00, 0, 'Building2', '2026-02-25 01:15:27', '2026-03-31 02:25:49');

-- --------------------------------------------------------

--
-- Table structure for table `personal_challenges`
--

CREATE TABLE `personal_challenges` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `bet_amount` decimal(10,2) NOT NULL,
  `target_score` int(11) NOT NULL,
  `multiplier` decimal(3,2) DEFAULT 1.00,
  `score` int(11) DEFAULT 0,
  `status` enum('ongoing','won','lost') DEFAULT 'ongoing',
  `earnings` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `personal_challenges`
--

-- --------------------------------------------------------

-- --------------------------------------------------------

--
-- Table structure for table `personal_challenge_templates`
--

CREATE TABLE `personal_challenge_templates` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `entry_fee_usd` decimal(10,2) NOT NULL,
  `prize_usd` decimal(10,2) NOT NULL,
  `target_score` int(11) NOT NULL,
  `time_limit_seconds` int(11) NOT NULL,
  `difficulty` enum('easy','medium','hard','expert') NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `personal_challenge_templates`
--

INSERT INTO `personal_challenge_templates` (`id`, `title`, `description`, `entry_fee_usd`, `prize_usd`, `target_score`, `time_limit_seconds`, `difficulty`, `is_active`, `created_at`) VALUES
(4, 'defi ', 'dddddd', 2.00, 10.00, 20, 50, 'medium', 1, '2026-03-06 05:29:21'),
(5, 'defie', 'ff', 1.00, 5.00, 10, 60, 'medium', 1, '2026-03-06 09:27:26'),
(6, 'defie ', 'vous devrie 15 poin avnt 50seconde', 3.00, 10.00, 15, 35, 'medium', 1, '2026-03-27 12:19:26'),
(7, 'defie enorme ', 'ffffffff', 101.00, 40.00, 10, 15, 'medium', 1, '2026-03-31 17:50:30'),
(8, 'kaka', 'onbjhh', 10.00, 100.00, 20, 60, 'medium', 1, '2026-04-05 14:31:56');

-- --------------------------------------------------------

--
-- Table structure for table `recharge_history`
--

CREATE TABLE `recharge_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount_usd` decimal(10,2) DEFAULT NULL,
  `amount_cdf` decimal(15,2) DEFAULT NULL,
  `currency` enum('USD','CDF') NOT NULL,
  `reason` text NOT NULL,
  `admin_id` int(11) NOT NULL,
  `balance_before_usd` decimal(10,2) DEFAULT NULL,
  `balance_after_usd` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `recharge_history`
--

-- --------------------------------------------------------

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`key`, `value`, `description`, `updated_at`) VALUES
('beginner_guide_content', 'Gemini a dit\nVoici une version corrigée et optimisée du guide pour Blacksnack. J\'ai intégré tes précisions : un seul gagnant unique par tournoi, la suppression du mode 1v1 entre joueurs au profit de Défis Admin avec des conditions spécifiques, et une réorganisation professionnelle.\n\n🐍 BLACKSNACK - Guide Officiel du Joueur\n🌟 Bienvenue dans l\'Univers Blacksnack !\nPrêt à transformer vos réflexes en gains réels ? Blacksnack réinvente le jeu de Snake pour en faire une arène de compétition où seule l\'adresse compte. Pas de hasard, pas de second rang : battez tout le monde et repartez avec la mise.\n\n📖 Table des Matières\n🎮 Présentation & Concept\n\n🕹️ Comment Jouer (Les Bases)\n\n🏆 Mode Tournoi (Gagnant Unique)\n\n⚔️ Défis de l\'Admin (Solo vs Objectifs)\n\n💰 Système de Gains & Vitesses\n\n💳 Portefeuille & Paiements\n\n🎮 Présentation & Concept\nBlacksnack est une plateforme de compétition \"Skill-to-Earn\".\n\nPourquoi choisir Blacksnack ?\nCompétition Pure : Un seul gagnant par tournoi. Le meilleur prend tout.\n\nDéfis Contre la Montre : Relevez les défis de l\'Admin pour prouver votre niveau.\n\nLocal & Rapide : Dépôts et retraits instantanés via M-Pesa, Airtel Money et Orange Money.\n\n🕹️ Comment Jouer (Les Bases)\n1. Contrôles\nTouches Tactiles : Utilisez les flèches directionnelles sous la zone de jeu.\n\nGestes (Swipe) : Glissez votre doigt sur l\'écran pour changer de direction.\n\n2. Les Vitesses & Multiplicateurs\nPlus le jeu est rapide, plus votre talent est récompensé. Modifiez ce paramètre dans Menu > Autres > Vitesse.\n\nMode	Vitesse	Gain	Niveau\n🐌 Lent	200ms	x0.8	Débutant\n🚶 Normal	150ms	x1.0	Standard\n🏃 Rapide	100ms	x1.2	Confirmé\n⚡ Extrême	75ms	x1.5	Expert\n🏆 Mode Tournoi (The Winner Takes It All)\nLocalisation : Menu → Tournois\n\nLe tournoi est l\'arène ultime. Contrairement aux systèmes classiques, il n\'y a qu\'un seul et unique vainqueur.\n\nFonctionnement :\nInscription : Payez les frais d\'entrée (ex: 1 USD ou 2500 CDF).\n\nLa Compétition : Jouez autant de fois que vous le souhaitez pendant la durée du tournoi. Seul votre meilleur score est conservé.\n\nLe Classement : Suivez le tableau des scores en temps réel.\n\nLa Victoire : À la fin du temps imparti, le joueur qui occupe la 1ère place remporte la totalité de la cagnotte (frais d\'entrée cumulés de tous les participants).\n\n⚠️ Note : Si vous finissez 2e, vous ne gagnez rien. Seule la perfection paie sur Blacksnack.\n\n⚔️ Défis de l\'Admin\nLocalisation : Menu → Défis\n\nIci, vous ne jouez pas contre d\'autres joueurs, mais contre la plateforme. L\'Admin propose des défis spécifiques avec des récompenses fixes.\n\nComment ça marche ?\nChoisir un Défi : Consultez les défis créés par l\'Admin (ex: \"Atteindre 50 points en vitesse Extrême\").\n\nMise en jeu : Payez la mise requise pour tenter le défi.\n\nConditions de Victoire : Vous devez respecter scrupuleusement les conditions (Vitesse imposée, score minimum, etc.).\n\nRécompense : Si vous réussissez, la somme promise est immédiatement créditée sur votre compte. Si vous échouez, la mise est perdue.\n\n💳 Gestion du Portefeuille\nDépôts & Retraits\nNous supportons les méthodes de paiement les plus rapides de la région :\n\nMobile Money : M-Pesa, Airtel Money, Orange Money.\n\nCartes : Visa & Mastercard.\n\nTaux de référence : 1 USD = 2500 CDF (Conversion automatique).\n\n🎨 Identité Visuelle (Design System)\nBlacksnack utilise une esthétique Cyber-Purple pour une immersion totale.\n\nDominante : Violet Électrique (#7c3aed) pour les boutons et indicateurs.\n\nFond : Noir Profond (#000000) pour un contraste maximal.\n\nAccents : Bleu Électrique pour les interactions et Orange pour les proies.\n\nStatuts : Vert (Succès) / Rouge (Erreur).', 'Contenu du guide du débutant (format Markdown)', '2026-04-07 00:08:52'),
('exchange_rate_usd_cdf', '2500', 'Taux de change dynamique USD vers CDF', '2026-04-06 17:43:56'),
('whapi_api_token', '', 'Token API Whapi.cloud pour les notifications', '2026-04-06 17:43:56'),
('whatsapp_group_link', 'https://chat.whatsapp.com/example', 'Lien du groupe WhatsApp communautaire', '2026-04-06 17:43:55'),
('whatsapp_support_number', '+243979446511', 'Numéro de support client WhatsApp', '2026-04-06 23:52:52');

-- --------------------------------------------------------

--
-- Table structure for table `system_transactions`
--

CREATE TABLE `system_transactions` (
  `id` int(11) NOT NULL,
  `type` enum('credit','debit') NOT NULL,
  `amount_usd` decimal(10,2) NOT NULL,
  `reason` text NOT NULL,
  `payment_method_type` enum('cartes_bancaires','mobile_money','maboko_banque') DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `admin_id` int(11) NOT NULL,
  `balance_before_usd` decimal(10,2) DEFAULT NULL,
  `balance_after_usd` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','completed','failed') DEFAULT 'completed',
  `gateway_reference` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `system_transactions`
--

-- --------------------------------------------------------

-- --------------------------------------------------------

--
-- Table structure for table `tournaments`
--

CREATE TABLE `tournaments` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `entry_fee_usd` decimal(10,2) NOT NULL,
  `entry_fee_cdf` decimal(10,2) NOT NULL DEFAULT 0.00,
  `prize_pool_usd` decimal(10,2) NOT NULL,
  `max_participants` int(11) NOT NULL,
  `current_participants` int(11) DEFAULT 0,
  `start_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `end_date` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `status` enum('upcoming','active','completed','cancelled') DEFAULT 'upcoming',
  `winner_id` int(11) DEFAULT NULL,
  `game_mode` varchar(30) DEFAULT 'classic',
  `rules` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Tournois organisés avec frais d''entrée et prix';

--
-- Dumping data for table `tournaments`
--

-- --------------------------------------------------------

-- --------------------------------------------------------

--
-- Table structure for table `tournament_participants`
--

CREATE TABLE `tournament_participants` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `score` int(11) DEFAULT 0,
  `rank` int(11) DEFAULT NULL,
  `prize_won_usd` decimal(10,2) DEFAULT 0.00,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tournament_participants`
--

-- --------------------------------------------------------

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('deposit','withdrawal','tournament_entry','tournament_prize','challenge_bet','challenge_prize','admin_recharge') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `amount_usd` decimal(10,2) DEFAULT NULL,
  `amount_cdf` decimal(15,2) DEFAULT NULL,
  `currency` enum('USD','CDF') DEFAULT 'USD',
  `payment_method_id` int(11) DEFAULT NULL,
  `method` varchar(20) DEFAULT NULL,
  `network` varchar(20) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `card_last4` varchar(4) DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `status` enum('pending','completed','failed','cancelled') DEFAULT 'pending',
  `description` text DEFAULT NULL,
  `admin_note` text DEFAULT NULL,
  `processed_by_admin_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  `gateway_reference` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Toutes les transactions financières de la plateforme';

--
-- Dumping data for table `transactions`
--

-- --------------------------------------------------------

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `balance_usd` decimal(10,2) DEFAULT 0.00,
  `balance_cdf` decimal(15,2) DEFAULT 0.00,
  `total_earnings` decimal(10,2) DEFAULT 0.00,
  `total_games_played` int(11) DEFAULT 0,
  `total_wins` int(11) DEFAULT 0,
  `total_losses` int(11) DEFAULT 0,
  `win_rate` decimal(5,2) DEFAULT 0.00,
  `highest_score` int(11) DEFAULT 0,
  `level` varchar(20) DEFAULT 'Débutant',
  `avatar_url` varchar(255) DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  `country` varchar(50) DEFAULT 'RDC',
  `status` enum('active','suspended','banned') DEFAULT 'active',
  `reset_code` varchar(10) DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Table centrale des joueurs (Dashboard + Game)';

--
-- Dumping data for table `users`
--

-- --------------------------------------------------------

--
-- Table structure for table `user_settings`
--

CREATE TABLE `user_settings` (
  `user_id` int(11) NOT NULL,
  `speed_label` varchar(20) DEFAULT 'Normal',
  `speed_value` int(11) DEFAULT 150,
  `speed_multiplier` decimal(3,1) DEFAULT 1.0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Préférences de jeu (vitesse, etc.)';

--
-- Dumping data for table `user_settings`
--

-- --------------------------------------------------------

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_recent_transactions`
-- (See below for the actual view)
--
CREATE TABLE `v_recent_transactions` (
`id` int(11)
,`user_id` int(11)
,`username` varchar(50)
,`type` enum('deposit','withdrawal','tournament_entry','tournament_prize','challenge_bet','challenge_prize','admin_recharge')
,`amount` decimal(10,2)
,`currency` enum('USD','CDF')
,`status` enum('pending','completed','failed','cancelled')
,`payment_method_name` varchar(50)
,`created_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_user_stats`
-- (See below for the actual view)
--
CREATE TABLE `v_user_stats` (
`id` int(11)
,`username` varchar(50)
,`balance_usd` decimal(10,2)
,`total_earnings` decimal(10,2)
,`total_games_played` int(11)
,`total_wins` int(11)
,`win_rate_percentage` decimal(16,2)
,`tournaments_participated` bigint(21)
,`challenges_created` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `withdrawal_history`
--

CREATE TABLE `withdrawal_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount_usd` decimal(10,2) DEFAULT NULL,
  `amount_cdf` decimal(15,2) DEFAULT NULL,
  `currency` enum('USD','CDF') NOT NULL,
  `reason` text NOT NULL,
  `admin_id` int(11) NOT NULL,
  `balance_before_usd` decimal(10,2) DEFAULT NULL,
  `balance_after_usd` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `withdrawal_history`
--

-- --------------------------------------------------------

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_admins_email` (`email`),
  ADD KEY `idx_admins_role` (`role`);

--
-- Indexes for table `challenges`
--
ALTER TABLE `challenges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `winner_id` (`winner_id`),
  ADD KEY `idx_challenges_creator` (`creator_id`),
  ADD KEY `idx_challenges_opponent` (`opponent_id`),
  ADD KEY `idx_challenges_status` (`status`);

--
-- Indexes for table `challenge_participants`
--
ALTER TABLE `challenge_participants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_challenge_participants_challenge` (`challenge_id`),
  ADD KEY `idx_challenge_participants_user` (`user_id`);

--
-- Indexes for table `earnings_history`
--
ALTER TABLE `earnings_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_earnings_user` (`user_id`);

--
-- Indexes for table `game_history`
--
ALTER TABLE `game_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_game_history_user` (`user_id`),
  ADD KEY `idx_game_history_mode` (`game_mode`);

--
-- Indexes for table `payment_gateways`
--
ALTER TABLE `payment_gateways`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `personal_challenges`
--
ALTER TABLE `personal_challenges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `template_id` (`template_id`);

--
-- Indexes for table `personal_challenge_templates`
--
ALTER TABLE `personal_challenge_templates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `recharge_history`
--
ALTER TABLE `recharge_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_recharge_history_user` (`user_id`),
  ADD KEY `idx_recharge_history_admin` (`admin_id`),
  ADD KEY `idx_recharge_history_created` (`created_at`);

--
-- Indexes for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `token` (`token`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `system_transactions`
--
ALTER TABLE `system_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_system_transactions_type` (`type`),
  ADD KEY `idx_system_transactions_admin` (`admin_id`),
  ADD KEY `idx_system_transactions_created` (`created_at`);

--
-- Indexes for table `tournaments`
--
ALTER TABLE `tournaments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `winner_id` (`winner_id`),
  ADD KEY `idx_tournaments_status` (`status`),
  ADD KEY `idx_tournaments_dates` (`start_date`,`end_date`);

--
-- Indexes for table `tournament_participants`
--
ALTER TABLE `tournament_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tournament_id` (`tournament_id`,`user_id`),
  ADD KEY `idx_tournament_participants_tournament` (`tournament_id`),
  ADD KEY `idx_tournament_participants_user` (`user_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payment_method_id` (`payment_method_id`),
  ADD KEY `idx_transactions_user` (`user_id`),
  ADD KEY `idx_transactions_type` (`type`),
  ADD KEY `idx_transactions_status` (`status`),
  ADD KEY `idx_transactions_created` (`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_username` (`username`),
  ADD KEY `idx_users_phone` (`phone`),
  ADD KEY `idx_users_status` (`status`);

--
-- Indexes for table `user_settings`
--
ALTER TABLE `user_settings`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `withdrawal_history`
--
ALTER TABLE `withdrawal_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_withdrawal_history_user` (`user_id`),
  ADD KEY `idx_withdrawal_history_admin` (`admin_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `challenges`
--
ALTER TABLE `challenges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `challenge_participants`
--
ALTER TABLE `challenge_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `earnings_history`
--
ALTER TABLE `earnings_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game_history`
--
ALTER TABLE `game_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_gateways`
--
ALTER TABLE `payment_gateways`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `personal_challenges`
--
ALTER TABLE `personal_challenges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personal_challenge_templates`
--
ALTER TABLE `personal_challenge_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `recharge_history`
--
ALTER TABLE `recharge_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_transactions`
--
ALTER TABLE `system_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournaments`
--
ALTER TABLE `tournaments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournament_participants`
--
ALTER TABLE `tournament_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `withdrawal_history`
--
ALTER TABLE `withdrawal_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- Structure for view `v_recent_transactions`
--
DROP TABLE IF EXISTS `v_recent_transactions`;

CREATE ALGORITHM=UNDEFINED DEFINER=`winner55`@`%` SQL SECURITY DEFINER VIEW `v_recent_transactions`  AS SELECT `t`.`id` AS `id`, `t`.`user_id` AS `user_id`, `u`.`username` AS `username`, `t`.`type` AS `type`, `t`.`amount` AS `amount`, `t`.`currency` AS `currency`, `t`.`status` AS `status`, `pm`.`name` AS `payment_method_name`, `t`.`created_at` AS `created_at` FROM ((`transactions` `t` join `users` `u` on(`t`.`user_id` = `u`.`id`)) left join `payment_methods` `pm` on(`t`.`payment_method_id` = `pm`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `v_user_stats`
--
DROP TABLE IF EXISTS `v_user_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`winner55`@`%` SQL SECURITY DEFINER VIEW `v_user_stats`  AS SELECT `u`.`id` AS `id`, `u`.`username` AS `username`, `u`.`balance_usd` AS `balance_usd`, `u`.`total_earnings` AS `total_earnings`, `u`.`total_games_played` AS `total_games_played`, `u`.`total_wins` AS `total_wins`, CASE WHEN `u`.`total_games_played` > 0 THEN round(`u`.`total_wins` / `u`.`total_games_played` * 100,2) ELSE 0 END AS `win_rate_percentage`, (select count(distinct `tournament_participants`.`tournament_id`) from `tournament_participants` where `tournament_participants`.`user_id` = `u`.`id`) AS `tournaments_participated`, (select count(distinct `challenges`.`id`) from `challenges` where `challenges`.`creator_id` = `u`.`id`) AS `challenges_created` FROM `users` AS `u` ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `challenges`
--
ALTER TABLE `challenges`
  ADD CONSTRAINT `challenges_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `challenges_ibfk_2` FOREIGN KEY (`opponent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `challenges_ibfk_3` FOREIGN KEY (`winner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `challenge_participants`
--
ALTER TABLE `challenge_participants`
  ADD CONSTRAINT `challenge_participants_ibfk_1` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `challenge_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `earnings_history`
--
ALTER TABLE `earnings_history`
  ADD CONSTRAINT `earnings_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `game_history`
--
ALTER TABLE `game_history`
  ADD CONSTRAINT `game_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `personal_challenges`
--
ALTER TABLE `personal_challenges`
  ADD CONSTRAINT `pc_template_fk` FOREIGN KEY (`template_id`) REFERENCES `personal_challenge_templates` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pc_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `recharge_history`
--
ALTER TABLE `recharge_history`
  ADD CONSTRAINT `recharge_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `recharge_history_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `system_transactions`
--
ALTER TABLE `system_transactions`
  ADD CONSTRAINT `system_transactions_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tournaments`
--
ALTER TABLE `tournaments`
  ADD CONSTRAINT `tournaments_ibfk_1` FOREIGN KEY (`winner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tournament_participants`
--
ALTER TABLE `tournament_participants`
  ADD CONSTRAINT `tournament_participants_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tournament_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_settings`
--
ALTER TABLE `user_settings`
  ADD CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `withdrawal_history`
--
ALTER TABLE `withdrawal_history`
  ADD CONSTRAINT `withdrawal_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `withdrawal_history_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
