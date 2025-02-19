SET time_zone = "+00:00";
SET GLOBAL max_allowed_packet = 134217728;

-- Table: Games
CREATE TABLE IF NOT EXISTS Games (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(255) NOT NULL
);


-- Table: Seasons
CREATE TABLE IF NOT EXISTS Seasons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    game_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (game_id) REFERENCES Games(id)
);


-- Table: SeasonLeagues
CREATE TABLE IF NOT EXISTS SeasonLeagues (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    tier INT NOT NULL,
    season_id INT NOT NULL,
    FOREIGN KEY (season_id) REFERENCES Seasons(id) ON UPDATE CASCADE ON DELETE CASCADE
);


-- Table: Companies
CREATE TABLE IF NOT EXISTS Companies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255),
    company_code VARCHAR(255),
    logo VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    UNIQUE KEY unique_company_code (company_code)
);

-- Table: Teams
CREATE TABLE IF NOT EXISTS Teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT,
    name VARCHAR(255) NOT NULL,
    team_logo VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    FOREIGN KEY (company_id) REFERENCES Companies(id)
);

-- Table: Players
CREATE TABLE IF NOT EXISTS Players (
    steam_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    player_name VARCHAR(255),
    work_email VARCHAR(255),
    discord VARCHAR(255),
    PRIMARY KEY (steam_id)
);

CREATE TABLE IF NOT EXISTS TeamRosters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NOT NULL,
    steam_id BIGINT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (steam_id) REFERENCES Players(steam_id) ON UPDATE CASCADE ON DELETE CASCADE
);


-- Table: SeasonTeams
CREATE TABLE IF NOT EXISTS SeasonTeams (
    season_id INT NOT NULL,
    team_id INT NOT NULL,
    captain_steam_id BIGINT,
    defects TEXT,
    co_captain_steam_id BIGINT,
    ticket VARCHAR(50),
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (season_id, team_id),
    FOREIGN KEY (season_id) REFERENCES Seasons(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (captain_steam_id) REFERENCES Players(steam_id) ON DELETE SET NULL,
    FOREIGN KEY (co_captain_steam_id) REFERENCES Players(steam_id) ON DELETE SET NULL
);


-- Create SeasonLeagueTeams table
CREATE TABLE IF NOT EXISTS SeasonLeagueTeams (
    season_id INT NOT NULL,
    team_id INT NOT NULL,
    league_id INT NOT NULL,
    PRIMARY KEY (season_id, team_id, league_id),
    FOREIGN KEY (season_id, team_id) REFERENCES SeasonTeams(season_id, team_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (league_id) REFERENCES SeasonLeagues(id) ON UPDATE CASCADE ON DELETE CASCADE
);


-- Table: SeasonTeamPlayers
CREATE TABLE IF NOT EXISTS SeasonTeamPlayers (
    season_id INT NOT NULL,
    team_id INT NOT NULL,
    steam_id BIGINT NOT NULL,
    role ENUM('primary', 'substitute') NOT NULL,
    PRIMARY KEY (season_id, steam_id, team_id),
    FOREIGN KEY (season_id, team_id) REFERENCES SeasonTeams(season_id, team_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (steam_id) REFERENCES Players(steam_id) ON UPDATE CASCADE ON DELETE CASCADE
);



-- All maps of games by name
CREATE TABLE IF NOT EXISTS Maps (
    id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL UNIQUE
);

-- All matches played in the league and season
CREATE TABLE IF NOT EXISTS Matches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    league_id INT NOT NULL,
    season_id INT NOT NULL,
    stage TINYINT UNSIGNED NOT NULL DEFAULT 2,
    match_date DATE NOT NULL,
    FOREIGN KEY (season_id, league_id) REFERENCES SeasonLeagues(season_id, id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- All teams that participated in the match
CREATE TABLE IF NOT EXISTS MatchTeams (
    match_id INT NOT NULL,
    team_id INT NOT NULL,
    season_id INT NOT NULL,
    league_id INT NOT NULL,

    PRIMARY KEY (match_id, team_id), -- The same team can't be in the same match twice
    FOREIGN KEY (match_id) REFERENCES Matches(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (season_id, team_id, league_id) REFERENCES SeasonLeagueTeams(season_id, team_id, league_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS MatchTeamMapVetoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    match_id INT NOT NULL, 
    team_id INT NOT NULL,
    map_id TINYINT UNSIGNED NOT NULL, 
    action ENUM('drop', 'pick', 'decider') NOT NULL,
    veto_order TINYINT UNSIGNED NOT NULL,  -- Order in which the veto was made
    FOREIGN KEY (match_id, team_id) REFERENCES MatchTeams(match_id, team_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (map_id) REFERENCES Maps(id) ON DELETE RESTRICT,
    UNIQUE (match_id, team_id, veto_order)  -- Ensures each team makes unique veto decisions in order
);

-- All maps played in the match, BO1, BO3, BO5 etc. Each BO in own row with demo
CREATE TABLE IF NOT EXISTS MatchMapsPlayed (
    id INT PRIMARY KEY AUTO_INCREMENT,
    match_id INT NOT NULL,
    map_id TINYINT UNSIGNED NOT NULL,
    map_order TINYINT UNSIGNED,  -- 1 = First map, 2 = Second map, 3 = Third map (if needed)
    demofile VARCHAR(255) NOT NULL, 
    FOREIGN KEY (match_id) REFERENCES Matches(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (map_id) REFERENCES Maps(id) ON DELETE RESTRICT
);

-- if old kana.matches.team1, starting_side is T, team2 is CT
CREATE TABLE IF NOT EXISTS TeamMapScores(
    id INT PRIMARY KEY AUTO_INCREMENT,
    match_id INT NOT NULL,
    team_id INT NOT NULL,
    match_maps_played_id INT NOT NULL,
    starting_side ENUM('CT', 'T') NOT NULL,
    score TINYINT UNSIGNED NOT NULL,
    halftime_score TINYINT UNSIGNED NOT NULL,
    overtime_score TINYINT UNSIGNED DEFAULT 0,
    FOREIGN KEY (match_id, team_id) REFERENCES MatchTeams(match_id, team_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (match_maps_played_id) REFERENCES MatchMapsPlayed(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Each round of the match, who won, how many players alive, who planted the bomb, etc.
CREATE TABLE IF NOT EXISTS MapRoundStats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    match_maps_played_id INT NOT NULL, -- What map was played in this BOx Match
    ct_team_id INT NOT NULL, -- Which team played CT on this round
    t_team_id INT NOT NULL, -- Which team played T on this round
    round_number TINYINT UNSIGNED NOT NULL, -- 1-n
    round_end_reason_info TINYINT UNSIGNED NOT NULL, -- reason why round ended.
    ct_t JSON, -- This needs to be parsed later, who was alive when bomb planted.
    first_kill VARCHAR(2) NOT NULL, -- CT or T
    plant_site CHAR(1), -- A or B
    FOREIGN KEY (match_maps_played_id) REFERENCES MatchMapsPlayed(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (ct_team_id) REFERENCES Teams(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (t_team_id) REFERENCES Teams(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT unique_map_round_stats UNIQUE (match_maps_played_id, round_number), -- Each round is unique for played map in match
    CONSTRAINT chk_ct_t_if_plant_site_not_null CHECK (plant_site IS NULL OR ct_t IS NOT NULL),
        CONSTRAINT chk_plant_site_if_bomb_related CHECK (
        NOT (round_end_reason_info IN (1, 2) AND plant_site IS NULL)
    )
);

-- Table: PlayerStats
CREATE TABLE IF NOT EXISTS PlayerStats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    steam_id BIGINT NOT NULL,
    match_maps_played_id INT NOT NULL,
    team INT NOT NULL,
    kills TINYINT UNSIGNED NOT NULL,
    deaths TINYINT UNSIGNED NOT NULL,
    assists TINYINT UNSIGNED NOT NULL,
    assists_ct TINYINT UNSIGNED NOT NULL,
    assists_t TINYINT UNSIGNED NOT NULL,
    mvps TINYINT UNSIGNED NOT NULL,
    total_damage INT NOT NULL,
    total_damage_ct INT NOT NULL,
    total_damage_t INT NOT NULL,
    headshots TINYINT UNSIGNED NOT NULL,
    flash_assists TINYINT UNSIGNED NOT NULL,
    flash_assists_t TINYINT UNSIGNED NOT NULL,
    flash_assists_ct TINYINT UNSIGNED NOT NULL,
    adr DECIMAL(4,1) NOT NULL,
    adr_t DECIMAL(4,1),
    adr_ct DECIMAL(4,1),
    hs_percent TINYINT UNSIGNED NOT NULL,
    plants TINYINT UNSIGNED NOT NULL,
    explodes TINYINT UNSIGNED NOT NULL,
    defuses TINYINT UNSIGNED NOT NULL,
    first_kills TINYINT UNSIGNED NOT NULL,
    kills_1 INT NOT NULL,
    kills_2 TINYINT UNSIGNED NOT NULL,
    kills_3 TINYINT UNSIGNED NOT NULL,
    kills_4 TINYINT UNSIGNED NOT NULL,
    kills_5 TINYINT UNSIGNED NOT NULL,
    trades TINYINT UNSIGNED NOT NULL,
    traded TINYINT UNSIGNED NOT NULL,
    clutches_won TINYINT UNSIGNED NOT NULL,
    clutches TINYINT UNSIGNED NOT NULL,
    awp_kills TINYINT UNSIGNED NOT NULL,
    utility_damage INT NOT NULL,
    utility_damage_t INT NOT NULL,
    utility_damage_ct INT NOT NULL,
    molotov_damage INT NOT NULL,
    molotov_damage_ct INT NOT NULL,
    molotov_damage_t INT NOT NULL,
    he_damage INT NOT NULL,
    he_damage_ct INT NOT NULL,
    he_damage_t INT NOT NULL,
    trade_attempts TINYINT UNSIGNED NOT NULL,
    trade_attempts_ct TINYINT UNSIGNED NOT NULL,
    trade_attempts_t TINYINT UNSIGNED NOT NULL,
    kills_through_walls TINYINT UNSIGNED NOT NULL,
    first_death_trade_attempts TINYINT UNSIGNED NOT NULL,
    first_death_trade_attempts_ct TINYINT UNSIGNED NOT NULL,
    first_death_trade_attempts_t TINYINT UNSIGNED NOT NULL,
    first_death_trade_opportunities TINYINT UNSIGNED NOT NULL,
    first_death_trade_opportunities_ct TINYINT UNSIGNED NOT NULL,
    first_death_trade_opportunities_t TINYINT UNSIGNED NOT NULL,
    trade_opportunities TINYINT UNSIGNED NOT NULL,
    trade_opportunities_t TINYINT UNSIGNED NOT NULL,
    trade_opportunities_ct TINYINT UNSIGNED NOT NULL,
    flashes_thrown TINYINT UNSIGNED NOT NULL,
    enemies_flashed TINYINT UNSIGNED NOT NULL,
    mates_flashed TINYINT UNSIGNED NOT NULL,
    self_flashes TINYINT UNSIGNED NOT NULL,
    first_deaths TINYINT UNSIGNED NOT NULL,
    total_mf_duration DECIMAL(5,1) NOT NULL,
    total_ef_duration DECIMAL(5,1) NOT NULL,
    one_v_one_won TINYINT UNSIGNED NOT NULL,
    one_v_one_lost TINYINT UNSIGNED NOT NULL,
    one_v_one_won_ct TINYINT UNSIGNED,
    one_v_one_lost_ct TINYINT UNSIGNED,
    one_v_one_won_t TINYINT UNSIGNED,
    one_v_one_lost_t TINYINT UNSIGNED,
    kast TINYINT UNSIGNED NOT NULL,
    kana_rating DECIMAL(4,2) NOT NULL,
    first_kills_t TINYINT UNSIGNED,
    first_kills_ct TINYINT UNSIGNED,
    first_deaths_t TINYINT UNSIGNED,
    first_deaths_ct TINYINT UNSIGNED,
    first_death_trades TINYINT UNSIGNED NOT NULL,
    first_death_traded TINYINT UNSIGNED NOT NULL,
    first_death_trades_ct TINYINT UNSIGNED NOT NULL,
    first_death_traded_ct TINYINT UNSIGNED NOT NULL,
    first_death_trades_t TINYINT UNSIGNED NOT NULL,
    first_death_traded_t TINYINT UNSIGNED NOT NULL,
    flashes_thrown_t TINYINT UNSIGNED,
    flashes_thrown_ct TINYINT UNSIGNED,
    enemies_flashed_t TINYINT UNSIGNED,
    enemies_flashed_ct TINYINT UNSIGNED,
    kills_t TINYINT UNSIGNED,
    kills_ct TINYINT UNSIGNED,
    deaths_t TINYINT UNSIGNED,
    deaths_ct TINYINT UNSIGNED,
    trades_t TINYINT UNSIGNED,
    trades_ct TINYINT UNSIGNED,
    traded_t TINYINT UNSIGNED,
    traded_ct TINYINT UNSIGNED,
    total_ef_duration_ct INT,
    total_ef_duration_t INT,
    total_mf_duration_t INT,
    total_mf_duration_ct INT,
    mates_flashed_t TINYINT UNSIGNED,
    mates_flashed_ct TINYINT UNSIGNED,
    ttd INT,
    crosshair_placement DECIMAL(3,1),
    ttf INT,
    rws DECIMAL(4,2) NOT NULL,
    shots MEDIUMINT UNSIGNED,
    shots_hit MEDIUMINT UNSIGNED,
    total_strafing_shots MEDIUMINT UNSIGNED,
    good_strafing_shots MEDIUMINT UNSIGNED,
    FOREIGN KEY (steam_id) REFERENCES Players(steam_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (match_maps_played_id) REFERENCES MatchMapsPlayed(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: Ranks
CREATE TABLE IF NOT EXISTS SeasonPlayerRanks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    steam_id BIGINT NOT NULL,
    season_id INT NOT NULL,
    kukko_date TIMESTAMP NULL DEFAULT '1970-01-01 10:00:00',
    csgo_rank INT DEFAULT -1,
    cs2_rank INT,
    cs_hours INT DEFAULT -1,
    faceit_level INT,
    faceit_elo INT DEFAULT 800,
    faceit_kd DECIMAL(3,2),
    faceit_date TIMESTAMP NULL DEFAULT '1970-01-01 10:00:00',
    kana_elo INT DEFAULT 0,
    esportal_kd DECIMAL(4,2),
    esportal_elo INT,
    esportal_rank INT,
    FOREIGN KEY (steam_id) REFERENCES Players(steam_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (season_id) REFERENCES Seasons(id) ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE (steam_id, season_id)
);


CREATE TABLE IF NOT EXISTS PlayerTrades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    match_maps_played_id INT NOT NULL,
    trader_steam_id BIGINT NOT NULL,
    killer_steam_id BIGINT NOT NULL,
    victim_steam_id BIGINT NOT NULL,
    round_number TINYINT UNSIGNED NOT NULL,
    first_death TINYINT(1) NOT NULL,
    traded TINYINT(1) NOT NULL,
    attempted TINYINT(1) NOT NULL,
    `time` BIGINT UNSIGNED,
    trade_time BIGINT UNSIGNED,
    death_time BIGINT UNSIGNED,
    FOREIGN KEY (trader_steam_id) REFERENCES Players(steam_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (killer_steam_id) REFERENCES Players(steam_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (victim_steam_id) REFERENCES Players(steam_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (match_maps_played_id) REFERENCES MatchMapsPlayed(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date_start DATETIME NOT NULL,
    date_end DATETIME NOT NULL,
    stream_url VARCHAR(255) NOT NULL,
    hash VARCHAR(255) NOT NULL
);

-- Junction table linking Matches and Reservations
CREATE TABLE IF NOT EXISTS MatchReservations (
    match_id INT,
    reservation_id INT,
    PRIMARY KEY (match_id, reservation_id),
    FOREIGN KEY (match_id) REFERENCES Matches(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (reservation_id) REFERENCES Reservations(id) ON UPDATE CASCADE ON DELETE CASCADE
);



