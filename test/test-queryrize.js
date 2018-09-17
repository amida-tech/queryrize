/* global describe,it */

'use strict';

process.env.NODE_ENV = 'test';

const path = require('path');

const _ = require('lodash');
const chai = require('chai');

const { expect } = chai;

const queryrize = require('../lib/queryrize');

describe('queryrize unit', function queryrizeUnit() {
    it('replaceParameters - all matched', function replaceParametersAllMatched() {
        const result = queryrize.replaceParameters('ABC :filepath CDE :flag', {
            filepath: '\'substitute\'',
            flag: 'true',
        });
        expect(result).to.equal('ABC \'substitute\' CDE true');
    });

    it('replaceParameters - some unmatched matched', function replaceParametersSomeUnmatched() {
        const result = queryrize.replaceParameters('ABC :filepath CDE :not FGGGRD :flag', {
            filepath: '\'substitute\'',
            flag: 'true',
        });
        expect(result).to.equal('ABC \'substitute\' CDE :not FGGGRD true');
    });

    it('incomplete script', function incompleteScript() {
        const pathThrow = path.join(__dirname, 'fixtures/script_incomplete.sql');
        const fn = _.bind(queryrize.pgFileToQueriesSync, queryrize, pathThrow, {});
        expect(fn).to.throw(Error);
    });

    it('read sync', function readSync() {
        const filepath = path.join(__dirname, 'fixtures/script_0_of_3.sql');
        return queryrize.pgFileToQueries(filepath)
            .then((expectedQueries) => {
                const queries = queryrize.pgFileToQueriesSync(filepath, {});
                expect(queries).to.deep.equal(expectedQueries);
            });
    });
});
