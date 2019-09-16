import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";

// import Datum type
import { Datum, Weekday } from "https://raw.githubusercontent.com/snd/datum/master/datum.ts";

const year = 2018;
const month = 10;
const day = 5;

// construct a date from year, month (january = 1), day
const october5 = new Datum(year, month, day);

// convert a date to an ISO string
assertEquals(october5.toString(), "2018-10-05");

// construct a date from an ISO string
const april3 = Datum.fromString("2018-04-03");

// get properties of a date
assertEquals(april3.year, 2018);
assertEquals(april3.month, 4);
assertEquals(april3.day, 3);

// get todays date
const today = Datum.today();

// working with weekdays

assertEquals(october5.weekday(), Weekday.Friday);
assertEquals(october5.weekdayString(), "fri");
assertEquals(Weekday.Friday, 4);

assertEquals(april3.weekday(), Weekday.Tuesday);
assertEquals(april3.weekdayString(), "tue");
assertEquals(Weekday.Tuesday, 1);

// comparing dates

assert(april3.isEqual(april3));
assert(!april3.isEqual(october5));

assert(april3.isBefore(october5));

assert(october5.isAfter(april3));

// arithmetic

const deltaDays = october5.deltaDays(april3);
assertEquals(deltaDays, 185);

assert(april3.addDays(deltaDays).isEqual(october5));
