import { generateQueryWithFilters } from '../../middlewares/queryFilter';

describe('generateQueryWithFilters', () => {
  it('should generate query without filters', () => {
    const baseQuery = 'SELECT * FROM matches';
    const filterValues = {};
    const result = generateQueryWithFilters(baseQuery, filterValues);

    expect(result.query).toBe('SELECT * FROM matches');
    expect(result.queryParams).toEqual([]);
  });

  it('should generate query with team_id filter for match query', () => {
    const baseQuery = 'SELECT * FROM matches WHERE 1=1';
    const filterValues = { team_id: 1 };
    const result = generateQueryWithFilters(baseQuery, filterValues, true);

    expect(result.query).toBe('SELECT * FROM matches WHERE 1=1 AND (m.team1 = ? OR m.team2 = ?)');
    expect(result.queryParams).toEqual([1, 1]);
  });

  it('should generate query with multiple filters', () => {
    const baseQuery = 'SELECT * FROM matches WHERE 1=1';
    const filterValues = { team_id: 1, season_id: 2021, map: 'de_dust2' };
    const result = generateQueryWithFilters(baseQuery, filterValues);

    expect(result.query).toBe('SELECT * FROM matches WHERE 1=1 AND p.team_id = ? AND l.season_id = ? AND m.map = ?');
    expect(result.queryParams).toEqual([1, 2021, 'de_dust2']);
  });

  it('should generate query with league_id filter', () => {
    const baseQuery = 'SELECT * FROM matches WHERE 1=1';
    const filterValues = { league_id: 5 };
    const result = generateQueryWithFilters(baseQuery, filterValues);

    expect(result.query).toBe('SELECT * FROM matches WHERE 1=1 AND l.id = ?');
    expect(result.queryParams).toEqual([5]);
  });

  it('should generate query with stage filter', () => {
    const baseQuery = 'SELECT * FROM matches WHERE 1=1';
    const filterValues = { stage: 2 };
    const result = generateQueryWithFilters(baseQuery, filterValues);

    expect(result.query).toBe('SELECT * FROM matches WHERE 1=1 AND m.stage = ?');
    expect(result.queryParams).toEqual([2]);
  });

  it('should generate query with all filters', () => {
    const baseQuery = 'SELECT * FROM matches WHERE 1=1';
    const filterValues = {
      team_id: 1,
      season_id: 2021,
      map: 'de_dust2',
      league_id: 5,
      stage: 2,
    };
    const result = generateQueryWithFilters(baseQuery, filterValues);

    expect(result.query).toBe(
      'SELECT * FROM matches WHERE 1=1 AND p.team_id = ? AND l.season_id = ? AND m.map = ? AND l.id = ? AND m.stage = ?'
    );
    expect(result.queryParams).toEqual([1, 2021, 'de_dust2', 5, 2]);
  });
});
