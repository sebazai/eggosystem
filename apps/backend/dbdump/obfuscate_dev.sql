-- Season 11 and 14
DELETE FROM Seasons
WHERE id NOT IN (11, 14);
DELETE FROM SteamPlayers
WHERE steam_id NOT IN (
        SELECT steam_id
        FROM SeasonTeamPlayers
    );
DELETE FROM Teams
WHERE id NOT IN (
        SELECT team_id
        FROM SeasonTeamRegistrations
    );
CREATE TABLE fake_names (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL
);
INSERT INTO fake_names (firstname, lastname)
VALUES ('John', 'Smith'),
    ('Jane', 'Doe'),
    ('Alice', 'Johnson'),
    ('Robert', 'Brown'),
    ('Emily', 'Davis'),
    ('Michael', 'Miller'),
    ('Sarah', 'Wilson'),
    ('David', 'Moore'),
    ('Laura', 'Taylor'),
    ('James', 'Anderson'),
    ('Chris', 'Thomas'),
    ('Jessica', 'White'),
    ('Daniel', 'Harris'),
    ('Sophia', 'Martin'),
    ('Matthew', 'Thompson'),
    ('Olivia', 'Garcia'),
    ('Andrew', 'Martinez'),
    ('Isabella', 'Robinson'),
    ('Ethan', 'Clark'),
    ('Ava', 'Rodriguez'),
    ('William', 'Lewis'),
    ('Mia', 'Lee'),
    ('Alexander', 'Walker'),
    ('Charlotte', 'Hall'),
    ('Benjamin', 'Allen'),
    ('Amelia', 'Young'),
    ('Samuel', 'Hernandez'),
    ('Harper', 'King'),
    ('Elijah', 'Wright'),
    ('Evelyn', 'Lopez'),
    ('Mason', 'Scott'),
    ('Abigail', 'Green'),
    ('Logan', 'Adams'),
    ('Ella', 'Baker'),
    ('Jacob', 'Gonzalez'),
    ('Scarlett', 'Nelson'),
    ('Lucas', 'Carter'),
    ('Grace', 'Mitchell'),
    ('Henry', 'Perez'),
    ('Lily', 'Roberts'),
    ('Gabriel', 'Turner'),
    ('Victoria', 'Phillips'),
    ('Owen', 'Campbell'),
    ('Hannah', 'Parker'),
    ('Carter', 'Evans'),
    ('Chloe', 'Edwards'),
    ('Sebastian', 'Collins'),
    ('Aria', 'Stewart'),
    ('Jack', 'Morris'),
    ('Madison', 'Nguyen'),
    ('Julian', 'Murphy'),
    ('Sofia', 'Rivera'),
    ('Leo', 'Cook'),
    ('Penelope', 'Rogers'),
    ('Dylan', 'Morgan'),
    ('Layla', 'Peterson'),
    ('Luke', 'Reed'),
    ('Riley', 'Bailey'),
    ('Nathan', 'Bell'),
    ('Zoe', 'Gomez'),
    ('Caleb', 'Kelly'),
    ('Nora', 'Howard'),
    ('Isaac', 'Ward'),
    ('Lillian', 'Cox'),
    ('Ryan', 'Diaz'),
    ('Hazel', 'Richardson'),
    ('Anthony', 'Wood'),
    ('Aurora', 'Watson'),
    ('Wyatt', 'Brooks'),
    ('Stella', 'Bennett'),
    ('Hunter', 'Gray'),
    ('Violet', 'James'),
    ('Thomas', 'Russell'),
    ('Lucy', 'Griffin'),
    ('Joshua', 'Foster'),
    ('Nova', 'Sanders'),
    ('Eli', 'Price'),
    ('Zoey', 'Ross'),
    ('Landon', 'Ramirez'),
    ('Savannah', 'Hayes'),
    ('Jonathan', 'Bryant'),
    ('Bella', 'Myers'),
    ('Isaiah', 'Ford'),
    ('Ellie', 'Hamilton'),
    ('Charles', 'Graham'),
    ('Paisley', 'Sullivan'),
    ('Aaron', 'Wallace'),
    ('Skylar', 'Coleman'),
    ('Adrian', 'Simmons'),
    ('Brooklyn', 'Fisher'),
    ('Jeremiah', 'Jordan'),
    ('Aubrey', 'Reynolds'),
    ('Nicholas', 'Griffith'),
    ('Claire', 'Cooper'),
    ('Evan', 'Richardson'),
    ('Sadie', 'Henderson'),
    ('Christian', 'Hughes'),
    ('Genesis', 'Barnes'),
    ('Hudson', 'Jenkins'),
    ('Kennedy', 'Long'),
    ('Lincoln', 'Bishop'),
    ('Mackenzie', 'Mendoza');
-- Step 1: Create a temporary table with unique random player names
CREATE TEMPORARY TABLE TempPlayerNames AS
SELECT p.id as account_id,
    CONCAT(fn1.firstname, ' ', fn2.lastname) AS new_player_name
FROM Accounts p
    JOIN fake_names fn1 ON RAND() < 0.5 -- Random selection of firstname
    JOIN fake_names fn2 ON RAND() < 0.5 -- Random selection of lastname
ORDER BY RAND();
-- Step 2: Update Accounts table
UPDATE Accounts p
    JOIN TempPlayerNames tpn ON p.id = tpn.account_id
SET p.full_name = tpn.new_player_name;
-- Step 3: Drop temporary table
DROP TEMPORARY TABLE TempPlayerNames;
UPDATE Accounts
SET work_email = CONCAT(
        LOWER(SUBSTRING_INDEX(full_name, ' ', 1)),
        '.',
        LOWER(SUBSTRING_INDEX(full_name, ' ', -1)),
        FLOOR(RAND() * 9999) + 1,
        '@kanawork.org'
    )
WHERE full_name IS NOT NULL
    AND full_name LIKE '% %';
UPDATE Accounts
SET discord = CONCAT(
        SUBSTRING_INDEX(full_name, ' ', 1),
        '#',
        FLOOR(RAND() * 9999) + 1
    )
WHERE full_name IS NOT NULL
    AND full_name LIKE '% %';
-- UPDATE Accounts
-- SET discord = name;