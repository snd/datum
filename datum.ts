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
      throw new RangeError(`the month ${year}-${month} has only ${daysInMonth} days but you specified day ${day}`);
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
    if (str.length !== Datum.STRING_LENGTH) {
      throw new RangeError(`\`str\` argument must have length ${Datum.STRING_LENGTH}`);
    }

    const match = str.match(Datum.REGEX);

    if (match == null) {
      throw new RangeError(`\`str\` argument must match format ${Datum.FORMAT}`);
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
    if (!Number.isInteger(days)) {
      throw new TypeError("`days` argument must be an integer");
    }
    if (0 > days) {
      throw new RangeError(`\`days\` argument must be positive or 0 but is ${days}`);
    }

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

  public subtractDays(days: number): Datum {
    if (!Number.isInteger(days)) {
      throw new TypeError("`days` argument must be an integer");
    }
    if (0 > days) {
      throw new RangeError(`\`days\` argument must be positive or 0 but is ${days}`);
    }

    // this will move down to 0
    let daysToSubtract = days;

    // this will move into the past
    let current: Datum = this;

    while (true) {
      const daysSincePreviousMonth = current.day;

      if (daysToSubtract < daysSincePreviousMonth) {
        return new Datum(current.year, current.month, current.day - daysToSubtract);
      }

      // move to last day of previous month

      daysToSubtract -= daysSincePreviousMonth;
      if (current.month === 1) {
        const lastDayInPreviousMonth = Datum.getDaysInMonth(current.year - 1, 12);
        current = new Datum(current.year - 1, 12, lastDayInPreviousMonth);
      } else {
        const lastDayInPreviousMonth = Datum.getDaysInMonth(current.year, current.month - 1);
        current = new Datum(current.year, current.month - 1, lastDayInPreviousMonth);
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
    if (until.isEqual(current)) {
      throw new Error("invariant failed. this is a bug. please report it at https://github.com/snd/datum/issues");
    }

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
        default: throw new Error("invariant failed. this is a bug. please report it at https://github.com/snd/datum/issues");
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
        default: throw new Error("invariant failed. this is a bug. please report it at https://github.com/snd/datum/issues");
      };
    }
  }

  static assertIsYear(year: number) {
    if (!Number.isInteger(year)) {
      throw new TypeError("`year` argument must be an integer");
    }
    if (0 > year || year > 9999) {
      throw new TypeError("`year` argument must be an integer in range from 0 to 9999 inclusive");
    }
  }

  static assertIsMonth(month: number) {
    if (!Number.isInteger(month)) {
      throw new TypeError("`month` argument must be an integer");
    }
    if (1 > month || month > 12) {
      throw new TypeError("`month` argument must be an integer in range from 1 to 12 inclusive");
    }
  }

  static assertIsDay(day: number) {
    if (!Number.isInteger(day)) {
      throw new TypeError("`day` argument must be an integer");
    }
    if (1 > day || day > 31) {
      throw new TypeError("`day` argument must be an integer in range from 1 to 31 inclusive");
    }
  }
}

export function padWithLeadingZeros(str: string, targetLength: number) {
  let result = str;
  while (result.length < targetLength) {
    result = "0" + result;
  }
  return result;
}
