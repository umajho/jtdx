/*!
  https://github.com/jsontypedef/json-typedef-js/blob/ab4678ad38f05df43a3c16559a7b9ac515e6648c/src/rfc3339.ts

  MIT License

  Copyright (c) 2020 JSON Type Definition Contributors

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

const pattern =
  /^(\d{4})-(\d{2})-(\d{2})[tT](\d{2}):(\d{2}):(\d{2})(\.\d+)?([zZ]|((\+|-)(\d{2}):(\d{2})))$/;

export default function isRFC3339(s: string): boolean {
  const matches = s.match(pattern);
  if (matches === null) {
    return false;
  }

  const year = parseInt(matches[1]!, 10);
  const month = parseInt(matches[2]!, 10);
  const day = parseInt(matches[3]!, 10);
  const hour = parseInt(matches[4]!, 10);
  const minute = parseInt(matches[5]!, 10);
  const second = parseInt(matches[6]!, 10);

  if (month > 12) {
    return false;
  }

  if (day > maxDay(year, month)) {
    return false;
  }

  if (hour > 23) {
    return false;
  }

  if (minute > 59) {
    return false;
  }

  // A value of 60 is permissible as a leap second.
  if (second > 60) {
    return false;
  }

  return true;
}

function maxDay(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  return MONTH_LENGTHS[month]!;
}

function isLeapYear(n: number): boolean {
  return n % 4 === 0 && (n % 100 !== 0 || n % 400 === 0);
}

const MONTH_LENGTHS = [
  0, // months are 1-indexed, this is a dummy element
  31,
  0, // Feb is handled separately
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31,
];
