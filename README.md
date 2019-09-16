# datum

[![Build Status](https://travis-ci.org/snd/datum.svg?branch=master)](https://travis-ci.org/snd/datum/branches)

minimalist deno date-only no-time library

dates (year, month, day) only. no time. no timezones.

[example.ts](example.ts) explaining the most important uses:
```typescript
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
```
