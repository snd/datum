import { test } from "https://deno.land/std/testing/mod.ts";
import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";

export enum Weekday {
  Monday = 0,
  Tuesday = 1,
  Wednesday = 2,
  Thursday = 3,
  Friday = 4,
  Saturday = 5,
  Sunday = 6,
}

/*
 * a type representing dates without time and without timezone.
 * immutable: no methods change the state of the object.
 */
export class Datum {
  /*
   * integer from 0 to 9999 inclusive
   */
  public readonly year: number;

  /*
   * integer from 1 to 12 inclusive
   */
  public readonly month: number;

  /*
   * integer from 1 to 31 inclusive
   */
  public readonly day: number;

  static STRING_LENGTH = 10;
  static FORMAT = "YYYY-MM-DD";
  static REGEX = /^(\d{4})\-(\d\d)\-(\d\d)$/;

  constructor(year: number, month: number, day: number) {
    Datum.assertIsYear(year);
    Datum.assertIsMonth(month);
    Datum.assertIsDay(day);

    const daysInMonth = Datum.getDaysInMonth(year, month);
    if (day > daysInMonth) {
      throw new Error(`the month ${year}-${month} has only ${daysInMonth} days but you specified day ${day}`);
    }

    this.year = year;
    this.month = month;
    this.day = day;
  }

  /*
   * returns the date represented as a string in format "YYYY-MM-DD"
   */
  public toString(): string {
    const yearStr = padWithLeadingZeros(this.year.toString(), 4);
    const monthStr = padWithLeadingZeros(this.month.toString(), 2);
    const dayStr = padWithLeadingZeros(this.day.toString(), 2);
    return `${yearStr}-${monthStr}-${dayStr}`;
  }

  /*
   * returns date parsed from a string in format "YYYY-MM-DD"
   */
  static fromString(str: string): Datum {
    assertEquals(str.length, Datum.STRING_LENGTH, `date string must have length ${Datum.STRING_LENGTH}`);

    const match = str.match(Datum.REGEX);

    if (match == null) {
      throw new Error(`string must match format ${Datum.FORMAT}`);
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    return new Datum(year, month, day);
  }

  static fromDate(date: Date): Datum {
    const year = date.getFullYear();
    // add 1 since Date months are 0 indexed and Datum months are 1 indexed
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return new Datum(year, month, day);
  }

  /*
   * returns the current date in the local timezone
   */
  static today(): Datum {
    return Datum.fromDate(new Date());
  }

  /*
   * interprets the date as a birthday and returns the current age
   * of a person with that birthday.
   */
  public age(): number {
    const today = Datum.today();

    let age = today.year - this.year;
    const month = today.month - this.month;
    if (month < 0 || (month === 0 && today.day < this.day)) {
      age--;
    }
    return age;
  }

  /*
   * returns whether `this` datum is equal to `other`
   */
  public isEqual(other: Datum): boolean {
    return this.year === other.year &&
      this.month === other.month &&
      this.day === other.day;
  }

  /*
   * returns whether `this` datum is before and not equal to `other`
   */
  public isBefore(other: Datum): boolean {
    return this.year < other.year ||
      (this.year === other.year && this.month < other.month) ||
      (this.year === other.year && this.month === other.month && this.day < other.day);
  }

  /*
   * returns whether `this` datum is after and not equal to `other`
   */
  public isAfter(other: Datum): boolean {
    return this.year > other.year ||
      (this.year === other.year && this.month > other.month) ||
      (this.year === other.year && this.month === other.month && this.day > other.day);
  }

  /*
   * returns the minimum (earliest) Datum in an Iterable
   */
  static min(datums: Iterable<Datum>): Datum | null {
    let min = null;
    for (const datum of datums) {
      if (min == null || datum.isBefore(min)) {
        min = datum;
      }
    }
    return min;
  }

  /*
   * returns the maximum (latest) Datum in an Iterable
   */
  static max(datums: Iterable<Datum>): Datum | null {
    let max = null;
    for (const datum of datums) {
      if (max == null || datum.isAfter(max)) {
        max = datum;
      }
    }
    return max;
  }

  /*
   * for sorting an array of datums in ascending order like so:
   * `arrayOfDatums.sort(Datum.compareAsc)`
   */
  static compareAsc(first: Datum, second: Datum): number {
    if (first.isBefore(second)) {
      return -1;
    } else if (first.isAfter(second)) {
      return 1;
    } else {
      return 0;
    }
  }

  /*
   * for sorting an array of datums in descending order like so:
   * `arrayOfDatums.sort(Datum.compareDesc)`
   */
  static compareDesc(first: Datum, second: Datum): number {
    if (first.isBefore(second)) {
      return 1;
    } else if (first.isAfter(second)) {
      return -1;
    } else {
      return 0;
    }
  }

  public addDays(days: number): Datum {
    assert(Number.isInteger(days), "days must be an integer");
    assert(0 <= days, "day must be positive");

    // this will move down to 0
    let daysToAdd = days;

    // this will move into the future
    let current: Datum = this;

    while (true) {
      const daysUntilNextMonth = current.daysUntilFirstDayOfNextMonth();

      if (daysToAdd < daysUntilNextMonth) {
        return new Datum(current.year, current.month, current.day + daysToAdd);
      }

      // move to first day of next month

      daysToAdd -= daysUntilNextMonth;
      if (current.month === 12) {
        current = new Datum(current.year + 1, 1, 1);
      } else {
        current = new Datum(current.year, current.month + 1, 1);
      }
    }
  }

  /*
   * returns the difference in days between this date and `other`.
   * always returns a positive number.
   * returns 0 if this and `other` are the same date.
   */
  public deltaDays(other: Datum): number {
    if (this.isEqual(other)) {
      return 0;
    }

    let deltaDays = 0;

    const until = this.isAfter(other) ? this : other;
    let current = this.isBefore(other) ? this : other;
    assert(!until.isEqual(current));

    while (true) {
      // we are in the last month
      if (current.year === until.year && current.month === until.month) {
        return deltaDays + Math.abs(current.day - until.day);
      }

      // we handled them being in the same month above
      // so we know we can move forward to the next month without
      // moving over `after`

      deltaDays += current.daysUntilFirstDayOfNextMonth();
      if (current.month === 12) {
        current = new Datum(current.year + 1, 1, 1);
      } else {
        current = new Datum(current.year, current.month + 1, 1);
      }
    }
  }

  static getDaysInMonth(year: number, month: number): number {
    Datum.assertIsYear(year);
    Datum.assertIsMonth(month);
    return [0, 31, (Datum.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
  }

  static getDaysInYear(year: number): number {
    Datum.assertIsYear(year);
    return Datum.isLeapYear(year) ? 366 : 365;
  }

  static isLeapYear(year: number): boolean {
    Datum.assertIsYear(year);
    return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
  }

  public toTuple(): [number, number, number] {
    return [this.year, this.month, this.day];
  }

  static fromTuple([year, month, day]: [number, number, number]): Datum {
    return new Datum(year, month, day);
  }

  public daysUntilFirstDayOfNextMonth(): number {
    return Datum.getDaysInMonth(this.year, this.month) - this.day + 1;
  }

  public weekdayString(): string {
    return Weekday[this.weekday()].toLowerCase().slice(0,3);
  }

  /*
   * always returns the weekday according to the gregorian calendar
   */
  public weekday(): Weekday {
    const referenceMonday = new Datum(2019, 8, 26);
    const deltaDays = this.deltaDays(referenceMonday);
    const weekdayIndex = deltaDays % 7;
    if (this.isBefore(referenceMonday)) {
      switch (weekdayIndex) {
        case 6: return Weekday.Tuesday;
        case 5: return Weekday.Wednesday;
        case 4: return Weekday.Thursday;
        case 3: return Weekday.Friday;
        case 2: return Weekday.Saturday;
        case 1: return Weekday.Sunday;
        case 0: return Weekday.Monday;
      };
    } else {
      switch (weekdayIndex) {
        case 0: return Weekday.Monday;
        case 1: return Weekday.Tuesday;
        case 2: return Weekday.Wednesday;
        case 3: return Weekday.Thursday;
        case 4: return Weekday.Friday;
        case 5: return Weekday.Saturday;
        case 6: return Weekday.Sunday;
      };
    }
  }

  static assertIsYear(year: number) {
    assert(Number.isInteger(year), "year must be an integer");
    assert(0 <= year && year <= 9999, "year must be an integer from 0 to 9999 inclusive");
  }

  static assertIsMonth(month: number) {
    assert(Number.isInteger(month), "month must be an integer");
    assert(1 <= month && month <= 12, "month must be an integer from 1 to 12 inclusive");
  }

  static assertIsDay(day: number) {
    assert(Number.isInteger(day), "day must be an integer");
    assert(1 <= day && day <= 31, "day must be an integer from 1 to 31 inclusive");
  }
}

export function padWithLeadingZeros(str: string, targetLength: number) {
  let result = str;
  while (result.length < targetLength) {
    result = "0" + result;
  }
  return result;
}

test(function testPadWithLeadingZeros() {
  assertEquals("3", padWithLeadingZeros("3", 0));
  assertEquals("3", padWithLeadingZeros("3", 1));
  assertEquals("04", padWithLeadingZeros("4", 2));
  assertEquals("003", padWithLeadingZeros("3", 3));
  assertEquals("005", padWithLeadingZeros("5", 3));
  assertEquals("0022", padWithLeadingZeros("22", 4));
})

test(function testDatumConstructor() {
  const date = new Datum(1988, 9, 11);
  assertEquals(date.year, 1988);
  assertEquals(date.month, 9);
  assertEquals(date.day, 11);
  assertEquals(date.toString(), "1988-09-11");
})

test(function testFromString() {
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

test(function testFromToStringRoundtrip() {
  const str = "0600-03-27";
  assertEquals(Datum.fromString(str).toString(), str);
})

test(function testFromDate() {
  const date = Datum.fromDate(new Date(2017, 4, 15));
  assertEquals(date.year, 2017);
  assertEquals(date.month, 5);
  assertEquals(date.day, 15);
})

test(function testIsLeapYear() {
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

test(function testGetDaysInMonth() {
  assertEquals(Datum.getDaysInMonth(2016, 2), 29);
  assertEquals(Datum.getDaysInMonth(2017, 2), 28);
  assertEquals(Datum.getDaysInMonth(2016, 1), 31);
  assertEquals(Datum.getDaysInMonth(2017, 1), 31);
})

test(function testAddDays() {
  assertEquals([2028, 12, 30], new Datum(2028, 12, 30).addDays(0).toTuple());
  assertEquals([2028, 12, 31], new Datum(2028, 12, 30).addDays(1).toTuple());
  assertEquals([2029, 1, 1], new Datum(2028, 12, 30).addDays(2).toTuple());

  assertEquals([2028, 10, 9], new Datum(2028, 5, 29).addDays(133).toTuple());
  assertEquals([2037, 4, 18], new Datum(2030, 6, 15).addDays(2499).toTuple());
})

test(function testDaysUntilFirstDayOfNextMonth() {
  assertEquals(new Datum(2019, 7, 22).daysUntilFirstDayOfNextMonth(), 10);
  assertEquals(new Datum(2019, 7, 31).daysUntilFirstDayOfNextMonth(), 1);
  assertEquals(new Datum(2019, 8, 1).daysUntilFirstDayOfNextMonth(), 31);
})

test(function testDeltaDays() {
  assertEquals(0, new Datum(2028, 12, 30).deltaDays(new Datum(2028, 12, 30)));
  assertEquals(1, new Datum(2028, 12, 30).deltaDays(new Datum(2028, 12, 31)));
  assertEquals(2, new Datum(2028, 12, 30).deltaDays(new Datum(2029, 1, 1)));

  assertEquals(133, new Datum(2028, 5, 29).deltaDays(new Datum(2028, 10, 9)));
  assertEquals(2499, new Datum(2037, 4, 18).deltaDays(new Datum(2030, 6, 15)));
  assertEquals(2321, new Datum(2024, 4, 17).deltaDays(new Datum(2030, 8, 25)));
})

test(function testWeekday() {
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

test(function testCompareAsc() {
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

test(function testCompareDesc() {
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

test(function testMin() {
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

test(function testMax() {
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
