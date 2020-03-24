const express        = require( "express" );
const router         = new express.Router();

const Datapoint      = require( "./Datapoint" );
const Role           = require( "./Role" );
const ContentHandler = require( "./ContentHandler" );

const ROLES = [ 'infected', 'helpers' ];

const { invalidArgument, badRequest } = require( './errors.js' );

var contentHandler, config;

/************************/

router.use( "/helpers.json",  (req, res, next) => { req.query.role = "helpers";  next(); });
router.use( "/infected.json", (req, res, next) => { req.query.role = "infected"; next(); });

router.get([ "/datapoints.json", "/helpers.json", "/infected.json" ], (req, res) => {

	var where = {};
	if (req.query.role) where.role = req.query.role;

	contentHandler.getDatapoints( where ).then( datapoints => {
		var result = {};

		for (var id in datapoints) result[ id ] = datapoints[ id ].toJSON();
	
		send( req, res, result );
	}).catch( err => {
		console.error( err );
		res.status( 500 );
		send( req, res, err );
	});
});


// Uuden luominen
router.post([ "/helpers.json", "/infected.json" ], (req, res) => {
	new Promise(( resolve, reject) => {
		try {
			var body = req.body || {};

			if (req.query.role) {
				if (body.role) {
					if (body.role != req.query.role) throw "Invalid argument :: body.role must be exact the ?role=";
				} else {
					body.role = req.query.role;
				}
			}

			if (ROLES.indexOf( body.role ) == -1)
				throw new InvalidArgument( "body.role must be enum (helpers|infected)" );


			if (typeof body.id != "undefined")
				throw new InvalidArgument( "body.id is disallowed on create" );
			
	
			if (typeof body.name != "string")
				throw new invalidArgument( "body.name is required and must be typeof string" );

			
			if (typeof body.summary != "string")
				throw new invalidArgument( "body.summary is required and must be typeof string" );
			
			
			if (body.radius != null && typeof body.radius != "number")
				throw new invalidArgument( "body.radius must be typeof number" );


			if (typeof body.location == "object") {
				if (!Array.isArray( body.location )) {
					if (body.location.lan && body.location.lon) {
						body.location = [ body.location.lan, body.location.lon ]; 
					} else {
						throw new InvalidArgument( "body.location must be array or object" );
					}
				}
			} else {
				throw new InvalidArgument( "body.location is required and must be array or object" );
			}
			
			if (body.location.length != 2)           throw new InvalidArgument( "body.location must be .length==2 array" );
			if (typeof body.location[0] != "number") throw new InvalidArgument( "body.location[(0|lat)] must be typeof number" );
			if (typeof body.location[1] != "number") throw new InvalidArgument( "body.location[(1|lon)] must be typeof number" );

			body.id = body.location[0] + ";" + body.location[1];


			resolve( body );
		} catch(e) {
			reject(e);
		}
	}).then(body => {

		var dp = new Datapoint( body );

		return contentHandler.postDatapoint( dp ).then( result => {
			send( req, res, result.toJSON() );
		}).catch( err => {
			if (err.code == 'SQLITE_CONSTRAINT') {
				throw new badRequest( "body.location is already in use" );
			}
			throw err;
		});
	}).catch(err => sendErr( req, res, err ));
});

/*********************************/

function init( _config ) {
	config = _config;

	console.log( "SYSTEM :: Initiating contentHandler ..." );

	contentHandler = new ContentHandler( config );

	return contentHandler.init().then(() => {
		console.log( "SYSTEM :: Initiating contentHandler ... READY!" );
	});
}

function sendErr( req, res, err, status ) {

	if (typeof err == "string") err = new Error( err );

	if (err instanceof badRequest) {
		status = 400;
	}

	if (err instanceof Error) {
		// Lopputulos olisi muuten näennäisesti tyhjä taulukko, joten autetaan vähän
		
		err = {
			err     : err, 
			message : err.toString(),
			stack   : err.stack && err.stack.split( "\n" ).map(v => v.trim( )),
			status  : status
		};
	}

	res.status( status = status || 500 );

	console.error( "ERROR :: ", status, "::", err );

	req.query = {};
	send( req, res, err );
}

function send( req, res, json ) {
	console.log( "HTTP "+req.method, "::", req.originalUrl );

	if (req.query.asarray) {
		json = Object.keys( json ).map(i => json[ i ]);
	}

	console.log(json);
	
	res.end( JSON.stringify( json, null, "\t" ) + "\n" );
}

/*********************************/

module.exports = { router, init };
