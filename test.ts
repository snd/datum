#!/usr/bin/env -S deno --allow-net test

import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";

import { Datum, Weekday, padWithLeadingZeros } from "./datum.ts";

Deno.test(function testPadWithLeadingZeros() {
  assertEquals("3", padWithLeadingZeros("3", 0));
  assertEquals("3", padWithLeadingZeros("3", 1));
  assertEquals("04", padWithLeadingZeros("4", 2));
  assertEquals("003", padWithLeadingZeros("3", 3));
  assertEquals("005", padWithLeadingZeros("5", 3));
  assertEquals("0022", padWithLeadingZeros("22", 4));
})

Deno.test(function testDatumConstructor() {
  const date = new Datum(1988, 9, 11);
  assertEquals(date.year, 1988);
  assertEquals(date.month, 9);
  assertEquals(date.day, 11);
  assertEquals(date.toString(), "1988-09-11");
})

Deno.test(function testFromString() {
  let date = Datum.fromString("0000-01-01");
  assertEquals(date.year, 0);
  assertEquals(date.month, 1);
  assertEquals(date.day, 1);

  date = Datum.fromString("9999-12-31");
  assertEquals(date.year, 9999);
  assertEquals(date.month, 12);
  assertEquals(date.day, 31);

  date = Datum.fromString("1576-05-27");
  assertEquals(date.year, 1576);
  assertEquals(date.month, 5);
  assertEquals(date.day, 27);
})

Deno.test(function testFromToStringRoundtrip() {
  const str = "0600-03-27";
  assertEquals(Datum.fromString(str).toString(), str);
})

Deno.test(function testFromDate() {
  const date = Datum.fromDate(new Date(2017, 4, 15));
  assertEquals(date.year, 2017);
  assertEquals(date.month, 5);
  assertEquals(date.day, 15);
})

Deno.test(function testIsLeapYear() {
  assert(Datum.isLeapYear(2016));
  assert(!Datum.isLeapYear(2017));
  assert(!Datum.isLeapYear(2018));
  assert(!Datum.isLeapYear(2019));
  assert(Datum.isLeapYear(2020));
  assert(!Datum.isLeapYear(2021));
  assert(Datum.isLeapYear(800));
  assert(!Datum.isLeapYear(900));
  assert(Datum.isLeapYear(2000));
})

Deno.test(function testGetDaysInMonth() {
  assertEquals(Datum.getDaysInMonth(2016, 2), 29);
  assertEquals(Datum.getDaysInMonth(2017, 2), 28);
  assertEquals(Datum.getDaysInMonth(2016, 1), 31);
  assertEquals(Datum.getDaysInMonth(2017, 1), 31);
})

Deno.test(function testAddDays() {
  assertEquals([2028, 12, 30], new Datum(2028, 12, 30).addDays(0).toTuple());
  assertEquals([2028, 12, 31], new Datum(2028, 12, 30).addDays(1).toTuple());
  assertEquals([2029, 1, 1], new Datum(2028, 12, 30).addDays(2).toTuple());

  assertEquals([2028, 10, 9], new Datum(2028, 5, 29).addDays(133).toTuple());
  assertEquals([2037, 4, 18], new Datum(2030, 6, 15).addDays(2499).toTuple());
})

Deno.test(function testSubtractDays() {
  assertEquals([2029, 1, 1], new Datum(2029, 1, 1).subtractDays(0).toTuple());
  assertEquals([2028, 12, 31], new Datum(2029, 1, 1).subtractDays(1).toTuple());
  assertEquals([2028, 12, 30], new Datum(2029, 1, 1).subtractDays(2).toTuple());

  assertEquals([2020, 2, 29], new Datum(2020, 3, 16).subtractDays(16).toTuple());

  assertEquals([2028, 5, 29], new Datum(2028, 10, 9).subtractDays(133).toTuple());
  assertEquals([2030, 6, 15], new Datum(2037, 4, 18).subtractDays(2499).toTuple());
})

Deno.test(function testDaysUntilFirstDayOfNextMonth() {
  assertEquals(new Datum(2019, 7, 22).daysUntilFirstDayOfNextMonth(), 10);
  assertEquals(new Datum(2019, 7, 31).daysUntilFirstDayOfNextMonth(), 1);
  assertEquals(new Datum(2019, 8, 1).daysUntilFirstDayOfNextMonth(), 31);
})

Deno.test(function testDeltaDays() {
  assertEquals(0, new Datum(2028, 12, 30).deltaDays(new Datum(2028, 12, 30)));
  assertEquals(1, new Datum(2028, 12, 30).deltaDays(new Datum(2028, 12, 31)));
  assertEquals(2, new Datum(2028, 12, 30).deltaDays(new Datum(2029, 1, 1)));

  assertEquals(133, new Datum(2028, 5, 29).deltaDays(new Datum(2028, 10, 9)));
  assertEquals(2499, new Datum(2037, 4, 18).deltaDays(new Datum(2030, 6, 15)));
  assertEquals(2321, new Datum(2024, 4, 17).deltaDays(new Datum(2030, 8, 25)));
})

Deno.test(function testWeekday() {
  assertEquals(new Datum(2019, 8, 19).weekday(), Weekday.Monday);
  assertEquals(new Datum(2019, 8, 20).weekday(), Weekday.Tuesday);
  assertEquals(new Datum(2019, 8, 21).weekday(), Weekday.Wednesday);
  assertEquals(new Datum(2019, 8, 22).weekday(), Weekday.Thursday);
  assertEquals(new Datum(2019, 8, 23).weekday(), Weekday.Friday);
  assertEquals(new Datum(2019, 8, 24).weekday(), Weekday.Saturday);
  assertEquals(new Datum(2019, 8, 25).weekday(), Weekday.Sunday);
  assertEquals(new Datum(2019, 8, 26).weekday(), Weekday.Monday);
  assertEquals(new Datum(2019, 8, 27).weekday(), Weekday.Tuesday);
  assertEquals(new Datum(2019, 8, 28).weekday(), Weekday.Wednesday);
  assertEquals(new Datum(2019, 8, 29).weekday(), Weekday.Thursday);
  assertEquals(new Datum(2019, 8, 30).weekday(), Weekday.Friday);
  assertEquals(new Datum(2019, 8, 31).weekday(), Weekday.Saturday);
  assertEquals(new Datum(2019, 9, 1).weekday(), Weekday.Sunday);

  assertEquals(new Datum(1988, 9, 11).weekday(), Weekday.Sunday);
  assertEquals(new Datum(3994, 2, 8).weekday(), Weekday.Tuesday);
  assertEquals(new Datum(1997, 12, 20).weekday(), Weekday.Saturday);
  assertEquals(new Datum(1373, 10, 11).weekday(), Weekday.Monday);
  assertEquals(new Datum(5159, 4, 22).weekday(), Weekday.Wednesday);
})

Deno.test(function testCompareAsc() {
  const dates = [
    new Datum(2019, 8, 29),
    new Datum(1373, 10, 11),
    new Datum(2019, 8, 30),
    new Datum(2019, 8, 31),
    new Datum(1988, 9, 11),
    new Datum(3994, 2, 8),
    new Datum(1997, 12, 20),
    new Datum(2019, 8, 28),
    new Datum(5159, 4, 22),
    new Datum(2019, 8, 27),
    new Datum(2019, 9, 1),
  ];
  dates.sort(Datum.compareAsc);

  assert(dates[0].isEqual(new Datum(1373, 10, 11)));
  assert(dates[1].isEqual(new Datum(1988, 9, 11)));
  assert(dates[2].isEqual(new Datum(1997, 12, 20)));
  assert(dates[3].isEqual(new Datum(2019, 8, 27)));
  assert(dates[4].isEqual(new Datum(2019, 8, 28)));
  assert(dates[5].isEqual(new Datum(2019, 8, 29)));
  assert(dates[6].isEqual(new Datum(2019, 8, 30)));
  assert(dates[7].isEqual(new Datum(2019, 8, 31)));
  assert(dates[8].isEqual(new Datum(2019, 9, 1)));
  assert(dates[9].isEqual(new Datum(3994, 2, 8)));
  assert(dates[10].isEqual(new Datum(5159, 4, 22)));
  assert(dates[11] == null);
});

Deno.test(function testCompareDesc() {
  const dates = [
    new Datum(2019, 8, 29),
    new Datum(1373, 10, 11),
    new Datum(2019, 8, 30),
    new Datum(2019, 8, 31),
    new Datum(1988, 9, 11),
    new Datum(3994, 2, 8),
    new Datum(1997, 12, 20),
    new Datum(2019, 8, 28),
    new Datum(5159, 4, 22),
    new Datum(2019, 8, 27),
    new Datum(2019, 9, 1),
  ];
  dates.sort(Datum.compareDesc);

  assert(dates[0].isEqual(new Datum(5159, 4, 22)));
  assert(dates[1].isEqual(new Datum(3994, 2, 8)));
  assert(dates[2].isEqual(new Datum(2019, 9, 1)));
  assert(dates[3].isEqual(new Datum(2019, 8, 31)));
  assert(dates[4].isEqual(new Datum(2019, 8, 30)));
  assert(dates[5].isEqual(new Datum(2019, 8, 29)));
  assert(dates[6].isEqual(new Datum(2019, 8, 28)));
  assert(dates[7].isEqual(new Datum(2019, 8, 27)));
  assert(dates[8].isEqual(new Datum(1997, 12, 20)));
  assert(dates[9].isEqual(new Datum(1988, 9, 11)));
  assert(dates[10].isEqual(new Datum(1373, 10, 11)));
  assert(dates[11] == null);
});

Deno.test(function testMin() {
  const dates = [
    new Datum(2019, 8, 29),
    new Datum(1373, 10, 11),
    new Datum(2019, 8, 30),
    new Datum(2019, 8, 31),
    new Datum(1988, 9, 11),
    new Datum(3994, 2, 8),
    new Datum(1997, 12, 20),
    new Datum(2019, 8, 28),
    new Datum(5159, 4, 22),
    new Datum(2019, 8, 27),
    new Datum(2019, 9, 1),
  ];
  assert(Datum.min(dates).isEqual(new Datum(1373, 10, 11)));
});

Deno.test(function testMax() {
  const dates = [
    new Datum(2019, 8, 29),
    new Datum(1373, 10, 11),
    new Datum(2019, 8, 30),
    new Datum(2019, 8, 31),
    new Datum(1988, 9, 11),
    new Datum(3994, 2, 8),
    new Datum(1997, 12, 20),
    new Datum(2019, 8, 28),
    new Datum(5159, 4, 22),
    new Datum(2019, 8, 27),
    new Datum(2019, 9, 1),
  ];
  assert(Datum.max(dates).isEqual(new Datum(5159, 4, 22)));
});
