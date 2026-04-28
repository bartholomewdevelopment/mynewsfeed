const axios = require('axios');

const ESPN_API = 'https://site.api.espn.com/apis/site/v2/sports/basketball';

// Teams to visually highlight — not used for filtering, just for emphasis in the UI
const MY_NBA_TEAM_IDS = new Set(['20', '13', '21', '5', '18']); // Jazz, Lakers, TWolves, Cavs, Knicks
const MY_NCAA_TEAM_IDS = new Set(['252', '254']);                // BYU, Utah

const toDateString = (date) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

const parseGame = (event, myTeamIds) => {
  const comp = event.competitions?.[0];
  if (!comp) return null;

  const competitors = comp.competitors || [];
  const home = competitors.find((c) => c.homeAway === 'home');
  const away = competitors.find((c) => c.homeAway === 'away');
  if (!home || !away) return null;

  const status = comp.status || {};
  const statusType = status.type || {};

  const isMyGame =
    myTeamIds.has(home.team?.id) || myTeamIds.has(away.team?.id);

  return {
    id: event.id,
    home: {
      id: home.team?.id,
      name: home.team?.displayName,
      abbr: home.team?.abbreviation,
      score: home.score ?? null,
      winner: home.winner ?? false,
      mine: myTeamIds.has(home.team?.id),
    },
    away: {
      id: away.team?.id,
      name: away.team?.displayName,
      abbr: away.team?.abbreviation,
      score: away.score ?? null,
      winner: away.winner ?? false,
      mine: myTeamIds.has(away.team?.id),
    },
    status: {
      completed: statusType.completed ?? false,
      inProgress: statusType.name === 'STATUS_IN_PROGRESS',
      detail: statusType.shortDetail || statusType.detail || '',
      clock: status.displayClock,
      period: status.period,
    },
    date: event.date,
    name: event.name,
    isMyGame,
  };
};

const fetchLeague = async (league, myTeamIds, dateStr) => {
  const params = dateStr ? { dates: dateStr } : {};
  const res = await axios.get(`${ESPN_API}/${league}/scoreboard`, {
    params,
    timeout: 10000,
  });

  // Only include games that actually fall on the requested date.
  // ESPN sometimes returns stale/recent games when nothing is scheduled,
  // which would show old end-of-season results as "today".
  const targetDate = dateStr || toDateString(new Date());

  return (res.data?.events || [])
    .filter((e) => {
      if (!e.date) return false;
      return toDateString(new Date(e.date)) === targetDate;
    })
    .map((e) => parseGame(e, myTeamIds))
    .filter(Boolean);
};

const fetchScores = async () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = toDateString(today);
  const yesterdayStr = toDateString(yesterday);

  const [nbaTodayRes, nbaYestRes, ncaaTodayRes, ncaaYestRes] = await Promise.allSettled([
    fetchLeague('nba', MY_NBA_TEAM_IDS, null),          // null = ESPN default (today)
    fetchLeague('nba', MY_NBA_TEAM_IDS, yesterdayStr),
    fetchLeague('mens-college-basketball', MY_NCAA_TEAM_IDS, null),
    fetchLeague('mens-college-basketball', MY_NCAA_TEAM_IDS, yesterdayStr),
  ]);

  const nbaToday    = nbaTodayRes.status  === 'fulfilled' ? nbaTodayRes.value  : [];
  const nbaYest     = nbaYestRes.status   === 'fulfilled' ? nbaYestRes.value   : [];
  const ncaaToday   = ncaaTodayRes.status === 'fulfilled' ? ncaaTodayRes.value : [];
  const ncaaYest    = ncaaYestRes.status  === 'fulfilled' ? ncaaYestRes.value  : [];

  return {
    today:     { nba: nbaToday,  ncaa: ncaaToday,  label: 'Today' },
    yesterday: { nba: nbaYest,   ncaa: ncaaYest,   label: 'Yesterday' },
  };
};

module.exports = { fetchScores };
