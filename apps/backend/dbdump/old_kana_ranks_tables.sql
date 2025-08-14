-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: eggo-devdb
-- Generation Time: Jul 14, 2025 at 04:14 PM
-- Server version: 11.7.2-MariaDB
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

-- --------------------------------------------------------

--
-- Table structure for table `ranks`
--

CREATE TABLE `ranks` (
  `steamID` varchar(20) NOT NULL,
  `rank` tinyint(4) DEFAULT NULL,
  `cs2rank` smallint(6) DEFAULT NULL,
  `level` tinyint(3) UNSIGNED DEFAULT NULL,
  `kukkoDate` timestamp NULL DEFAULT '1970-01-01 10:00:00',
  `faceDate` timestamp NULL DEFAULT '1970-01-01 10:00:00',
  `hours` mediumint(9) NOT NULL DEFAULT -1,
  `faceELO` smallint(5) UNSIGNED DEFAULT NULL,
  `kanaelo` smallint(6) NOT NULL DEFAULT 0,
  `fkd` decimal(3,2) DEFAULT NULL,
  `ekd` decimal(4,2) DEFAULT NULL,
  `esportalElo` smallint(5) UNSIGNED DEFAULT NULL,
  `esportalRank` tinyint(3) UNSIGNED DEFAULT NULL,
  `calculus` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ranks_old_s10`
--

CREATE TABLE `ranks_old_s10` (
  `steamID` varchar(25) NOT NULL,
  `rank` int(11) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `kukkoDate` timestamp NULL DEFAULT '1970-01-01 10:00:00',
  `faceDate` timestamp NULL DEFAULT '1970-01-01 10:00:00',
  `hours` int(5) NOT NULL DEFAULT -1,
  `faceELO` int(11) NOT NULL DEFAULT 800,
  `kanaelo` int(11) NOT NULL DEFAULT 0,
  `fkd` decimal(3,2) DEFAULT NULL,
  `ekd` decimal(3,2) DEFAULT NULL,
  `esportalElo` int(11) DEFAULT NULL,
  `esportalRank` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ranks_s11`
--

CREATE TABLE `ranks_s11` (
  `steamID` varchar(25) NOT NULL,
  `rank` int(11) DEFAULT NULL,
  `cs2rank` int(11) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `kukkoDate` timestamp NULL DEFAULT '1970-01-01 10:00:00',
  `faceDate` timestamp NULL DEFAULT '1970-01-01 10:00:00',
  `hours` int(5) NOT NULL DEFAULT -1,
  `faceELO` int(11) NOT NULL DEFAULT 800,
  `kanaelo` int(11) NOT NULL DEFAULT 0,
  `fkd` decimal(3,2) DEFAULT NULL,
  `ekd` decimal(3,2) DEFAULT NULL,
  `esportalElo` int(11) DEFAULT NULL,
  `esportalRank` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ranks_s12`
--

CREATE TABLE `ranks_s12` (
  `steamID` varchar(25) NOT NULL,
  `rank` int(11) DEFAULT NULL,
  `oldrank` int(11) NOT NULL DEFAULT -1,
  `cs2rank` int(11) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `kukkoDate` timestamp NULL DEFAULT '1970-01-01 10:00:00',
  `faceDate` timestamp NULL DEFAULT '1970-01-01 10:00:00',
  `hours` int(5) NOT NULL DEFAULT -1,
  `faceELO` int(11) NOT NULL DEFAULT 800,
  `kanaelo` int(11) NOT NULL DEFAULT 0,
  `fkd` decimal(3,2) DEFAULT NULL,
  `ekd` decimal(4,2) DEFAULT NULL,
  `esportalElo` int(11) DEFAULT NULL,
  `esportalRank` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ranks_s13`
--

CREATE TABLE `ranks_s13` (
  `steamID` varchar(25) NOT NULL,
  `rank` int(11) DEFAULT NULL,
  `oldrank` int(11) NOT NULL DEFAULT -1,
  `cs2rank` int(11) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `kukkoDate` timestamp NULL DEFAULT '1970-01-01 10:00:00',
  `faceDate` timestamp NULL DEFAULT '1970-01-01 10:00:00',
  `hours` int(5) NOT NULL DEFAULT -1,
  `faceELO` int(11) NOT NULL DEFAULT 800,
  `kanaelo` int(11) NOT NULL DEFAULT 0,
  `fkd` decimal(3,2) DEFAULT NULL,
  `ekd` decimal(4,2) DEFAULT NULL,
  `esportalElo` int(11) DEFAULT NULL,
  `esportalRank` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ranks_s14`
--

CREATE TABLE `ranks_s14` (
  `steamID` varchar(25) NOT NULL,
  `rank` int(11) DEFAULT NULL,
  `oldrank` int(11) NOT NULL DEFAULT -1,
  `cs2rank` int(11) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `kukkoDate` timestamp NULL DEFAULT '1970-01-01 10:00:00',
  `faceDate` timestamp NULL DEFAULT '1970-01-01 10:00:00',
  `hours` int(5) NOT NULL DEFAULT -1,
  `faceELO` int(11) NOT NULL DEFAULT 800,
  `kanaelo` int(11) NOT NULL DEFAULT 0,
  `fkd` decimal(3,2) DEFAULT NULL,
  `ekd` decimal(4,2) DEFAULT NULL,
  `esportalElo` int(11) DEFAULT NULL,
  `esportalRank` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ranks`
--
ALTER TABLE `ranks`
  ADD PRIMARY KEY (`steamID`),
  ADD UNIQUE KEY `steamID` (`steamID`);

--
-- Indexes for table `ranks_old_s10`
--
ALTER TABLE `ranks_old_s10`
  ADD PRIMARY KEY (`steamID`),
  ADD UNIQUE KEY `steamID` (`steamID`);

--
-- Indexes for table `ranks_s11`
--
ALTER TABLE `ranks_s11`
  ADD PRIMARY KEY (`steamID`),
  ADD UNIQUE KEY `steamID` (`steamID`);

--
-- Indexes for table `ranks_s12`
--
ALTER TABLE `ranks_s12`
  ADD PRIMARY KEY (`steamID`),
  ADD UNIQUE KEY `steamID` (`steamID`);

--
-- Indexes for table `ranks_s13`
--
ALTER TABLE `ranks_s13`
  ADD PRIMARY KEY (`steamID`),
  ADD UNIQUE KEY `steamID` (`steamID`);

--
-- Indexes for table `ranks_s14`
--
ALTER TABLE `ranks_s14`
  ADD PRIMARY KEY (`steamID`),
  ADD UNIQUE KEY `steamID` (`steamID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
