import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { splitString } from './splitString.ts';

interface TestCaseOk {
  input: string;
  pattern: RegExp;
  expected: Array<string>;
}

interface TestCaseErr {
  input: string;
  pattern: RegExp;
  error: assert.AssertPredicate;
}

const testCases: Array<TestCaseErr | TestCaseOk> = [
  { input: '', pattern: /,/, error: /^TypeError/ },
  { input: '', pattern: /,/g, expected: [''] },
  { input: ' a , b ', pattern: /,/g, expected: [' a ', ' b '] },
  { input: ' a , b ,,c', pattern: /,/g, expected: [' a ', ' b ', '', 'c'] },
  { input: ' abc ', pattern: /,/g, expected: [' abc '] },
];

for (const testCase of testCases) {
  test(JSON.stringify(testCase), () => {
    if ('expected' in testCase) {
      const actual = [...splitString(testCase.input, testCase.pattern)];
      assert.deepEqual(actual, testCase.expected);
    } else {
      assert.throws(
        () => [...splitString(testCase.input, testCase.pattern)],
        testCase.error,
      );
    }
  });
}
