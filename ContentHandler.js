const fs        = require( "fs" );

const Datapoint = require( "./Datapoint" );
const Role      = require( "./Role" );
const sqlite3   = require( "sqlite3" ).verbose();

function alustaDB( db ) {
	return Promise.resolve([{"role":"infected","name":"sick90","description":"Tarvin suklaata","id":"61.491151;23.761025","radius":200},{"role":"infected","name":"kipee","description":"voisko joku käydä apteekissa","id":"61.496151;23.791025","radius":400},{"role":"infected","name":"koiraihminen","description":"voiko joku lenkittää mun koiraa välillä","id":"61.492151;23.815025","radius":2000},{"role":"helpers","name":"testi2000","description":"haluan tietää olenko muiden päällä","id":"61.492151;23.761025","radius":1500},{"role":"helpers","name":"kuski","description":"Mulla on auto","id":"61.468151;23.767025","radius":1000},{"role":"helpers","name":"helpr89","description":"Voin auttaa mm. kauppareissuja tekemällä","id":"61.498151;23.761025","radius":500}]).then( arr => {
		return Promise.all( arr.map( dp => {
			return db.postDatapoint( dp ).catch( err => console.error( "alustaDB :: Failed to alusting:", dp, err ));
		}));
	}).catch( err => {
		console.error( "alustaDB :: Failed to alusting:", err );
	});
}

var columns = "id,passhash,role,name,summary,radius".split( "," );

class DBHandler {
	constructor( config ) {
		this.config = config;

		this.error  = null;

		this.db = new sqlite3.Database( config.file, err => {
			if (err) {
				this.error = err;
				console.error( "DBHandler ::", err );
			} else {
				console.log( "DBHandler :: Connected to the chinook database." );
			}
		});
	}

	init( ) {
		return new Promise(( resolve, reject ) => {
			fs.readFile( this.config.schema_file, ( err, schema ) => {
				if (err) return reject( err );

				this.db.run( schema.toString(), err => {
					if (err) return reject( err );

					console.log( "DBHandler.init() :: sqlite3 initialized!" );

					resolve( );
				});
			});
		});
	}

	get( table, where ) {
		var sql   = "SELECT * FROM " + table;
		var attrs = { }, wheres = [];

		return new Promise(( resolve, reject ) => {
			if (where) {
				if (table == "datapoints") {
					for (var k of columns) {
						if (where[k]) {
							wheres.push( k + " = $" + k );
							attrs["$"+k] = where[k];
						}
					}
				}
			}

			if (wheres.length > 0) {
				sql += " WHERE " + wheres.join( " AND " );
			}

			console.log( "DBHandler.get() ::", sql, attrs );
			this.db.all( sql, attrs, ( err, rows ) => (err ? reject( err ) : resolve( rows )));
		}).then(function( rows ){
			return rows;
		}).catch(err => {
			console.error( "DBHandler.get() ::", sql, attrs, err );
			return null;
		});
	}
}

class ContentHandler {
	constructor( config ){
		this.config = config;
		this.datapoints = {}
		this.roles = {};

		this.db = new DBHandler( config.database.sqlite3 );
	}

	init() {
		return this.db.init().then(() => {
			return alustaDB( this );
		}).then(() => {
			this.reload();
		});
	}

	reload() {
		this.datapoints = {};
		this.roles      = {};
	}

	getDatapoints( where ) {
		return this.db.get( "datapoints", where ).then(rows=>{
			var dps = {};
			rows.forEach(dp => {
				try {
					dp = new Datapoint( dp );
					dps[ dp.id ] = dp;
				} catch( e ) { console.error( "ContentHandler.getDatapoints() ::", where, e ); }
			});
			return dps;
		});
	}

	postDatapoint( dp ) {
		return new Promise(( resolve, reject ) => {
			try {
				if (!(dp instanceof Datapoint)) dp = new Datapoint( dp );

				var attrs = [ dp.id, '', dp.role, dp.name, dp.summary, dp.description, dp.radius ];

				this.db.db.run( `
					INSERT INTO datapoints ( id, passhash, role, name, summary, description, radius ) VALUES ( ?, ?, ?, ?, ?, ?, ? );
				`, attrs, err => {
					if (err) return reject( err );
				
					this.getDatapoints({
						id: dp.id
					}).then(datapoints => resolve( datapoints[ dp.id ])).catch( reject );
				});
			} catch (e) { reject(e) };
		});
	}
}

module.exports = ContentHandler;
