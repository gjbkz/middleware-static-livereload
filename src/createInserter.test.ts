import test from 'ava';
import {createInserter} from './createInserter.ts';

test('HTML inserter', (t) => {
    const insert = createInserter();
    t.is(insert('<body></body>', 'x'), '<body>x</body>');
    t.is(insert('<head></head>', 'x'), '<head>x</head>');
    t.is(insert('<!doctype   html  > abc', 'x'), '<!doctype   html  >x abc');
    t.is(insert('<meta >', 'x'), 'x<meta >');
    t.is(insert('<title >', 'x'), 'x<title >');
    t.is(insert('<script >', 'x'), 'x<script >');
    t.is(insert('<link >', 'x'), 'x<link >');
});

test('insertBefore', (t) => {
    const insert = createInserter({insertBefore: 'c'});
    t.is(insert('abcd', 'x'), 'abxcd');
});

test('insertAfter', (t) => {
    const insert = createInserter({insertAfter: 'c'});
    t.is(insert('abcd', 'x'), 'abcxd');
});

test('return null if nothing matches', (t) => {
    const insert = createInserter({insertAfter: 'z'});
    t.is(insert('abcd', 'x'), null);
});
