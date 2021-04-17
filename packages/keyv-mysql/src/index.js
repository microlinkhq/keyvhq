'use strict';

const KeyvSql = require('sql');
const mysql = require('mysql2/promise');

class KeyvMysql extends KeyvSql {
	constructor(options) {
		if (typeof options === 'string') {
			options = { uri: options };
		}
		options = Object.assign({
			dialect: 'mysql',
			uri: 'mysql://localhost'
		}, options);

		options.connect = () => Promise.resolve()
			.then(() => mysql.createConnection(options.uri))
			.then(connection => {
				return sql => connection.execute(sql)
					.then(data => data[0]);
			});

		super(options);
	}
}

module.exports = KeyvMysql;
