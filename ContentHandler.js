const Datapoint = require( "./Datapoint" );
const Role      = require( "./Role" );
const sqlite3   = require( "sqlite3" ).verbose();

function alustaDB( db ) {
	return Promise.resolve([{"role":"infected","nick":"sick90","description":"Tarvin suklaata","id":"61.491151,23.761025","location":[61.491151,23.761025],"radius":200},{"role":"infected","nick":"kipee","description":"voisko joku käydä apteekissa","id":"61.496151,23.791025","location":[61.496151,23.791025],"radius":400},{"role":"infected","nick":"koiraihminen","description":"voiko joku lenkittää mun koiraa välillä","id":"61.492151,23.815025","location":[61.492151,23.815025],"radius":2000},{"role":"helpers","nick":"testi2000","description":"haluan tietää olenko muiden päällä","id":"61.492151,23.761025","location":[61.492151,23.761025],"radius":1500},{"role":"helpers","nick":"kuski","description":"Mulla on auto","id":"61.468151,23.767025","location":[61.468151,23.767025],"radius":1000},{"role":"helpers","nick":"helpr89","description":"Voin auttaa mm. kauppareissuja tekemällä","id":"61.498151,23.761025","location":[61.498151,23.761025],"radius":500}]).then( arr => {
		return Promise.all( arr.map( dp => {
			return db.postDatapoint( dp ).catch( err => console.error( "alustaDB :: Failed to alusting:", dp, err ));
		}));
	}).catch( err => {
		console.error( "alustaDB :: Failed to alusting:", err );
	});
}

class DBHandler {
	constructor( config ) {
		this.config = config;

		this.error  = null;

		this.db = new sqlite3.Database( config.file, err => {
			if (err) {
				this.error = err;
				console.error( err.message );
			} else {
				console.log( 'Connected to the chinook database.' );
			}
		});
	}

	init( ) {
		return new Promise(( resolve, reject ) => {
			this.db.run( 'DROP TABLE IF EXISTS datapoints', err => {
				if (err) return reject( err );
		
				this.db.run(`
					CREATE TABLE IF NOT EXISTS datapoints (
						id          text PRIMARY KEY,
						passhash    text NOT NULL,
						role        text NOT NULL,
						name        text NOT NULL,
						summary     text NOT NULL,
						description text NOT NULL DEFAULT '',
						radius      integer
					);
				`, err => {
					if (err) return reject( err );

					console.log( "sqlite3 initialized!" );

					resolve( );
				});
			});
		});
	}

	get( table, where ) {
		var sql   = "SELECT * FROM " + table;
		var attrs = { };

		return new Promise(( resolve, reject ) => {
			if (where) {
				if (table == "datapoints") for (var k of [ 'id', 'role', 'name', 'description', 'radius' ]) if (where[k]) attrs["$"+k] = where[k];
			}

			console.log( "DBHandler.get() ::", sql, attrs );
			this.db.all( sql, attrs, ( err, rows ) => {
				if (err) reject( err );
				else resolve( rows );
			});
		}).then(function( rows ){
			return rows;
		}).catch(err => {
			console.error( sql, attrs, err );
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
/*
		
		require( "./datapoints.json" ).forEach(dp => {
			this.datapoints[ dp.id ] = new Datapoint( dp );
	
			this.roles[ dp.role ] = this.roles[ dp.role ] || new Role();
			this.roles[ dp.role ].push( dp );
		});*/
	}

	getDatapoints( where ) {
		return this.db.get( "datapoints", where ).then(rows=>{
			var dps = {};
			rows.forEach(dp => {
				try {
					dp = new Datapoint( dp );
					dps[ dp.id ] = dp;
				} catch( e ) { console.error(e); }
			});
			return dps;
		});
	}

	postDatapoint( dp ) {
		return new Promise(( resolve, reject ) => {
			try {
				if (!(dp instanceof Datapoint)) dp = new Datapoint( dp );

				var attrs = [ dp.id, '', dp.role, dp.nick, dp.description, dp.radius ];

				this.db.db.run( `
					INSERT INTO datapoints ( id, passhash, role, name, description, radius ) VALUES ( ?, ?, ?, ?, ?, ? );
				`, attrs, err => {
					if (err) return reject( err );
				
					resolve( "hereiam" );
				});
			} catch (e) { reject(e) };
		});
	}
}

module.exports = ContentHandler;
