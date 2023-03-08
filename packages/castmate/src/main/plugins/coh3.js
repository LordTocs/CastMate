import axios from "axios";
import https from "https";

export default {
  name: "coh3",
  uiName: "Company of Heroes 3",
  icon: "mdi-crown",
  color: "#619DB7",
  async init() {
    this.Leaderboards = {
        "2130255": "American",
        "2130257": "British",
        "2130259": "Dak",
        "2130261": "Wehrmacht",
    }
      // "2v2": {
      //   american: 2130300,
      //   british: 2130302,
      //   dak: 2130304,
      //   german: 2130306,
      // },
      // "3v3": {
      //   american: 2130329,
      //   british: 2130331,
      //   dak: 2130333,
      //   german: 2130335,
      // },
      // "4v4": {
      //   american: 2130353,
      //   british: 2130356,
      //   dak: 2130358,
      //   german: 2130360,
      // },

    this.Names = {
      german: "Wehrmacht",
      american: "US Forces",
      dak: "Deutsches Afrikakorps",
      british: "British Forces",
    };

    this.Maps = {
      twin_beach_2p_mkii: {
        name: "Twin Beaches",
        url: "/maps/twin_beaches.png",
      },
      desert_village_2p_mkiii: {
        name: "Road to Tunis",
        url: "/maps/road_to_tunis.png",
      },
      cliff_crossing_2p: {
        name: "Taranto Coastline",
        url: "/maps/taranto_coastline.png",
      },
      rails_and_sand_4p: {
        name: "Campbell's Convoy",
        url: "/maps/campbells_convoy.png",
      },
      rural_town_4p: {
        name: "Pachino Farmlands",
        url: "/maps/pachino_farmlands.png",
      },
      torrente_4p_mkiii: { name: "Torrente", url: "/maps/torrente.png" },
      rural_castle_4p: {
        name: "Aere Perennius",
        url: "/maps/aere_perennius.png",
      },
      desert_airfield_6p_mkii: {
        name: "Gazala Landing Ground",
        url: "/maps/gazala_landing_ground.png",
      },
      industrial_railyard_6p_mkii: {
        name: "L'Aquila",
        url: "/maps/laquila.png",
      },
      winter_line_8p_mkii: {
        name: "Winter Line",
        url: "/maps/winter_line.png",
      },
      mountain_ruins_8p_mkii: {
        name: "Mignano Gap",
        url: "/maps/mignano_gap.png",
      },
    };
  },
  state: {},
  methods: {},
  templateFunctions: {
    async getCoh3PlayerStats(playerName) {
      if (!playerName || !playerName.length) {
        playerName = this.settings.cohUsername;
      }

      const agent = new https.Agent({
        rejectUnauthorized: false,
      });

      let response = await axios.get(
        "https://coh3-api.reliclink.com/community/leaderboard/getpersonalstat",
        {
          httpsAgent: agent,
          params: {
            aliases: `[${playerName}]`,
            title: "coh3",
          },
        }
      );

      if (response.data && response.data.result.message !== 'UNKNOWN_ALIASES') {
        const leaderboard = response.data;
        const userName = response.data.statGroups[0].members[0].alias;
        const stats = leaderboard.leaderboardStats.filter(
          (l) => {
            return l.leaderboard_id == "2130255" ||
            l.leaderboard_id == "2130257" ||
            l.leaderboard_id == "2130259" ||
            l.leaderboard_id == "2130261"
          }
        );
        let playerStatString = `${userName} `;
        stats.forEach(e => {
          let winPercent = Math.round(
            (e.wins / (e.wins + e.losses)) * 100
          );
          playerStatString += `⚔️${this.Leaderboards[e.leaderboard_id]} ⚔️ Rank: ${e.rank} - Elo: ${e.rating} - Win Rate: ${winPercent}% - W/L: ${e.wins}/${e.losses} - Streak: ${e.streak} `;
        })

        return playerStatString;
      } else {
        return "Could not find player. Check your spelling and try again (case sensitive & must have 10 1vs1 games).";
      }
    },
  },
  settings: {
    cohUsername: { type: String },
  },
};
