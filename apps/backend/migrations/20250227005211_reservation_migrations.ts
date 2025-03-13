/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Knex } from "knex";

export const config = { transaction: false };

async function getMatchesWithoutReservation(knex: Knex) {
  const matches = await knex("Matches")
    .leftJoin("MatchReservations", "Matches.id", "MatchReservations.match_id")
    .whereNull("MatchReservations.match_id")
    .select("Matches.*");
  return matches;
}

async function updateMatchTimes(knex: Knex, matches: any[]) {
  const updates = matches.map((match) => {
    const start = "19:00:00";
    const end = match.best_of === 3 ? "22:00:00" : "20:00:00";
    return knex("Matches")
      .where({ id: match.id })
      .update({ start_time: start, end_time: end });
  });
  await Promise.all(updates);
}

function extractTimeFromDate(date: string) {
  return date.split(" ")[1];
}

function getBoundaryTime(
  reservations: any[],
  key: string,
  comparator: (a: string, b: string) => boolean
) {
  return reservations.reduce(
    (acc: string, curr: any) =>
      acc === "" || comparator(curr[key], acc) ? curr[key] : acc,
    ""
  );
}

async function handleMultipleReservations(knex: Knex, matches: any[]) {
  const migratedSet = new Set<number>();
  const toBeDeleted: number[] = [];

  for (const match of matches) {
    if (migratedSet.has(match.match_id)) continue;

    const relatedReservations = matches.filter(
      (m) => m.match_id === match.match_id
    );
    const chosenOne =
      relatedReservations.find((r) => r.stream_url.startsWith("http")) ||
      relatedReservations[0];

    const start_time_date = getBoundaryTime(
      relatedReservations,
      "date_start",
      (a, b) => a < b
    );
    const end_time_date = getBoundaryTime(
      relatedReservations,
      "date_end",
      (a, b) => a > b
    );

    await knex("Matches")
      .where({ id: match.match_id })
      .update({
        start_time: extractTimeFromDate(start_time_date),
        end_time: extractTimeFromDate(end_time_date)
      });

    await knex("Reservations").where({ id: chosenOne.reservation_id }).update({
      match_id: match.match_id,
      date_start: start_time_date,
      date_end: end_time_date
    });

    migratedSet.add(match.match_id);

    for (const reservation of relatedReservations) {
      if (reservation.reservation_id !== chosenOne.reservation_id) {
        toBeDeleted.push(reservation.reservation_id);
      }
    }
  }

  if (toBeDeleted.length > 0) {
    await knex("Reservations").whereIn("id", toBeDeleted).del();
  }
}

async function handleOneToOneReservations(knex: Knex) {
  const matchReservations = await knex("MatchReservations as mr")
    .join("Reservations as r", "mr.reservation_id", "r.id")
    .select(
      "mr.match_id",
      "r.date_start",
      "r.date_end",
      "r.stream_url",
      "r.id as reservation_id"
    );
  for (const matchReservation of matchReservations) {
    const start_time = extractTimeFromDate(matchReservation.date_start);
    const end_time = extractTimeFromDate(matchReservation.date_end);
    await knex("Matches")
      .where({ id: matchReservation.match_id })
      .update({ start_time, end_time });

    // Update  Reservation with match_id if it has stream_url
    if (matchReservation.stream_url.startsWith("http")) {
      await knex("Reservations")
        .where({ id: matchReservation.reservation_id })
        .update({ match_id: matchReservation.match_id });
    }
  }

  await knex("Reservations").whereNull("match_id").del();
  await knex("Reservations").whereNot("stream_url", "like", "http%").del();
  // Drop the column date_start and date_end from Reservations
  await knex.schema.alterTable("Reservations", (table) => {
    table.dropForeign("team1_id", "reservations_team1_id_foreign");
    table.dropForeign("team2_id", "reservations_team2_id_foreign");
    table.dropColumn("team1_id");
    table.dropColumn("team2_id");
    table.dropColumn("date_start");
    table.dropColumn("date_end");
  });
  // Drop table MatchReservations
  await knex.schema.dropTable("MatchReservations");
  // Set Matches start_time and end_time to be not nullable
  await knex.schema.table("Matches", (table) => {
    table.time("start_time").notNullable().alter();
    table.time("end_time").notNullable().alter();
  });
  // Set Reservations match_id to be not nullable
  await knex.schema.table("Reservations", (table) => {
    table.integer("match_id").unsigned().notNullable().alter();
  });
}

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("Matches", (table) => {
    table.time("start_time").nullable();
    table.time("end_time").nullable();
  });
  await knex.schema.table("Reservations", (table) => {
    table.integer("match_id").unsigned().nullable();
    table
      .foreign("match_id")
      .references("Matches.id")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
  const matches = await getMatchesWithoutReservation(knex);
  await updateMatchTimes(knex, matches);
  const matchesWithMultipleReservations = await knex("MatchReservations as mr")
    .join("Reservations as r", "mr.reservation_id", "r.id")
    .join("Matches as m", "mr.match_id", "m.id")
    .whereIn("mr.match_id", function () {
      this.select("match_id")
        .from("MatchReservations")
        .groupBy("match_id")
        .havingRaw("COUNT(DISTINCT reservation_id) > 1");
    })
    .orderBy("mr.match_id", "asc")
    .select(
      "mr.match_id",
      "m.best_of",
      "mr.reservation_id",
      "r.stream_url",
      "r.date_start",
      "r.date_end"
    );
  await handleMultipleReservations(knex, matchesWithMultipleReservations);
  return handleOneToOneReservations(knex);
}

export async function down(): Promise<void> {
  // NO-OP
}
