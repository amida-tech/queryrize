'use strict';

const fs = require('fs');
const path = require('path');

const byline = require('byline');

const replaceParameters = function (rawQuery, parameters) {
    return rawQuery.replace(/:([\w\d]+)/g, (match, p1) => {
        const replacement = parameters[p1];
        if (replacement) {
            return replacement;
        }
        return match;
    });
};

const queryAccumulator = {
    addLine(line) {
        const commentlessLine = line.split('--')[0];
        const sqlLine = commentlessLine.trim();
        const n = sqlLine.length;
        if (n > 0) {
            const sqlQueries = sqlLine.split(';').map(r => r.trim());
            if (this.currentQuery) {
                sqlQueries[0] = `${this.currentQuery} ${sqlQueries[0]}`;
                this.currentQuery = '';
            }
            this.currentQuery = sqlQueries.pop();
            if (sqlQueries.length) {
                Array.prototype.push.apply(this.queries, sqlQueries);
            }
        }
    },
    isIncomplete() {
        return this.currentQuery;
    },
    getQueries() {
        return this.queries;
    },
    instance() {
        const result = Object(queryAccumulator);
        result.queries = [];
        result.currentQuery = '';
        return result;
    },
};

const readStream = function (stream) {
    return new Promise(function(resolve, reject) {
        const accumulator = queryAccumulator.instance();

        const lineStream = byline.createStream(stream);

        lineStream.on('data', (data) => {
            const line = data.toString();
            accumulator.addLine(line);
        });

        lineStream.on('error', err => reject(err));

        lineStream.on('end', () => {
            if (accumulator.isIncomplete()) {
                return callback(new Error('SQL command ends without \';\'.'));
            }
            return resolve(accumulator.getQueries());
        });
    })
};

const pgFileToQueries = function (filepath) {
    const stream = fs.createReadStream(filepath);
    return readStream(stream);
};

const pgFileToQueriesSync = function (filepath) {
    const content = fs.readFileSync(filepath).toString();
    const lines = content.split('\n');
    const accumulator = queryAccumulator.instance();
    lines.forEach((line) => {
        accumulator.addLine(line);
    });
    if (accumulator.isIncomplete()) {
        throw new Error('SQL command ends without \';\'.');
    }
    return accumulator.getQueries();
};

module.exports = {
    replaceParameters,
    readStream,
    pgFileToQueries,
    pgFileToQueriesSync,
};
