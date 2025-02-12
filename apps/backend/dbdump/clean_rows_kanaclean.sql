-- Clean old kana db rows, will only run on kana db

-- Delete players that steamID not start with 7
DELETE FROM players WHERE steamID NOT LIKE '7%';

-- Delete stats_all_seasons that steamID not start with 7
DELETE FROM stats_all_seasons WHERE steamID NOT LIKE '7%';

-- Delete teams that are not in any league
DELETE FROM teams WHERE leagueID IN (SELECT DISTINCT a.leagueID FROM teams a LEFT JOIN leagues m ON m.id = a.leagueID WHERE m.id IS NULL);


-- Delete matches that are not in any league
DELETE FROM matches WHERE leagueID IN (SELECT DISTINCT m.leagueID FROM matches m LEFT JOIN leagues t ON t.id = m.leagueID WHERE t.id IS NULL);

-- Delete players that are not in any team
DELETE FROM players WHERE teamId IN (SELECT DISTINCT m.teamId FROM players m LEFT JOIN teams t ON t.id = m.teamId WHERE t.id IS NULL);

-- Delete matches that are not in any team
DELETE FROM matches WHERE team1 IN (SELECT DISTINCT m.team1 FROM matches m LEFT JOIN teams t ON t.id = m.team1 WHERE t.id IS NULL);

-- Delete matches that are not in any league
DELETE FROM matches WHERE team2 IN (SELECT DISTINCT m.team2 FROM matches m LEFT JOIN teams t ON t.id = m.team2 WHERE t.id IS NULL);


-- Delete trades that are not in any match
DELETE FROM trades WHERE matchID IN (SELECT DISTINCT a.matchID FROM trades a LEFT JOIN matches m ON m.id = a.matchID WHERE m.id IS NULL);

-- Delete roundInfo that are not in any match
DELETE FROM roundInfo WHERE matchID IN (SELECT DISTINCT a.matchID FROM roundInfo a LEFT JOIN matches m ON m.id = a.matchID WHERE m.id IS NULL);

-- Delete afterplant that are not in any match
DELETE FROM afterplant WHERE matchID IN (SELECT DISTINCT a.matchID FROM afterplant a LEFT JOIN matches m ON m.id = a.matchID WHERE m.id IS NULL);

-- Delete stats_all_seasons that are not in any match
DELETE FROM stats_all_seasons WHERE matchID IN (SELECT DISTINCT p.matchID FROM stats_all_seasons p LEFT JOIN matches t ON t.id = p.matchID WHERE t.id IS NULL);

-- Delete stats_all_seasons that are not in any player
DELETE FROM stats_all_seasons WHERE steamID IN (SELECT DISTINCT p.steamID FROM stats_all_seasons p LEFT JOIN players t ON t.steamID = p.steamID WHERE t.steamID IS NULL);

-- Delete ranks that are not in any player
DELETE FROM ranks WHERE steamID IN (SELECT DISTINCT a.steamID FROM ranks a LEFT JOIN players m ON m.steamID = a.steamID WHERE m.steamID IS NULL);

DELETE FROM trades WHERE Trader IN (SELECT DISTINCT a.Trader FROM trades a LEFT JOIN players m ON m.steamID = a.Trader WHERE m.steamID IS NULL);

DELETE FROM trades WHERE Victim IN (SELECT DISTINCT a.Victim FROM trades a LEFT JOIN players m ON m.steamID = a.Victim WHERE m.steamID IS NULL);

DELETE FROM trades WHERE Killer IN (SELECT DISTINCT a.Killer FROM trades a LEFT JOIN players m ON m.steamID = a.Killer WHERE m.steamID IS NULL);

-- Remove tabs and spaces from steamID
UPDATE players SET steamID = replace(ltrim(rtrim(replace(steamID, char(9), ' '))),' ', char(9));

-- Trailing slash in steamID
UPDATE `players` SET `steamID` = '76561197991248173' WHERE `players`.`id` = 9457;
UPDATE `players` SET `steamID` = '76561197967466825' WHERE `players`.`id` = 11648;



-- Remove duplicate players in the same team, remain the one with the lowest id
DELETE FROM players
WHERE id NOT IN (
    SELECT MIN(id)
    FROM players
    GROUP BY steamID, teamId
);




ALTER TABLE `ranks` CHANGE `steamID` `steamID` VARCHAR(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL;

ALTER TABLE `stats_all_seasons` CHANGE `steamID` `steamID` VARCHAR(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL;

ALTER TABLE `players` ADD `isSub` BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE players SET isSub = '1' WHERE id IN (235, 592, 594, 595, 675, 676, 677, 719, 720, 1119, 1129, 1130, 1131, 1296, 1299, 1301, 1403, 1514, 1701, 1704, 1707, 1708, 1760, 1762, 1771, 1774, 1798, 1799, 1833, 1835, 1839, 1840, 1933, 1935, 1936, 1937, 1978, 1979, 2003, 2004, 2006, 2056, 2134, 2192, 2193, 2292, 2293, 2294, 2295, 2346, 2349, 2564, 2386, 2391, 2392, 2402, 2403, 2404, 2405, 2408, 2526, 2938, 3112, 4220, 3917, 3918, 4172, 4174, 4193, 5376, 5521, 5678, 5679, 5238, 6098, 7612, 7609, 8155, 9492, 9493, 9494, 9495, 9496, 9497, 9498, 9500, 9501, 9502, 9503, 9504, 9506, 9508, 9509, 9510, 10938, 10939, 10949, 11657, 11658, 11660, 11661, 11662, 11663, 11664, 11665, 11666, 11669, 11670, 11671, 11673, 11674, 11675, 11676, 16919, 16920);

UPDATE matches SET leagueID = 50 WHERE id = 8316;

-- These should pass, so we can migrate to new db
ALTER TABLE `afterplant` ADD CONSTRAINT `match_id_fk` FOREIGN KEY (`matchID`) REFERENCES `matches` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `trades` ADD CONSTRAINT `matches_id_fk` FOREIGN KEY (`matchID`) REFERENCES `matches`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `stats_all_seasons` ADD CONSTRAINT `player_staemid` FOREIGN KEY (`steamID`) REFERENCES `players`(`steamID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `stats_all_seasons` ADD CONSTRAINT `match_stats_fk` FOREIGN KEY (`matchID`) REFERENCES `matches`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `teams` ADD CONSTRAINT `league_id_fk` FOREIGN KEY (`leagueID`) REFERENCES `leagues`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `roundInfo` ADD CONSTRAINT `matches_fk` FOREIGN KEY (`matchID`) REFERENCES `matches`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `ranks` ADD CONSTRAINT `steam_id_players_fk` FOREIGN KEY (`steamID`) REFERENCES `players`(`steamID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `matches` ADD CONSTRAINT `team1_fk` FOREIGN KEY (`team1`) REFERENCES `teams`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `matches` ADD CONSTRAINT `team2_fk` FOREIGN KEY (`team2`) REFERENCES `teams`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `trades` ADD CONSTRAINT `trader_fk` FOREIGN KEY (`Trader`) REFERENCES `players`(`steamID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `trades` ADD CONSTRAINT `killer_fk` FOREIGN KEY (`Killer`) REFERENCES `players`(`steamID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `trades` ADD CONSTRAINT `victim_fk` FOREIGN KEY (`Victim`) REFERENCES `players`(`steamID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `players` ADD CONSTRAINT `team_id_player_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;


DELETE FROM teamsbuild_s11
WHERE id IN (SELECT t.id FROM teamsbuild_s11 t WHERE Name LIKE "Team Organization%");

DELETE FROM teamsbuild_s12
WHERE id IN (SELECT t.id FROM teamsbuild_s12 t WHERE Name LIKE "Team Organization%");

DELETE FROM teamsbuild_s13
WHERE id IN (SELECT t.id FROM teamsbuild_s13 t WHERE Name LIKE "Team Organization%");

DELETE FROM teamsbuild_s14
WHERE id IN (SELECT t.id FROM teamsbuild_s14 t WHERE Name LIKE "Team Organization%");

DELETE FROM teamsbuild_s11
WHERE id IN (SELECT t.id FROM teamsbuild_s11 t WHERE yritys LIKE "Organization%");

DELETE FROM teamsbuild_s12
WHERE id IN (SELECT t.id FROM teamsbuild_s12 t WHERE yritys LIKE "Organization%");

DELETE FROM teamsbuild_s13
WHERE id IN (SELECT t.id FROM teamsbuild_s13 t WHERE yritys LIKE "Organization%");

DELETE FROM teamsbuild_s14
WHERE id IN (SELECT t.id FROM teamsbuild_s14 t WHERE yritys LIKE "Organization%");

DELETE FROM teamsbuild_s11
WHERE id IN (SELECT t.id FROM teamsbuild_s11 t WHERE yrityksen_y_tunnus LIKE "1234567-8");

DELETE FROM teamsbuild_s12
WHERE id IN (SELECT t.id FROM teamsbuild_s12 t WHERE yrityksen_y_tunnus LIKE "1234567-8");

DELETE FROM teamsbuild_s13
WHERE id IN (SELECT t.id FROM teamsbuild_s13 t WHERE yrityksen_y_tunnus LIKE "1234567-8");

DELETE FROM teamsbuild_s14
WHERE id IN (SELECT t.id FROM teamsbuild_s14 t WHERE yrityksen_y_tunnus LIKE "1234567-8");


UPDATE
    teamsbuild
SET
    yrityksen_y_tunnus = replace(ltrim(rtrim(replace(yrityksen_y_tunnus, char(9), '    '))),'    ', char(9));

UPDATE
    teamsbuild_s11
SET
    yrityksen_y_tunnus = replace(ltrim(rtrim(replace(yrityksen_y_tunnus, char(9), '    '))),'    ', char(9));

UPDATE teamsbuild_s12
SET
    yrityksen_y_tunnus = replace(ltrim(rtrim(replace(yrityksen_y_tunnus, char(9), '    '))),'    ', char(9));

UPDATE teamsbuild_s13
SET
    yrityksen_y_tunnus = replace(ltrim(rtrim(replace(yrityksen_y_tunnus, char(9), '    '))),'    ', char(9));

UPDATE teamsbuild_s14
SET
    yrityksen_y_tunnus = replace(ltrim(rtrim(replace(yrityksen_y_tunnus, char(9), '    '))),'    ', char(9));

UPDATE
    teamsbuild
SET
    Name = replace(ltrim(rtrim(replace(Name, char(9), '    '))),'    ', char(9));

UPDATE
    teamsbuild_s11
SET
    Name = replace(ltrim(rtrim(replace(Name, char(9), '    '))),'    ', char(9));

UPDATE
    teamsbuild_s12
SET
    Name = replace(ltrim(rtrim(replace(Name, char(9), '    '))),'    ', char(9));

UPDATE
    teamsbuild_s13
SET
    Name = replace(ltrim(rtrim(replace(Name, char(9), '    '))),'    ', char(9));

UPDATE
    teamsbuild_s14
SET
    Name = replace(ltrim(rtrim(replace(Name, char(9), '    '))),'    ', char(9));

UPDATE teamsbuild
SET yritys = replace(ltrim(rtrim(replace(yritys, char(9), '    '))),'    ', char(9));

UPDATE teamsbuild_s11
SET yritys = replace(ltrim(rtrim(replace(yritys, char(9), '    '))),'    ', char(9));

UPDATE teamsbuild_s12
SET yritys = replace(ltrim(rtrim(replace(yritys, char(9), '    '))),'    ', char(9));

UPDATE teamsbuild_s13
SET yritys = replace(ltrim(rtrim(replace(yritys, char(9), '    '))),'    ', char(9));

UPDATE teamsbuild_s14
SET yritys = replace(ltrim(rtrim(replace(yritys, char(9), '    '))),'    ', char(9));


-- Remove duplicate afterplant rows per round for matches
DELETE FROM afterplant
WHERE id NOT IN (
    SELECT MAX(id)
    FROM afterplant
    GROUP BY matchID, round
);
