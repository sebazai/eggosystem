-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: eggo-devdb
-- Generation Time: Sep 27, 2025 at 04:30 PM
-- Server version: 11.8.3-MariaDB
-- PHP Version: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `kanaliiga`
--

DELIMITER $$
--
-- Functions
--
CREATE DEFINER=`kanadbuser`@`%` FUNCTION `get_account_id_from_steam_id` (`steam_id_param` BIGINT) RETURNS INT(10) UNSIGNED DETERMINISTIC READS SQL DATA BEGIN
      DECLARE account_id_result INT UNSIGNED;
      
      SELECT la.account_id INTO account_id_result
      FROM LinkedAccounts la
      WHERE la.provider = 'steam' 
      AND la.provider_id = CAST(steam_id_param AS CHAR)
      LIMIT 1;
      
      RETURN account_id_result;
    END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `AccountCasterUrls`
--

CREATE TABLE `AccountCasterUrls` (
  `id` int(10) UNSIGNED NOT NULL,
  `account_id` int(10) UNSIGNED NOT NULL,
  `default_stream_url` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `AccountPermissionScopes`
--

CREATE TABLE `AccountPermissionScopes` (
  `id` int(10) UNSIGNED NOT NULL,
  `account_id` int(10) UNSIGNED NOT NULL,
  `permission_id` int(10) UNSIGNED NOT NULL,
  `season_id` int(10) UNSIGNED NOT NULL,
  `team_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `AccountPermissionScopes`
--
DELIMITER $$
CREATE TRIGGER `validate_captain_permission_on_insert` BEFORE INSERT ON `AccountPermissionScopes` FOR EACH ROW BEGIN
      DECLARE captain_status BOOLEAN DEFAULT FALSE;
      DECLARE steam_id_found BIGINT;
      
      -- Check if this permission is for a captain-related permission
      IF EXISTS (
        SELECT 1 FROM Permissions p 
        WHERE p.id = NEW.permission_id 
        AND p.permission_name IN ('edit-registration', 'manage-team', 'captain-permissions')
      ) THEN
        
        -- Find the steam_id for this account
        SELECT strp.steam_id INTO steam_id_found
        FROM SeasonTeamRegistrationPlayers strp
        WHERE strp.season_id = NEW.season_id
        AND strp.team_id = NEW.team_id
        AND get_account_id_from_steam_id(strp.steam_id) = NEW.account_id
        LIMIT 1;
        
        -- Check if this account is actually a captain or co-captain for this season/team
        SELECT (is_captain = 1 OR is_co_captain = 1) INTO captain_status
        FROM SeasonTeamRegistrationPlayers
        WHERE season_id = NEW.season_id
        AND team_id = NEW.team_id
        AND steam_id = steam_id_found;
        
        IF NOT captain_status THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Cannot assign captain permissions to non-captain/co-captain player';
        END IF;
      END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `validate_captain_permission_on_update` BEFORE UPDATE ON `AccountPermissionScopes` FOR EACH ROW BEGIN
      DECLARE captain_status BOOLEAN DEFAULT FALSE;
      DECLARE steam_id_found BIGINT;
      
      -- Check if this permission is for a captain-related permission
      IF EXISTS (
        SELECT 1 FROM Permissions p 
        WHERE p.id = NEW.permission_id 
        AND p.permission_name IN ('edit-registration', 'manage-team', 'captain-permissions')
      ) THEN
        
        -- Find the steam_id for this account
        SELECT strp.steam_id INTO steam_id_found
        FROM SeasonTeamRegistrationPlayers strp
        WHERE strp.season_id = NEW.season_id
        AND strp.team_id = NEW.team_id
        AND get_account_id_from_steam_id(strp.steam_id) = NEW.account_id
        LIMIT 1;
        
        -- Check if this account is actually a captain or co-captain for this season/team
        SELECT (is_captain = 1 OR is_co_captain = 1) INTO captain_status
        FROM SeasonTeamRegistrationPlayers
        WHERE season_id = NEW.season_id
        AND team_id = NEW.team_id
        AND steam_id = steam_id_found;
        
        IF NOT captain_status THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Cannot assign captain permissions to non-captain/co-captain player';
        END IF;
      END IF;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `AccountRoles`
--

CREATE TABLE `AccountRoles` (
  `account_id` int(10) UNSIGNED NOT NULL,
  `role_id` int(10) UNSIGNED NOT NULL,
  `game_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Accounts`
--

CREATE TABLE `Accounts` (
  `id` int(10) UNSIGNED NOT NULL,
  `work_email` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `discord` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `work_email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `work_email_token` varchar(255) DEFAULT NULL,
  `work_email_token_expires_at` timestamp NULL DEFAULT NULL,
  `is_work_email_personal_email` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `Accounts`
--
DELIMITER $$
CREATE TRIGGER `update_account_updated_at` BEFORE UPDATE ON `Accounts` FOR EACH ROW SET NEW.updated_at = NOW()
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `AuditLog`
--

CREATE TABLE `AuditLog` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `action_type` varchar(255) NOT NULL,
  `entity_type` varchar(255) NOT NULL,
  `entity_id` bigint(20) DEFAULT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `request_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`request_data`)),
  `response_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`response_data`)),
  `response_status` int(11) NOT NULL,
  `response_message` varchar(255) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `FaceitWebhooks`
--

CREATE TABLE `FaceitWebhooks` (
  `id` int(10) UNSIGNED NOT NULL,
  `received_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `external_payload_id` varchar(255) NOT NULL,
  `event` varchar(255) NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `error_type` varchar(255) DEFAULT NULL,
  `error_details` text DEFAULT NULL,
  `retry_count` int(11) DEFAULT 0,
  `manual_reprocess` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Games`
--

CREATE TABLE `Games` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `abbreviation` varchar(255) NOT NULL,
  `app_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `GameTypes`
--

CREATE TABLE `GameTypes` (
  `id` int(10) UNSIGNED NOT NULL,
  `game_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `min_players` int(11) DEFAULT NULL,
  `max_players` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `KanahautomoRegistrationGameTypes`
--

CREATE TABLE `KanahautomoRegistrationGameTypes` (
  `game_type_id` int(10) UNSIGNED NOT NULL,
  `kanahautomo_registration_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `KanahautomoRegistrations`
--

CREATE TABLE `KanahautomoRegistrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `steam_id` bigint(20) NOT NULL,
  `organization_id` int(10) UNSIGNED NOT NULL,
  `accepted_terms` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `knex_migrations`
--

CREATE TABLE `knex_migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `batch` int(11) DEFAULT NULL,
  `migration_time` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `knex_migrations_lock`
--

CREATE TABLE `knex_migrations_lock` (
  `index` int(10) UNSIGNED NOT NULL,
  `is_locked` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Leagues`
--

CREATE TABLE `Leagues` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `sort_priority` int(11) NOT NULL DEFAULT 99
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `LinkedAccounts`
--

CREATE TABLE `LinkedAccounts` (
  `account_id` int(10) UNSIGNED NOT NULL,
  `provider` enum('steam','discord') NOT NULL,
  `provider_id` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `MapRoundStats`
--

CREATE TABLE `MapRoundStats` (
  `id` int(10) UNSIGNED NOT NULL,
  `match_game_id` int(10) UNSIGNED NOT NULL,
  `ct_team_id` int(10) UNSIGNED NOT NULL,
  `t_team_id` int(10) UNSIGNED NOT NULL,
  `round_number` tinyint(3) UNSIGNED NOT NULL,
  `round_end_reason_info` enum('bomb_defused','target_bombed','target_saved','t_win','ct_win') NOT NULL,
  `ct_t` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`ct_t`)),
  `first_kill` varchar(2) DEFAULT NULL,
  `plant_site` char(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Maps`
--

CREATE TABLE `Maps` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `name` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Matches`
--

CREATE TABLE `Matches` (
  `id` int(10) UNSIGNED NOT NULL,
  `league_id` int(10) UNSIGNED NOT NULL,
  `season_id` int(10) UNSIGNED NOT NULL,
  `stage` int(10) UNSIGNED NOT NULL,
  `best_of` tinyint(3) UNSIGNED NOT NULL,
  `match_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time DEFAULT NULL,
  `external_match_room_id` varchar(255) DEFAULT NULL,
  `group` tinyint(4) DEFAULT NULL,
  `round` tinyint(4) DEFAULT NULL,
  `status` enum('SCHEDULED','CHECK_IN','VOTING','CONFIGURING','READY','ONGOING','FINISHED','ABORTED','CANCELLED','FORFEIT','PAUSED') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `MatchGameClips`
--

CREATE TABLE `MatchGameClips` (
  `id` int(10) UNSIGNED NOT NULL,
  `match_game_id` int(10) UNSIGNED NOT NULL,
  `clip_steam_id` bigint(20) DEFAULT NULL,
  `clip_status` varchar(255) NOT NULL,
  `clip_type` varchar(255) NOT NULL,
  `clip_id` varchar(255) DEFAULT NULL,
  `clip_request_id` varchar(255) DEFAULT NULL,
  `clip_url` varchar(255) DEFAULT NULL,
  `clip_thumbnail_url` varchar(255) DEFAULT NULL,
  `clip_snapshot_url` varchar(255) DEFAULT NULL,
  `clip_title` varchar(255) DEFAULT NULL,
  `clip_length` varchar(255) DEFAULT NULL,
  `additional_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`additional_data`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `MatchGames`
--

CREATE TABLE `MatchGames` (
  `id` int(10) UNSIGNED NOT NULL,
  `match_id` int(10) UNSIGNED NOT NULL,
  `map_id` tinyint(3) UNSIGNED NOT NULL,
  `map_order` tinyint(3) UNSIGNED DEFAULT NULL,
  `demofile` varchar(255) NOT NULL,
  `regulation_rounds` tinyint(3) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `MatchTeamMapVetoes`
--

CREATE TABLE `MatchTeamMapVetoes` (
  `id` int(10) UNSIGNED NOT NULL,
  `match_id` int(10) UNSIGNED NOT NULL,
  `team_id` int(10) UNSIGNED NOT NULL,
  `map_id` tinyint(3) UNSIGNED NOT NULL,
  `action` enum('drop','pick','decider') NOT NULL,
  `veto_order` tinyint(3) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `MatchTeams`
--

CREATE TABLE `MatchTeams` (
  `match_id` int(10) UNSIGNED NOT NULL,
  `team_id` int(10) UNSIGNED NOT NULL,
  `season_id` int(10) UNSIGNED NOT NULL,
  `league_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Organizations`
--

CREATE TABLE `Organizations` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `country` varchar(255) NOT NULL DEFAULT 'Finland',
  `organization_code` varchar(255) NOT NULL,
  `logo` varchar(255) NOT NULL DEFAULT 'nologo.png',
  `website` varchar(255) NOT NULL,
  `sort_order` int(10) UNSIGNED DEFAULT NULL,
  `discord_invite_link` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `OrganizerGames`
--

CREATE TABLE `OrganizerGames` (
  `id` int(10) UNSIGNED NOT NULL,
  `organizer_id` int(10) UNSIGNED NOT NULL,
  `game_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Organizers`
--

CREATE TABLE `Organizers` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `faceit_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Permissions`
--

CREATE TABLE `Permissions` (
  `id` int(10) UNSIGNED NOT NULL,
  `permission_name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `PlayerStats`
--

CREATE TABLE `PlayerStats` (
  `id` int(10) UNSIGNED NOT NULL,
  `steam_id` bigint(20) NOT NULL,
  `match_game_id` int(10) UNSIGNED NOT NULL,
  `kills` tinyint(3) UNSIGNED NOT NULL,
  `deaths` tinyint(3) UNSIGNED NOT NULL,
  `assists` tinyint(3) UNSIGNED NOT NULL,
  `assists_ct` tinyint(3) UNSIGNED NOT NULL,
  `assists_t` tinyint(3) UNSIGNED NOT NULL,
  `mvps` tinyint(3) UNSIGNED NOT NULL,
  `total_damage` int(11) NOT NULL,
  `total_damage_ct` int(11) NOT NULL,
  `total_damage_t` int(11) NOT NULL,
  `headshots` tinyint(3) UNSIGNED NOT NULL,
  `flash_assists` tinyint(3) UNSIGNED NOT NULL,
  `flash_assists_t` tinyint(3) UNSIGNED NOT NULL,
  `flash_assists_ct` tinyint(3) UNSIGNED NOT NULL,
  `adr` decimal(4,1) NOT NULL,
  `adr_t` decimal(4,1) DEFAULT NULL,
  `adr_ct` decimal(4,1) DEFAULT NULL,
  `hs_percent` tinyint(3) UNSIGNED NOT NULL,
  `plants` tinyint(3) UNSIGNED NOT NULL,
  `explodes` tinyint(3) UNSIGNED NOT NULL,
  `defuses` tinyint(3) UNSIGNED NOT NULL,
  `first_kills` tinyint(3) UNSIGNED NOT NULL,
  `kills_1` int(11) NOT NULL,
  `kills_2` tinyint(3) UNSIGNED NOT NULL,
  `kills_3` tinyint(3) UNSIGNED NOT NULL,
  `kills_4` tinyint(3) UNSIGNED NOT NULL,
  `kills_5` tinyint(3) UNSIGNED NOT NULL,
  `trades` tinyint(3) UNSIGNED NOT NULL,
  `traded` tinyint(3) UNSIGNED NOT NULL,
  `clutches_won` tinyint(3) UNSIGNED NOT NULL,
  `clutches` tinyint(3) UNSIGNED NOT NULL,
  `awp_kills` tinyint(3) UNSIGNED NOT NULL,
  `utility_damage` int(11) NOT NULL,
  `utility_damage_t` int(11) NOT NULL,
  `utility_damage_ct` int(11) NOT NULL,
  `molotov_damage` int(11) NOT NULL,
  `molotov_damage_ct` int(11) NOT NULL,
  `molotov_damage_t` int(11) NOT NULL,
  `he_damage` int(11) NOT NULL,
  `he_damage_ct` int(11) NOT NULL,
  `he_damage_t` int(11) NOT NULL,
  `trade_attempts` tinyint(3) UNSIGNED NOT NULL,
  `trade_attempts_ct` tinyint(3) UNSIGNED NOT NULL,
  `trade_attempts_t` tinyint(3) UNSIGNED NOT NULL,
  `kills_through_walls` tinyint(3) UNSIGNED NOT NULL,
  `first_death_trade_attempts` tinyint(3) UNSIGNED NOT NULL,
  `first_death_trade_attempts_ct` tinyint(3) UNSIGNED NOT NULL,
  `first_death_trade_attempts_t` tinyint(3) UNSIGNED NOT NULL,
  `first_death_trade_opportunities` tinyint(3) UNSIGNED NOT NULL,
  `first_death_trade_opportunities_ct` tinyint(3) UNSIGNED NOT NULL,
  `first_death_trade_opportunities_t` tinyint(3) UNSIGNED NOT NULL,
  `trade_opportunities` tinyint(3) UNSIGNED NOT NULL,
  `trade_opportunities_t` tinyint(3) UNSIGNED NOT NULL,
  `trade_opportunities_ct` tinyint(3) UNSIGNED NOT NULL,
  `flashes_thrown` tinyint(3) UNSIGNED NOT NULL,
  `enemies_flashed` tinyint(3) UNSIGNED NOT NULL,
  `mates_flashed` tinyint(3) UNSIGNED NOT NULL,
  `self_flashes` tinyint(3) UNSIGNED NOT NULL,
  `first_deaths` tinyint(3) UNSIGNED NOT NULL,
  `total_mf_duration` decimal(5,1) NOT NULL,
  `total_ef_duration` decimal(5,1) NOT NULL,
  `one_v_one_won` tinyint(3) UNSIGNED NOT NULL,
  `one_v_one_lost` tinyint(3) UNSIGNED NOT NULL,
  `one_v_one_won_ct` tinyint(3) UNSIGNED DEFAULT NULL,
  `one_v_one_lost_ct` tinyint(3) UNSIGNED DEFAULT NULL,
  `one_v_one_won_t` tinyint(3) UNSIGNED DEFAULT NULL,
  `one_v_one_lost_t` tinyint(3) UNSIGNED DEFAULT NULL,
  `kast` tinyint(3) UNSIGNED NOT NULL,
  `kana_rating` decimal(4,2) NOT NULL,
  `first_kills_t` tinyint(3) UNSIGNED DEFAULT NULL,
  `first_kills_ct` tinyint(3) UNSIGNED DEFAULT NULL,
  `first_deaths_t` tinyint(3) UNSIGNED DEFAULT NULL,
  `first_deaths_ct` tinyint(3) UNSIGNED DEFAULT NULL,
  `first_death_trades` tinyint(3) UNSIGNED NOT NULL,
  `first_death_traded` tinyint(3) UNSIGNED NOT NULL,
  `first_death_trades_ct` tinyint(3) UNSIGNED NOT NULL,
  `first_death_traded_ct` tinyint(3) UNSIGNED NOT NULL,
  `first_death_trades_t` tinyint(3) UNSIGNED NOT NULL,
  `first_death_traded_t` tinyint(3) UNSIGNED NOT NULL,
  `flashes_thrown_t` tinyint(3) UNSIGNED DEFAULT NULL,
  `flashes_thrown_ct` tinyint(3) UNSIGNED DEFAULT NULL,
  `enemies_flashed_t` tinyint(3) UNSIGNED DEFAULT NULL,
  `enemies_flashed_ct` tinyint(3) UNSIGNED DEFAULT NULL,
  `kills_t` tinyint(3) UNSIGNED DEFAULT NULL,
  `kills_ct` tinyint(3) UNSIGNED DEFAULT NULL,
  `deaths_t` tinyint(3) UNSIGNED DEFAULT NULL,
  `deaths_ct` tinyint(3) UNSIGNED DEFAULT NULL,
  `trades_t` tinyint(3) UNSIGNED DEFAULT NULL,
  `trades_ct` tinyint(3) UNSIGNED DEFAULT NULL,
  `traded_t` tinyint(3) UNSIGNED DEFAULT NULL,
  `traded_ct` tinyint(3) UNSIGNED DEFAULT NULL,
  `total_ef_duration_ct` int(11) DEFAULT NULL,
  `total_ef_duration_t` int(11) DEFAULT NULL,
  `total_mf_duration_t` int(11) DEFAULT NULL,
  `total_mf_duration_ct` int(11) DEFAULT NULL,
  `mates_flashed_t` tinyint(3) UNSIGNED DEFAULT NULL,
  `mates_flashed_ct` tinyint(3) UNSIGNED DEFAULT NULL,
  `ttd` int(11) DEFAULT NULL,
  `crosshair_placement` decimal(3,1) DEFAULT NULL,
  `ttf` int(11) DEFAULT NULL,
  `rws` decimal(4,2) NOT NULL,
  `shots` mediumint(8) UNSIGNED DEFAULT NULL,
  `shots_hit` mediumint(8) UNSIGNED DEFAULT NULL,
  `total_strafing_shots` mediumint(8) UNSIGNED DEFAULT NULL,
  `good_strafing_shots` mediumint(8) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `PlayerTrades`
--

CREATE TABLE `PlayerTrades` (
  `id` int(10) UNSIGNED NOT NULL,
  `match_game_id` int(10) UNSIGNED NOT NULL,
  `trader_steam_id` bigint(20) NOT NULL,
  `killer_steam_id` bigint(20) NOT NULL,
  `victim_steam_id` bigint(20) NOT NULL,
  `round_number` tinyint(3) UNSIGNED NOT NULL,
  `first_death` tinyint(1) NOT NULL,
  `traded` tinyint(1) NOT NULL,
  `attempted` tinyint(1) NOT NULL,
  `time` bigint(20) UNSIGNED DEFAULT NULL,
  `trade_time` bigint(20) UNSIGNED DEFAULT NULL,
  `death_time` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Reservations`
--

CREATE TABLE `Reservations` (
  `id` int(10) UNSIGNED NOT NULL,
  `stream_url` varchar(255) NOT NULL,
  `hash` varchar(255) NOT NULL,
  `match_id` int(10) UNSIGNED NOT NULL,
  `account_id` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `RolePermissions`
--

CREATE TABLE `RolePermissions` (
  `role_id` int(10) UNSIGNED NOT NULL,
  `permission_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Roles`
--

CREATE TABLE `Roles` (
  `id` int(10) UNSIGNED NOT NULL,
  `role_name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `SeasonLeagueExternalIds`
--

CREATE TABLE `SeasonLeagueExternalIds` (
  `id` int(10) UNSIGNED NOT NULL,
  `season_id` int(10) UNSIGNED NOT NULL,
  `league_id` int(10) UNSIGNED NOT NULL,
  `stage_id` int(10) UNSIGNED NOT NULL,
  `external_id` varchar(255) NOT NULL,
  `external_league_name` varchar(255) DEFAULT NULL,
  `type` varchar(255) NOT NULL,
  `manual_group` int(11) DEFAULT NULL COMMENT 'Manual group parsed from external_league_name'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `SeasonLeagues`
--

CREATE TABLE `SeasonLeagues` (
  `tier` int(11) NOT NULL,
  `season_id` int(10) UNSIGNED NOT NULL,
  `league_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `SeasonLeagueTeams`
--

CREATE TABLE `SeasonLeagueTeams` (
  `season_id` int(10) UNSIGNED NOT NULL,
  `team_id` int(10) UNSIGNED NOT NULL,
  `league_id` int(10) UNSIGNED NOT NULL,
  `placement` tinyint(3) UNSIGNED DEFAULT NULL,
  `position_offset` tinyint(3) UNSIGNED DEFAULT NULL,
  `external_team_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `SeasonPlayerApprovals`
--

CREATE TABLE `SeasonPlayerApprovals` (
  `id` int(10) UNSIGNED NOT NULL,
  `steam_id` bigint(20) NOT NULL,
  `season_id` int(10) UNSIGNED DEFAULT NULL,
  `organization_id` int(10) UNSIGNED DEFAULT NULL,
  `team_id` int(10) UNSIGNED DEFAULT NULL,
  `approved_by_id` int(10) UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ticket_id` varchar(255) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `SeasonPlayerApprovals`
--
DELIMITER $$
CREATE TRIGGER `check_team_or_organization` BEFORE INSERT ON `SeasonPlayerApprovals` FOR EACH ROW BEGIN
      IF NEW.organization_id IS NULL AND NEW.team_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Either organization_id or team_id must be provided';
      END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `check_team_or_organization_update` BEFORE UPDATE ON `SeasonPlayerApprovals` FOR EACH ROW BEGIN
      IF NEW.organization_id IS NULL AND NEW.team_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Either organization_id or team_id must be provided';
      END IF;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `SeasonPlayerRanks`
--

CREATE TABLE `SeasonPlayerRanks` (
  `id` int(10) UNSIGNED NOT NULL,
  `steam_id` bigint(20) NOT NULL,
  `season_id` int(10) UNSIGNED NOT NULL,
  `rank_updated_at` timestamp NULL DEFAULT '1970-01-01 10:00:00',
  `csgo_rank` int(11) DEFAULT NULL,
  `cs2_rank` int(11) DEFAULT NULL,
  `cs_hours` int(11) DEFAULT NULL,
  `faceit_level` int(11) DEFAULT NULL,
  `faceit_elo` int(11) DEFAULT NULL,
  `faceit_kd` decimal(3,2) DEFAULT NULL,
  `faceit_date` timestamp NULL DEFAULT '1970-01-01 10:00:00',
  `kana_elo` int(11) DEFAULT NULL,
  `esportal_kd` decimal(4,2) DEFAULT NULL,
  `esportal_elo` int(11) DEFAULT NULL,
  `esportal_rank` int(11) DEFAULT NULL,
  `hours_updated_at` timestamp NULL DEFAULT '1970-01-01 10:00:00',
  `manual_external_rank` tinyint(1) NOT NULL DEFAULT 0,
  `manual_steam_rank` tinyint(1) NOT NULL DEFAULT 0,
  `calculus` varchar(100) DEFAULT NULL,
  `offered_elo` int(11) DEFAULT NULL COMMENT 'Original offered ELO value before stabilization'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Seasons`
--

CREATE TABLE `Seasons` (
  `id` int(10) UNSIGNED NOT NULL,
  `game_id` int(10) UNSIGNED NOT NULL,
  `game_type_id` int(10) UNSIGNED DEFAULT NULL,
  `organizer_id` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `name` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `signup_start_date` datetime DEFAULT NULL,
  `signup_end_date` datetime DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `platform` enum('kanaliiga','esportal','faceit','popflash') NOT NULL DEFAULT 'kanaliiga',
  `is_round_robin_bo2_as_2xbo1` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `SeasonTeamPlayers`
--

CREATE TABLE `SeasonTeamPlayers` (
  `season_id` int(10) UNSIGNED NOT NULL,
  `team_id` int(10) UNSIGNED NOT NULL,
  `steam_id` bigint(20) NOT NULL,
  `role` enum('primary','substitute') DEFAULT 'primary',
  `is_captain` tinyint(1) NOT NULL DEFAULT 0,
  `is_co_captain` tinyint(1) NOT NULL DEFAULT 0,
  `match_id` int(10) UNSIGNED DEFAULT NULL,
  `id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `SeasonTeamPlayers`
--
DELIMITER $$
CREATE TRIGGER `before_insert_primary_check` BEFORE INSERT ON `SeasonTeamPlayers` FOR EACH ROW BEGIN
          DECLARE conflicting_team_id INT;

          IF NEW.role = 'primary' THEN
            SELECT team_id INTO conflicting_team_id
            FROM SeasonTeamPlayers
            WHERE season_id = NEW.season_id
              AND role = 'primary'
              AND steam_id = NEW.steam_id
            LIMIT 1;

            IF conflicting_team_id IS NOT NULL THEN
              SET @errorMsg = CONCAT('Player ', NEW.steam_id,' is already registered as primary for team ', conflicting_team_id,' in season ', NEW.season_id, '.');
              SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @errorMsg;
            END IF;
          END IF;
        END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_primary_check` BEFORE UPDATE ON `SeasonTeamPlayers` FOR EACH ROW BEGIN
            DECLARE conflicting_team_id INT;

            IF NEW.role = 'primary' THEN
                SELECT team_id
                INTO conflicting_team_id
                FROM SeasonTeamPlayers
                WHERE season_id = NEW.season_id
                  AND role = 'primary'
                  AND steam_id = NEW.steam_id
                  AND (team_id <> NEW.team_id OR steam_id <> NEW.steam_id)
                LIMIT 1;

                IF conflicting_team_id IS NOT NULL THEN
                    SET @errorMsg = CONCAT('Player ', NEW.steam_id, ' is already registered as primary for team ', conflicting_team_id,' in season ', NEW.season_id, '.');
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @errorMsg;
                END IF;
            END IF;
        END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `SeasonTeamRegistrationPlayers`
--

CREATE TABLE `SeasonTeamRegistrationPlayers` (
  `season_id` int(10) UNSIGNED NOT NULL,
  `team_id` int(10) UNSIGNED NOT NULL,
  `steam_id` bigint(20) NOT NULL,
  `is_captain` tinyint(1) NOT NULL DEFAULT 0,
  `is_co_captain` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Triggers `SeasonTeamRegistrationPlayers`
--
DELIMITER $$
CREATE TRIGGER `add_captain_permissions_on_insert` AFTER INSERT ON `SeasonTeamRegistrationPlayers` FOR EACH ROW BEGIN
      DECLARE account_id_found INT UNSIGNED;
      DECLARE permission_id_found INT UNSIGNED;
      DECLARE role_id_found INT UNSIGNED;
      
      -- Only proceed if this is a captain or co-captain
      IF NEW.is_captain = 1 OR NEW.is_co_captain = 1 THEN
        
        -- Get the account_id for this steam_id
        SET account_id_found = get_account_id_from_steam_id(NEW.steam_id);
        
        -- Get the edit-registration permission id
        SELECT id INTO permission_id_found FROM Permissions WHERE permission_name = 'edit-registration' LIMIT 1;
        
        -- Get the captain role id
        SELECT id INTO role_id_found FROM Roles WHERE role_name = 'captain' LIMIT 1;
        
        -- Add the permission scope if it doesn't exist
        INSERT IGNORE INTO AccountPermissionScopes (account_id, permission_id, season_id, team_id)
        VALUES (account_id_found, permission_id_found, NEW.season_id, NEW.team_id);
        
        -- Add the captain role if it doesn't exist
        INSERT IGNORE INTO AccountRoles (account_id, role_id, game_id)
        VALUES (account_id_found, role_id_found, 1);
      END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `add_captain_permissions_on_update` AFTER UPDATE ON `SeasonTeamRegistrationPlayers` FOR EACH ROW BEGIN
      DECLARE account_id_found INT UNSIGNED;
      DECLARE permission_id_found INT UNSIGNED;
      DECLARE role_id_found INT UNSIGNED;
      
      -- Only proceed if captain or co-captain status was added
      IF ((OLD.is_captain = 0 AND NEW.is_captain = 1) OR (OLD.is_co_captain = 0 AND NEW.is_co_captain = 1)) THEN
        
        -- Get the account_id for this steam_id
        SET account_id_found = get_account_id_from_steam_id(NEW.steam_id);
        
        -- Get the edit-registration permission id
        SELECT id INTO permission_id_found FROM Permissions WHERE permission_name = 'edit-registration' LIMIT 1;
        
        -- Get the captain role id
        SELECT id INTO role_id_found FROM Roles WHERE role_name = 'captain' LIMIT 1;
        
        -- Add the permission scope if it doesn't exist
        INSERT IGNORE INTO AccountPermissionScopes (account_id, permission_id, season_id, team_id)
        VALUES (account_id_found, permission_id_found, NEW.season_id, NEW.team_id);
        
        -- Add the captain role if it doesn't exist
        INSERT IGNORE INTO AccountRoles (account_id, role_id, game_id)
        VALUES (account_id_found, role_id_found, 1);
      END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `cleanup_captain_permissions_on_delete` AFTER DELETE ON `SeasonTeamRegistrationPlayers` FOR EACH ROW BEGIN
      DECLARE account_id_found INT UNSIGNED;
      
      -- Get the account_id for this steam_id
      SET account_id_found = get_account_id_from_steam_id(OLD.steam_id);
      
      -- If this was a captain or co-captain, clean up permissions
      IF OLD.is_captain = 1 OR OLD.is_co_captain = 1 THEN
        
        -- Remove captain-related permissions for this season/team
        DELETE aps FROM AccountPermissionScopes aps
        JOIN Permissions p ON p.id = aps.permission_id
        WHERE aps.account_id = account_id_found
        AND aps.season_id = OLD.season_id
        AND aps.team_id = OLD.team_id
        AND p.permission_name IN ('edit-registration', 'manage-team', 'captain-permissions');
        
        -- Check if this account has any other captain permissions
        IF NOT EXISTS (
          SELECT 1 FROM AccountPermissionScopes aps2
          JOIN Permissions p2 ON p2.id = aps2.permission_id
          WHERE aps2.account_id = account_id_found
          AND p2.permission_name IN ('edit-registration', 'manage-team', 'captain-permissions')
        ) THEN
          -- Remove captain role if no other captain permissions exist
          DELETE ar FROM AccountRoles ar
          JOIN Roles r ON r.id = ar.role_id
          WHERE ar.account_id = account_id_found
          AND r.role_name = 'captain';
        END IF;
      END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `cleanup_captain_permissions_on_update` AFTER UPDATE ON `SeasonTeamRegistrationPlayers` FOR EACH ROW BEGIN
      DECLARE account_id_found INT UNSIGNED;
      
      -- Get the account_id for this steam_id
      SET account_id_found = get_account_id_from_steam_id(NEW.steam_id);
      
      -- If captain or co-captain status was removed, clean up permissions
      IF (OLD.is_captain = 1 AND NEW.is_captain = 0) OR (OLD.is_co_captain = 1 AND NEW.is_co_captain = 0) THEN
        
        -- Remove captain-related permissions for this season/team
        DELETE aps FROM AccountPermissionScopes aps
        JOIN Permissions p ON p.id = aps.permission_id
        WHERE aps.account_id = account_id_found
        AND aps.season_id = NEW.season_id
        AND aps.team_id = NEW.team_id
        AND p.permission_name IN ('edit-registration', 'manage-team', 'captain-permissions');
        
        -- Check if this account has any other captain permissions
        IF NOT EXISTS (
          SELECT 1 FROM AccountPermissionScopes aps2
          JOIN Permissions p2 ON p2.id = aps2.permission_id
          WHERE aps2.account_id = account_id_found
          AND p2.permission_name IN ('edit-registration', 'manage-team', 'captain-permissions')
        ) THEN
          -- Remove captain role if no other captain permissions exist
          DELETE ar FROM AccountRoles ar
          JOIN Roles r ON r.id = ar.role_id
          WHERE ar.account_id = account_id_found
          AND r.role_name = 'captain';
        END IF;
      END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `unique_captain_per_team_season` BEFORE INSERT ON `SeasonTeamRegistrationPlayers` FOR EACH ROW BEGIN
      IF NEW.is_captain = 1 THEN
        IF EXISTS (
          SELECT 1 FROM SeasonTeamRegistrationPlayers 
          WHERE season_id = NEW.season_id 
          AND team_id = NEW.team_id 
          AND is_captain = 1
        ) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Only one captain allowed per team per season';
        END IF;
      END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `unique_captain_per_team_season_update` BEFORE UPDATE ON `SeasonTeamRegistrationPlayers` FOR EACH ROW BEGIN
      IF NEW.is_captain = 1 AND (OLD.is_captain = 0 OR OLD.is_captain IS NULL) THEN
        IF EXISTS (
          SELECT 1 FROM SeasonTeamRegistrationPlayers 
          WHERE season_id = NEW.season_id 
          AND team_id = NEW.team_id 
          AND is_captain = 1
          AND steam_id != NEW.steam_id
        ) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Only one captain allowed per team per season';
        END IF;
      END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `unique_co_captain_per_team_season` BEFORE INSERT ON `SeasonTeamRegistrationPlayers` FOR EACH ROW BEGIN
      IF NEW.is_co_captain = 1 THEN
        IF EXISTS (
          SELECT 1 FROM SeasonTeamRegistrationPlayers 
          WHERE season_id = NEW.season_id 
          AND team_id = NEW.team_id 
          AND is_co_captain = 1
        ) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Only one co-captain allowed per team per season';
        END IF;
      END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `unique_co_captain_per_team_season_update` BEFORE UPDATE ON `SeasonTeamRegistrationPlayers` FOR EACH ROW BEGIN
      IF NEW.is_co_captain = 1 AND (OLD.is_co_captain = 0 OR OLD.is_co_captain IS NULL) THEN
        IF EXISTS (
          SELECT 1 FROM SeasonTeamRegistrationPlayers 
          WHERE season_id = NEW.season_id 
          AND team_id = NEW.team_id 
          AND is_co_captain = 1
          AND steam_id != NEW.steam_id
        ) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Only one co-captain allowed per team per season';
        END IF;
      END IF;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `SeasonTeamRegistrations`
--

CREATE TABLE `SeasonTeamRegistrations` (
  `season_id` int(10) UNSIGNED NOT NULL,
  `team_id` int(10) UNSIGNED NOT NULL,
  `approved` tinyint(1) NOT NULL DEFAULT 0,
  `external_platform_id` varchar(255) DEFAULT NULL,
  `terms_and_conditions_approved` tinyint(1) NOT NULL,
  `approved_by` int(10) UNSIGNED DEFAULT NULL,
  `manual_validity_check_by` int(10) UNSIGNED DEFAULT NULL,
  `manual_validity_check_override` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `SeasonTeamRegistrations`
--
DELIMITER $$
CREATE TRIGGER `before_insert_team_registration` BEFORE INSERT ON `SeasonTeamRegistrations` FOR EACH ROW BEGIN
      IF EXISTS (
        SELECT 1 FROM SeasonTeamRegistrations
        WHERE season_id = NEW.season_id AND team_id = NEW.team_id
      ) THEN
        SET @errorMsg = CONCAT('Team ', NEW.team_id, ' is already registered for season ', NEW.season_id);
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @errorMsg;
      END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_unique_external_platform` BEFORE INSERT ON `SeasonTeamRegistrations` FOR EACH ROW BEGIN
      DECLARE platform_name VARCHAR(255);

      IF NEW.external_platform_id IS NOT NULL THEN
        -- Get the platform name from the Seasons table
        SELECT UPPER(platform) INTO platform_name
        FROM Seasons
        WHERE id = NEW.season_id
        LIMIT 1;

        IF EXISTS (
          SELECT 1 FROM SeasonTeamRegistrations
          WHERE season_id = NEW.season_id
            AND external_platform_id = NEW.external_platform_id
        ) THEN
          SET @errorMsg = CONCAT(platform_name, ' Platform ID "', NEW.external_platform_id, '" is already used for season ', NEW.season_id, '.');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @errorMsg;
        END IF;
      END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_team_registration` BEFORE UPDATE ON `SeasonTeamRegistrations` FOR EACH ROW BEGIN
      -- Only check if season_id or team_id is changing
      IF NEW.season_id <> OLD.season_id OR NEW.team_id <> OLD.team_id THEN
        IF EXISTS (
          SELECT 1 FROM SeasonTeamRegistrations
          WHERE season_id = NEW.season_id
            AND team_id = NEW.team_id
            -- Exclude the row being updated
            AND NOT (season_id = OLD.season_id AND team_id = OLD.team_id)
        ) THEN
          SET @errorMsg = CONCAT('Team ', NEW.team_id, ' is already registered for season ', NEW.season_id, '.');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @errorMsg;
        END IF;
      END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_unique_external_platform` BEFORE UPDATE ON `SeasonTeamRegistrations` FOR EACH ROW BEGIN
      DECLARE platform_name VARCHAR(255);
      
      IF (NEW.external_platform_id IS NOT NULL AND (
            NEW.external_platform_id <> OLD.external_platform_id OR
            NEW.season_id <> OLD.season_id
        )) THEN

        SELECT UPPER(platform) INTO platform_name
        FROM Seasons
        WHERE id = NEW.season_id
        LIMIT 1;

        IF EXISTS (
          SELECT 1 FROM SeasonTeamRegistrations
          WHERE season_id = NEW.season_id
            AND external_platform_id = NEW.external_platform_id
            AND NOT (season_id = OLD.season_id AND external_platform_id = OLD.external_platform_id)
        ) THEN
          SET @errorMsg = CONCAT(platform_name, ' Platform ID "', NEW.external_platform_id, '" is already used for season ', NEW.season_id, '.');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @errorMsg;
        END IF;

      END IF;
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `cleanup_captain_permissions_on_registration_delete` BEFORE DELETE ON `SeasonTeamRegistrations` FOR EACH ROW BEGIN
      DECLARE done INT DEFAULT FALSE;
      DECLARE steam_id_val BIGINT;
      DECLARE is_captain_val BOOLEAN;
      DECLARE is_co_captain_val BOOLEAN;
      DECLARE account_id_found INT UNSIGNED;
      DECLARE cur CURSOR FOR 
        SELECT steam_id, is_captain, is_co_captain 
        FROM SeasonTeamRegistrationPlayers 
        WHERE season_id = OLD.season_id AND team_id = OLD.team_id;
      DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
      
      OPEN cur;
      
      read_loop: LOOP
        FETCH cur INTO steam_id_val, is_captain_val, is_co_captain_val;
        IF done THEN
          LEAVE read_loop;
        END IF;
        
        -- If this was a captain or co-captain, clean up permissions
        IF is_captain_val = 1 OR is_co_captain_val = 1 THEN
          -- Get the account_id for this steam_id
          SET account_id_found = get_account_id_from_steam_id(steam_id_val);
          
          -- Remove captain-related permissions for this season/team
          DELETE aps FROM AccountPermissionScopes aps
          JOIN Permissions p ON p.id = aps.permission_id
          WHERE aps.account_id = account_id_found
          AND aps.season_id = OLD.season_id
          AND aps.team_id = OLD.team_id
          AND p.permission_name IN ('edit-registration', 'manage-team', 'captain-permissions');
          
          -- Check if this account has any other captain permissions
          IF NOT EXISTS (
            SELECT 1 FROM AccountPermissionScopes aps2
            JOIN Permissions p2 ON p2.id = aps2.permission_id
            WHERE aps2.account_id = account_id_found
            AND p2.permission_name IN ('edit-registration', 'manage-team', 'captain-permissions')
          ) THEN
            -- Remove captain role if no other captain permissions exist
            DELETE ar FROM AccountRoles ar
            JOIN Roles r ON r.id = ar.role_id
            WHERE ar.account_id = account_id_found
            AND r.role_name = 'captain';
          END IF;
        END IF;
      END LOOP;
      
      CLOSE cur;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `Stages`
--

CREATE TABLE `Stages` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `SteamPlayerKanaElo`
--

CREATE TABLE `SteamPlayerKanaElo` (
  `id` int(10) UNSIGNED NOT NULL,
  `kana_elo` int(11) NOT NULL,
  `steam_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `SteamPlayers`
--

CREATE TABLE `SteamPlayers` (
  `steam_id` bigint(20) NOT NULL,
  `nickname` varchar(255) NOT NULL,
  `account_id` int(10) UNSIGNED DEFAULT NULL,
  `faceit_nickname` varchar(255) DEFAULT NULL,
  `faceit_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `TeamGameScores`
--

CREATE TABLE `TeamGameScores` (
  `id` int(10) UNSIGNED NOT NULL,
  `match_id` int(10) UNSIGNED NOT NULL,
  `team_id` int(10) UNSIGNED NOT NULL,
  `match_game_id` int(10) UNSIGNED NOT NULL,
  `starting_side` enum('CT','T') NOT NULL,
  `score` tinyint(3) UNSIGNED NOT NULL,
  `halftime_score` tinyint(3) UNSIGNED NOT NULL,
  `overtime_score` tinyint(3) UNSIGNED DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `TeamRosters`
--

CREATE TABLE `TeamRosters` (
  `id` int(10) UNSIGNED NOT NULL,
  `team_id` int(10) UNSIGNED NOT NULL,
  `steam_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Teams`
--

CREATE TABLE `Teams` (
  `id` int(10) UNSIGNED NOT NULL,
  `organization_id` int(10) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `team_logo` varchar(255) NOT NULL DEFAULT 'nologo.png',
  `org_approved` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `UserPolicyAcceptances`
--

CREATE TABLE `UserPolicyAcceptances` (
  `id` int(10) UNSIGNED NOT NULL,
  `accepted_privacy_policy` tinyint(1) NOT NULL DEFAULT 0,
  `accepted_marketing` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `privacy_policy_version` varchar(255) NOT NULL DEFAULT '1',
  `account_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `UserPolicyAcceptances`
--
DELIMITER $$
CREATE TRIGGER `update_user_policy_acceptances_updated_at` BEFORE UPDATE ON `UserPolicyAcceptances` FOR EACH ROW SET NEW.updated_at = NOW()
$$
DELIMITER ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `AccountCasterUrls`
--
ALTER TABLE `AccountCasterUrls`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `accountcasterurls_account_id_unique` (`account_id`);

--
-- Indexes for table `AccountPermissionScopes`
--
ALTER TABLE `AccountPermissionScopes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `accountpermissionscopes_account_id_foreign` (`account_id`),
  ADD KEY `accountpermissionscopes_permission_id_foreign` (`permission_id`),
  ADD KEY `accountpermissionscopes_season_id_foreign` (`season_id`),
  ADD KEY `accountpermissionscopes_team_id_foreign` (`team_id`),
  ADD KEY `idx_account_permission_scopes_captain_validation` (`account_id`,`season_id`,`team_id`,`permission_id`);

--
-- Indexes for table `AccountRoles`
--
ALTER TABLE `AccountRoles`
  ADD PRIMARY KEY (`account_id`,`role_id`,`game_id`),
  ADD KEY `accountroles_role_id_foreign` (`role_id`),
  ADD KEY `accountroles_game_id_foreign` (`game_id`);

--
-- Indexes for table `Accounts`
--
ALTER TABLE `Accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `accounts_work_email_unique` (`work_email`);

--
-- Indexes for table `AuditLog`
--
ALTER TABLE `AuditLog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `auditlog_entity_type_entity_id_index` (`entity_type`,`entity_id`),
  ADD KEY `auditlog_user_id_index` (`user_id`),
  ADD KEY `auditlog_created_at_index` (`created_at`);

--
-- Indexes for table `FaceitWebhooks`
--
ALTER TABLE `FaceitWebhooks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Games`
--
ALTER TABLE `Games`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `GameTypes`
--
ALTER TABLE `GameTypes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_game_types_game` (`game_id`);

--
-- Indexes for table `KanahautomoRegistrationGameTypes`
--
ALTER TABLE `KanahautomoRegistrationGameTypes`
  ADD PRIMARY KEY (`game_type_id`,`kanahautomo_registration_id`),
  ADD KEY `fk_kana_reg_game_types_reg` (`kanahautomo_registration_id`);

--
-- Indexes for table `KanahautomoRegistrations`
--
ALTER TABLE `KanahautomoRegistrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kanahautomoregistrations_steam_id_organization_id_unique` (`steam_id`,`organization_id`),
  ADD KEY `kanahautomoregistrations_organization_id_foreign` (`organization_id`);

--
-- Indexes for table `knex_migrations`
--
ALTER TABLE `knex_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `knex_migrations_lock`
--
ALTER TABLE `knex_migrations_lock`
  ADD PRIMARY KEY (`index`);

--
-- Indexes for table `Leagues`
--
ALTER TABLE `Leagues`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `LinkedAccounts`
--
ALTER TABLE `LinkedAccounts`
  ADD PRIMARY KEY (`provider`,`provider_id`),
  ADD KEY `linkedaccounts_account_id_foreign` (`account_id`);

--
-- Indexes for table `MapRoundStats`
--
ALTER TABLE `MapRoundStats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `maproundstats_game_id_round_number_unique` (`match_game_id`,`round_number`),
  ADD KEY `maproundstats_ct_team_id_foreign` (`ct_team_id`),
  ADD KEY `maproundstats_t_team_id_foreign` (`t_team_id`);

--
-- Indexes for table `Maps`
--
ALTER TABLE `Maps`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `maps_name_unique` (`name`);

--
-- Indexes for table `Matches`
--
ALTER TABLE `Matches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `matches_season_id_league_id_foreign` (`season_id`,`league_id`),
  ADD KEY `matches_stage_foreign` (`stage`);

--
-- Indexes for table `MatchGameClips`
--
ALTER TABLE `MatchGameClips`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `match_game_clips_game_id_clip_type_unique` (`match_game_id`,`clip_type`),
  ADD KEY `matchgameclips_clip_steam_id_foreign` (`clip_steam_id`);

--
-- Indexes for table `MatchGames`
--
ALTER TABLE `MatchGames`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `matchgames_demofile_unique` (`demofile`),
  ADD UNIQUE KEY `matchgames_match_id_map_id_map_order_unique` (`match_id`,`map_id`,`map_order`),
  ADD KEY `matchgames_match_id_foreign` (`match_id`),
  ADD KEY `matchgames_map_id_foreign` (`map_id`);

--
-- Indexes for table `MatchTeamMapVetoes`
--
ALTER TABLE `MatchTeamMapVetoes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `matchteammapvetoes_match_id_team_id_veto_order_unique` (`match_id`,`team_id`,`veto_order`),
  ADD KEY `matchteammapvetoes_map_id_foreign` (`map_id`);

--
-- Indexes for table `MatchTeams`
--
ALTER TABLE `MatchTeams`
  ADD PRIMARY KEY (`match_id`,`team_id`),
  ADD KEY `matchteams_season_id_team_id_league_id_foreign` (`season_id`,`team_id`,`league_id`);

--
-- Indexes for table `Organizations`
--
ALTER TABLE `Organizations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `organizations_organization_code_unique` (`organization_code`),
  ADD UNIQUE KEY `organizations_name_unique` (`name`);

--
-- Indexes for table `OrganizerGames`
--
ALTER TABLE `OrganizerGames`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `organizergames_organizer_id_game_id_unique` (`organizer_id`,`game_id`),
  ADD KEY `organizergames_game_id_foreign` (`game_id`);

--
-- Indexes for table `Organizers`
--
ALTER TABLE `Organizers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `organizers_faceit_id_unique` (`faceit_id`);

--
-- Indexes for table `Permissions`
--
ALTER TABLE `Permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_permission_name_unique` (`permission_name`);

--
-- Indexes for table `PlayerStats`
--
ALTER TABLE `PlayerStats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `playerstats_game_id_steam_id_unique` (`match_game_id`,`steam_id`),
  ADD KEY `playerstats_steam_id_foreign` (`steam_id`),
  ADD KEY `playerstats_game_id_foreign` (`match_game_id`);

--
-- Indexes for table `PlayerTrades`
--
ALTER TABLE `PlayerTrades`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `playertrades_unique` (`match_game_id`,`trader_steam_id`,`killer_steam_id`,`victim_steam_id`,`round_number`),
  ADD KEY `playertrades_trader_steam_id_foreign` (`trader_steam_id`),
  ADD KEY `playertrades_killer_steam_id_foreign` (`killer_steam_id`),
  ADD KEY `playertrades_victim_steam_id_foreign` (`victim_steam_id`),
  ADD KEY `playertrades_game_id_foreign` (`match_game_id`);

--
-- Indexes for table `Reservations`
--
ALTER TABLE `Reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reservations_match_id_foreign` (`match_id`),
  ADD KEY `reservations_account_id_foreign` (`account_id`);

--
-- Indexes for table `RolePermissions`
--
ALTER TABLE `RolePermissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `rolepermissions_permission_id_foreign` (`permission_id`);

--
-- Indexes for table `Roles`
--
ALTER TABLE `Roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_role_name_unique` (`role_name`);

--
-- Indexes for table `SeasonLeagueExternalIds`
--
ALTER TABLE `SeasonLeagueExternalIds`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `seasonleagueexternalids_season_id_league_id_external_id_unique` (`season_id`,`league_id`,`external_id`),
  ADD KEY `seasonleagueexternalids_stage_id_foreign` (`stage_id`);

--
-- Indexes for table `SeasonLeagues`
--
ALTER TABLE `SeasonLeagues`
  ADD PRIMARY KEY (`season_id`,`league_id`),
  ADD KEY `seasonleagues_league_id_foreign` (`league_id`);

--
-- Indexes for table `SeasonLeagueTeams`
--
ALTER TABLE `SeasonLeagueTeams`
  ADD PRIMARY KEY (`season_id`,`league_id`,`team_id`),
  ADD KEY `seasonleagueteams_season_id_team_id_foreign` (`season_id`,`team_id`);

--
-- Indexes for table `SeasonPlayerApprovals`
--
ALTER TABLE `SeasonPlayerApprovals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_steam_id_season_id` (`steam_id`,`season_id`),
  ADD KEY `seasonplayerapprovals_season_id_foreign` (`season_id`),
  ADD KEY `seasonplayerapprovals_organization_id_foreign` (`organization_id`),
  ADD KEY `seasonplayerapprovals_team_id_foreign` (`team_id`),
  ADD KEY `seasonplayerapprovals_approved_by_id_foreign` (`approved_by_id`);

--
-- Indexes for table `SeasonPlayerRanks`
--
ALTER TABLE `SeasonPlayerRanks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `seasonplayerranks_steam_id_season_id_unique` (`steam_id`,`season_id`),
  ADD KEY `seasonplayerranks_season_id_foreign` (`season_id`);

--
-- Indexes for table `Seasons`
--
ALTER TABLE `Seasons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `seasons_game_id_foreign` (`game_id`),
  ADD KEY `seasons_game_type_id_foreign` (`game_type_id`),
  ADD KEY `seasons_organizer_id_foreign` (`organizer_id`);

--
-- Indexes for table `SeasonTeamPlayers`
--
ALTER TABLE `SeasonTeamPlayers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_season_team_player_match` (`season_id`,`team_id`,`steam_id`,`match_id`),
  ADD KEY `seasonteamplayers_season_id_team_id_foreign` (`season_id`,`team_id`),
  ADD KEY `seasonteamplayers_steam_id_foreign` (`steam_id`),
  ADD KEY `seasonteamplayers_match_id_foreign` (`match_id`),
  ADD KEY `seasonteamplayers_team_id_foreign` (`team_id`);

--
-- Indexes for table `SeasonTeamRegistrationPlayers`
--
ALTER TABLE `SeasonTeamRegistrationPlayers`
  ADD PRIMARY KEY (`season_id`,`team_id`,`steam_id`),
  ADD KEY `seasonteamregistrationplayers_steam_id_foreign` (`steam_id`),
  ADD KEY `idx_season_team_registration_players_captain` (`season_id`,`team_id`,`is_captain`,`is_co_captain`);

--
-- Indexes for table `SeasonTeamRegistrations`
--
ALTER TABLE `SeasonTeamRegistrations`
  ADD PRIMARY KEY (`season_id`,`team_id`),
  ADD UNIQUE KEY `unique_season_external_platform_id` (`season_id`,`external_platform_id`),
  ADD KEY `seasonteamregistrations_team_id_foreign` (`team_id`),
  ADD KEY `seasonteamregistrations_approved_by_foreign` (`approved_by`),
  ADD KEY `seasonteamregistrations_manual_validity_check_by_foreign` (`manual_validity_check_by`);

--
-- Indexes for table `Stages`
--
ALTER TABLE `Stages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `SteamPlayerKanaElo`
--
ALTER TABLE `SteamPlayerKanaElo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `steamplayerkanaelo_steam_id_unique` (`steam_id`);

--
-- Indexes for table `SteamPlayers`
--
ALTER TABLE `SteamPlayers`
  ADD PRIMARY KEY (`steam_id`),
  ADD UNIQUE KEY `steamplayers_faceit_id_unique` (`faceit_id`),
  ADD KEY `steamplayers_account_id_foreign` (`account_id`);

--
-- Indexes for table `TeamGameScores`
--
ALTER TABLE `TeamGameScores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `teamgamescores_game_id_team_id_unique` (`match_game_id`,`team_id`),
  ADD KEY `teamgamescores_match_id_team_id_foreign` (`match_id`,`team_id`),
  ADD KEY `teamgamescores_game_id_foreign` (`match_game_id`);

--
-- Indexes for table `TeamRosters`
--
ALTER TABLE `TeamRosters`
  ADD PRIMARY KEY (`id`),
  ADD KEY `teamrosters_team_id_foreign` (`team_id`),
  ADD KEY `teamrosters_steam_id_foreign` (`steam_id`);

--
-- Indexes for table `Teams`
--
ALTER TABLE `Teams`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `teams_name_unique` (`name`),
  ADD KEY `teams_organization_id_foreign` (`organization_id`);

--
-- Indexes for table `UserPolicyAcceptances`
--
ALTER TABLE `UserPolicyAcceptances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `userpolicyacceptances_account_id_privacy_policy_version_unique` (`account_id`,`privacy_policy_version`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `AccountCasterUrls`
--
ALTER TABLE `AccountCasterUrls`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `AccountPermissionScopes`
--
ALTER TABLE `AccountPermissionScopes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Accounts`
--
ALTER TABLE `Accounts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `AuditLog`
--
ALTER TABLE `AuditLog`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `FaceitWebhooks`
--
ALTER TABLE `FaceitWebhooks`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Games`
--
ALTER TABLE `Games`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `GameTypes`
--
ALTER TABLE `GameTypes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `KanahautomoRegistrations`
--
ALTER TABLE `KanahautomoRegistrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `knex_migrations`
--
ALTER TABLE `knex_migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `knex_migrations_lock`
--
ALTER TABLE `knex_migrations_lock`
  MODIFY `index` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Leagues`
--
ALTER TABLE `Leagues`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `MapRoundStats`
--
ALTER TABLE `MapRoundStats`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Maps`
--
ALTER TABLE `Maps`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Matches`
--
ALTER TABLE `Matches`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `MatchGameClips`
--
ALTER TABLE `MatchGameClips`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `MatchGames`
--
ALTER TABLE `MatchGames`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `MatchTeamMapVetoes`
--
ALTER TABLE `MatchTeamMapVetoes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Organizations`
--
ALTER TABLE `Organizations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `OrganizerGames`
--
ALTER TABLE `OrganizerGames`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Organizers`
--
ALTER TABLE `Organizers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Permissions`
--
ALTER TABLE `Permissions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `PlayerStats`
--
ALTER TABLE `PlayerStats`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `PlayerTrades`
--
ALTER TABLE `PlayerTrades`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Reservations`
--
ALTER TABLE `Reservations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Roles`
--
ALTER TABLE `Roles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `SeasonLeagueExternalIds`
--
ALTER TABLE `SeasonLeagueExternalIds`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `SeasonPlayerApprovals`
--
ALTER TABLE `SeasonPlayerApprovals`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `SeasonPlayerRanks`
--
ALTER TABLE `SeasonPlayerRanks`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Seasons`
--
ALTER TABLE `Seasons`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `SeasonTeamPlayers`
--
ALTER TABLE `SeasonTeamPlayers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Stages`
--
ALTER TABLE `Stages`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `SteamPlayerKanaElo`
--
ALTER TABLE `SteamPlayerKanaElo`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `TeamGameScores`
--
ALTER TABLE `TeamGameScores`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `TeamRosters`
--
ALTER TABLE `TeamRosters`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Teams`
--
ALTER TABLE `Teams`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `UserPolicyAcceptances`
--
ALTER TABLE `UserPolicyAcceptances`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `AccountCasterUrls`
--
ALTER TABLE `AccountCasterUrls`
  ADD CONSTRAINT `accountcasterurls_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `Accounts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `AccountPermissionScopes`
--
ALTER TABLE `AccountPermissionScopes`
  ADD CONSTRAINT `accountpermissionscopes_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `Accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `accountpermissionscopes_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `Permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `accountpermissionscopes_season_id_foreign` FOREIGN KEY (`season_id`) REFERENCES `Seasons` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `accountpermissionscopes_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `Teams` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `AccountRoles`
--
ALTER TABLE `AccountRoles`
  ADD CONSTRAINT `accountroles_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `Accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `accountroles_game_id_foreign` FOREIGN KEY (`game_id`) REFERENCES `Games` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `accountroles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `Roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `AuditLog`
--
ALTER TABLE `AuditLog`
  ADD CONSTRAINT `auditlog_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `Accounts` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `GameTypes`
--
ALTER TABLE `GameTypes`
  ADD CONSTRAINT `fk_game_types_game` FOREIGN KEY (`game_id`) REFERENCES `Games` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `KanahautomoRegistrationGameTypes`
--
ALTER TABLE `KanahautomoRegistrationGameTypes`
  ADD CONSTRAINT `fk_kana_reg_game_types_game_type` FOREIGN KEY (`game_type_id`) REFERENCES `GameTypes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kana_reg_game_types_reg` FOREIGN KEY (`kanahautomo_registration_id`) REFERENCES `KanahautomoRegistrations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `KanahautomoRegistrations`
--
ALTER TABLE `KanahautomoRegistrations`
  ADD CONSTRAINT `kanahautomoregistrations_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `Organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `kanahautomoregistrations_steam_id_foreign` FOREIGN KEY (`steam_id`) REFERENCES `SteamPlayers` (`steam_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `LinkedAccounts`
--
ALTER TABLE `LinkedAccounts`
  ADD CONSTRAINT `linkedaccounts_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `Accounts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `MapRoundStats`
--
ALTER TABLE `MapRoundStats`
  ADD CONSTRAINT `maproundstats_ct_team_id_foreign` FOREIGN KEY (`ct_team_id`) REFERENCES `Teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `maproundstats_game_id_foreign` FOREIGN KEY (`match_game_id`) REFERENCES `MatchGames` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `maproundstats_t_team_id_foreign` FOREIGN KEY (`t_team_id`) REFERENCES `Teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Matches`
--
ALTER TABLE `Matches`
  ADD CONSTRAINT `matches_season_id_league_id_foreign` FOREIGN KEY (`season_id`,`league_id`) REFERENCES `SeasonLeagues` (`season_id`, `league_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `matches_stage_foreign` FOREIGN KEY (`stage`) REFERENCES `Stages` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `MatchGameClips`
--
ALTER TABLE `MatchGameClips`
  ADD CONSTRAINT `matchgameclips_clip_steam_id_foreign` FOREIGN KEY (`clip_steam_id`) REFERENCES `SteamPlayers` (`steam_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `matchgameclips_game_id_foreign` FOREIGN KEY (`match_game_id`) REFERENCES `MatchGames` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `MatchGames`
--
ALTER TABLE `MatchGames`
  ADD CONSTRAINT `matchgames_map_id_foreign` FOREIGN KEY (`map_id`) REFERENCES `Maps` (`id`),
  ADD CONSTRAINT `matchgames_match_id_foreign` FOREIGN KEY (`match_id`) REFERENCES `Matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `MatchTeamMapVetoes`
--
ALTER TABLE `MatchTeamMapVetoes`
  ADD CONSTRAINT `matchteammapvetoes_map_id_foreign` FOREIGN KEY (`map_id`) REFERENCES `Maps` (`id`),
  ADD CONSTRAINT `matchteammapvetoes_match_id_team_id_foreign` FOREIGN KEY (`match_id`,`team_id`) REFERENCES `MatchTeams` (`match_id`, `team_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `MatchTeams`
--
ALTER TABLE `MatchTeams`
  ADD CONSTRAINT `matchteams_match_id_foreign` FOREIGN KEY (`match_id`) REFERENCES `Matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `matchteams_season_id_team_id_league_id_foreign` FOREIGN KEY (`season_id`,`team_id`,`league_id`) REFERENCES `SeasonLeagueTeams` (`season_id`, `team_id`, `league_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `OrganizerGames`
--
ALTER TABLE `OrganizerGames`
  ADD CONSTRAINT `organizergames_game_id_foreign` FOREIGN KEY (`game_id`) REFERENCES `Games` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `organizergames_organizer_id_foreign` FOREIGN KEY (`organizer_id`) REFERENCES `Organizers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `PlayerStats`
--
ALTER TABLE `PlayerStats`
  ADD CONSTRAINT `playerstats_game_id_foreign` FOREIGN KEY (`match_game_id`) REFERENCES `MatchGames` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `playerstats_steam_id_foreign` FOREIGN KEY (`steam_id`) REFERENCES `SteamPlayers` (`steam_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `PlayerTrades`
--
ALTER TABLE `PlayerTrades`
  ADD CONSTRAINT `playertrades_game_id_foreign` FOREIGN KEY (`match_game_id`) REFERENCES `MatchGames` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `playertrades_killer_steam_id_foreign` FOREIGN KEY (`killer_steam_id`) REFERENCES `SteamPlayers` (`steam_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `playertrades_trader_steam_id_foreign` FOREIGN KEY (`trader_steam_id`) REFERENCES `SteamPlayers` (`steam_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `playertrades_victim_steam_id_foreign` FOREIGN KEY (`victim_steam_id`) REFERENCES `SteamPlayers` (`steam_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Reservations`
--
ALTER TABLE `Reservations`
  ADD CONSTRAINT `reservations_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `Accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `reservations_match_id_foreign` FOREIGN KEY (`match_id`) REFERENCES `Matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `RolePermissions`
--
ALTER TABLE `RolePermissions`
  ADD CONSTRAINT `rolepermissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `Permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rolepermissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `Roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `SeasonLeagueExternalIds`
--
ALTER TABLE `SeasonLeagueExternalIds`
  ADD CONSTRAINT `seasonleagueexternalids_season_id_league_id_foreign` FOREIGN KEY (`season_id`,`league_id`) REFERENCES `SeasonLeagues` (`season_id`, `league_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `seasonleagueexternalids_stage_id_foreign` FOREIGN KEY (`stage_id`) REFERENCES `Stages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `SeasonLeagues`
--
ALTER TABLE `SeasonLeagues`
  ADD CONSTRAINT `seasonleagues_league_id_foreign` FOREIGN KEY (`league_id`) REFERENCES `Leagues` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `seasonleagues_season_id_foreign` FOREIGN KEY (`season_id`) REFERENCES `Seasons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `SeasonLeagueTeams`
--
ALTER TABLE `SeasonLeagueTeams`
  ADD CONSTRAINT `seasonleagueteams_season_id_league_id_foreign` FOREIGN KEY (`season_id`,`league_id`) REFERENCES `SeasonLeagues` (`season_id`, `league_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `SeasonPlayerApprovals`
--
ALTER TABLE `SeasonPlayerApprovals`
  ADD CONSTRAINT `seasonplayerapprovals_approved_by_id_foreign` FOREIGN KEY (`approved_by_id`) REFERENCES `Accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `seasonplayerapprovals_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `Organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `seasonplayerapprovals_season_id_foreign` FOREIGN KEY (`season_id`) REFERENCES `Seasons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `seasonplayerapprovals_steam_id_foreign` FOREIGN KEY (`steam_id`) REFERENCES `SteamPlayers` (`steam_id`),
  ADD CONSTRAINT `seasonplayerapprovals_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `Teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `SeasonPlayerRanks`
--
ALTER TABLE `SeasonPlayerRanks`
  ADD CONSTRAINT `seasonplayerranks_season_id_foreign` FOREIGN KEY (`season_id`) REFERENCES `Seasons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `seasonplayerranks_steam_id_foreign` FOREIGN KEY (`steam_id`) REFERENCES `SteamPlayers` (`steam_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Seasons`
--
ALTER TABLE `Seasons`
  ADD CONSTRAINT `seasons_game_id_foreign` FOREIGN KEY (`game_id`) REFERENCES `Games` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `seasons_game_type_id_foreign` FOREIGN KEY (`game_type_id`) REFERENCES `GameTypes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `seasons_organizer_id_foreign` FOREIGN KEY (`organizer_id`) REFERENCES `Organizers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `SeasonTeamPlayers`
--
ALTER TABLE `SeasonTeamPlayers`
  ADD CONSTRAINT `seasonteamplayers_match_id_foreign` FOREIGN KEY (`match_id`) REFERENCES `Matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `seasonteamplayers_steam_id_foreign` FOREIGN KEY (`steam_id`) REFERENCES `SteamPlayers` (`steam_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `seasonteamplayers_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `Teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `SeasonTeamRegistrationPlayers`
--
ALTER TABLE `SeasonTeamRegistrationPlayers`
  ADD CONSTRAINT `seasonteamregistrationplayers_season_id_team_id_foreign` FOREIGN KEY (`season_id`,`team_id`) REFERENCES `SeasonTeamRegistrations` (`season_id`, `team_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `seasonteamregistrationplayers_steam_id_foreign` FOREIGN KEY (`steam_id`) REFERENCES `SteamPlayers` (`steam_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `SeasonTeamRegistrations`
--
ALTER TABLE `SeasonTeamRegistrations`
  ADD CONSTRAINT `seasonteamregistrations_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `Accounts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `seasonteamregistrations_manual_validity_check_by_foreign` FOREIGN KEY (`manual_validity_check_by`) REFERENCES `Accounts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `seasonteamregistrations_season_id_foreign` FOREIGN KEY (`season_id`) REFERENCES `Seasons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `seasonteamregistrations_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `Teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `SteamPlayerKanaElo`
--
ALTER TABLE `SteamPlayerKanaElo`
  ADD CONSTRAINT `steamplayerkanaelo_steam_id_foreign` FOREIGN KEY (`steam_id`) REFERENCES `SteamPlayers` (`steam_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `SteamPlayers`
--
ALTER TABLE `SteamPlayers`
  ADD CONSTRAINT `steamplayers_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `Accounts` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `TeamGameScores`
--
ALTER TABLE `TeamGameScores`
  ADD CONSTRAINT `teamgamescores_game_id_foreign` FOREIGN KEY (`match_game_id`) REFERENCES `MatchGames` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `teamgamescores_match_id_team_id_foreign` FOREIGN KEY (`match_id`,`team_id`) REFERENCES `MatchTeams` (`match_id`, `team_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `TeamRosters`
--
ALTER TABLE `TeamRosters`
  ADD CONSTRAINT `teamrosters_steam_id_foreign` FOREIGN KEY (`steam_id`) REFERENCES `SteamPlayers` (`steam_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `teamrosters_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `Teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Teams`
--
ALTER TABLE `Teams`
  ADD CONSTRAINT `teams_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `Organizations` (`id`);

--
-- Constraints for table `UserPolicyAcceptances`
--
ALTER TABLE `UserPolicyAcceptances`
  ADD CONSTRAINT `userpolicyacceptances_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `Accounts` (`id`) ON DELETE CASCADE;

DELIMITER $$
--
-- Events
--
CREATE DEFINER=`kanamain`@`%` EVENT `delete_old_audit_logs` ON SCHEDULE EVERY 1 DAY STARTS '2025-05-21 06:26:17' ON COMPLETION NOT PRESERVE ENABLE DO DELETE FROM AuditLog WHERE created_at < NOW() - INTERVAL 1 YEAR$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
