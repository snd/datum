import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";

// import Datum
import { Datum } from "https://raw.githubusercontent.com/snd/datum/master/datum.ts";

const year = 2018;
const month = 10;
const day = 5;

// construct a date from year, month (january = 1), day
const date = new Datum(year, month, day);

// convert a date to an ISO string
assertEquals(date.toString(), "2018-10-05");
