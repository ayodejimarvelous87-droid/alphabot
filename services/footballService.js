require("dotenv").config();

const axios = require("axios");
const FootballMatch = require("../models/FootballMatch");

const competitions = [
  "PL",
  "BL1",
  "SA",
  "FL1",
  "DED",
  "PPL",
  "PD",
  "CL",
  "CLI",
  "BSA",
  "ELC",
  "WC"
];

let footballUpdateRunning = false;

async function updateFootballMatches() {

  // Prevent overlapping football update runs
  if (footballUpdateRunning) {
    console.log("Football update already running, skipping...");
    return;
  }

  footballUpdateRunning = true;

  const startedAt = Date.now();

  try {

    const requests = competitions.map(async competition => {

      try {

        const response = await axios.get(
          `https://api.football-data.org/v4/competitions/${competition}/matches`,
          {
            headers: {
              "X-Auth-Token": process.env.FOOTBALL_API_KEY
            }
          }
        );

        return {
          competition,
          matches: response.data.matches || []
        };

      } catch (error) {

        console.log(
          `Football ${competition} API error:`,
          error.response?.data || error.message
        );

        return {
          competition,
          matches: []
        };

      }

    });

    // Run all competition API requests concurrently
    const results = await Promise.allSettled(requests);

    let total = 0;

    for (const result of results) {

      if (result.status !== "fulfilled") {
        console.log(
          "Football request failed:",
          result.reason?.message || result.reason
        );
        continue;
      }

      const {
        competition,
        matches
      } = result.value;

      if (!matches.length) {
        continue;
      }

      const operations = matches.map(match => {

        const score = match.score.fullTime;

        let matchResult = null;

        if (
          score.home !== null &&
          score.away !== null
        ) {

          if (score.home > score.away) {
            matchResult = "home";
          }

          else if (score.home < score.away) {
            matchResult = "away";
          }

          else {
            matchResult = "draw";
          }

        }

        return {
          updateOne: {

            filter: {
              externalId: String(match.id)
            },

            update: {
              $set: {

                externalId:
                  String(match.id),

                leagueId:
                  String(match.competition.code),

                league:
                  match.competition.name,

                homeTeam:
                  match.homeTeam.name,

                awayTeam:
                  match.awayTeam.name,

                homeLogo:
                  match.homeTeam.crest,

                awayLogo:
                  match.awayTeam.crest,

                matchDate:
                  match.utcDate,

                status:
                  match.status === "LIVE"
                    ? "IN_PLAY"
                    : match.status,

                result:
                  matchResult,

                homeGoals:
                  score.home,

                awayGoals:
                  score.away

              }
            },

            upsert: true

          }
        };

      });

      try {

        if (operations.length) {

          await FootballMatch.bulkWrite(
            operations,
            {
              ordered: false
            }
          );

          total += operations.length;

          console.log(
            `${competition}: ${operations.length} matches processed`
          );

        }

      } catch (error) {

        console.log(
          `Football ${competition} database error:`,
          error.message
        );

      }

    }

    const elapsed =
      ((Date.now() - startedAt) / 1000).toFixed(2);

    console.log(
      `Football matches updated: ${total} in ${elapsed}s`
    );

  } catch (error) {

    console.log(
      "Football update error:",
      error.response?.data || error.message
    );

  } finally {

    // Always release the lock
    footballUpdateRunning = false;

  }

}

module.exports = updateFootballMatches;
