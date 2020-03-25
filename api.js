const express        = require( "express" );
const router         = new express.Router();

const Datapoint      = require( "./Datapoint"      );
const Role           = require( "./Role"           );
const ContentHandler = require( "./ContentHandler" );
const AuthHandler    = require( "./AuthHandler"    );

const ROLES = [ 'infected', 'helpers' ];

const { invalidArgument, badRequest } = require( './errors.js' );

/************************/

var contentHandler, authHandler, config;

module.exports = {
	init: _config => {
		config = _config;

		authHandler = new AuthHandler( config );
		
		console.log( "SYSTEM :: Initiating contentHandler ..." );

		contentHandler = new ContentHandler( config );

		return contentHandler.init().then(() => {
			console.log( "SYSTEM :: Initiating contentHandler ... READY!" );
		});
	}, router, authHandler
};

/************************/

router.use( "/helpers.json",  (req, res, next) => { req.query.role = "helpers";  next(); });
router.use( "/infected.json", (req, res, next) => { req.query.role = "infected"; next(); });

router.get([ "/datapoints.json(/:id)?", "/helpers.json", "/infected.json" ], (req, res) => {

	var where = {};
	if (req.query.role) where.role = req.query.role;

	if (req.query.id)   where.id = req.query.id;
	if (req.params.id)  where.id = req.params.id;
	
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
			
			console.log("BODY:\n  ", body);
			
			if (ROLES.indexOf( body.role ) == -1)
				throw new invalidArgument( "body.role must be enum (helpers|infected)" );


			if (typeof body.id != "undefined")
				throw new invalidArgument( "body.id is disallowed on create" );
			
	
			if (typeof body.name != "string")
				throw new invalidArgument( "body.name is required and must be typeof string" );

			
			if (typeof body.summary != "string")
				throw new invalidArgument( "body.summary is required and must be typeof string" );
			
		
			if (body.description != null && typeof body.description != "string")
				throw new invalidArgument( "body.description must be typeof string" );


			if (body.radius != null) {
				body.radius = parseFloat( body.radius );
				if (isNaN( body.radius ))
					throw new invalidArgument( "body.radius must be typeof number" );
			}

			if (body["location[lat]"] != "" ) if (body["location[lon]"] != "" ) {		
				console.log("NOT EMPTY lat");
				body.location = [parseFloat(body["location[lat]"]), parseFloat(body["location[lon]"])];
				console.log("LOCATION:  ", body.location);	
				
				if (!Array.isArray( body.location )) {
					if (body["location[lat]"] && body["location[lon]"]) {
						body.location = [body["location[lat]"], body["location[lon]"]];
					} else {
						throw new invalidArgument( "body.location must be array or object" );
					}
				}
			} else {
				throw new invalidArgument( "body.location is required and must be array or object" );
			}
			
			if (body.location.length != 2)           throw new invalidArgument( "body.location must be .length==2 array" );
			if (typeof body.location[0] != "number") throw new invalidArgument( "body.location[(0|lat)] must be typeof number" );
			if (typeof body.location[1] != "number") throw new invalidArgument( "body.location[(1|lon)] must be typeof number" );



			body.id = body.location[0] + ";" + body.location[1];
			body.description = body.description || '';
			body.radius = body.radius || 1000;

			resolve( body );
		} catch(e) {
			reject(e);
		}
	}).then(body => {

		var dp = new Datapoint( body );

		return contentHandler.createDatapoint( dp ).then( result => {
			send( req, res, result.toJSON() );
		}).catch( err => {
			if (err.code == 'SQLITE_CONSTRAINT') {
				throw new badRequest( "body.location is already in use" );
			}
			throw err;
		});
	}).catch(err => sendErr( req, res, err ));
});

router.post([ "/datapoints.json(/:id)?", "/infected.json" ], (req, res) => {
	var dp = null;
	Promise.resolve( req.query.id || req.params.id ).then( id => {
		if (typeof id != "string") throw new badRequest( "id required" );
	
		return contentHandler.getDatapoints({ id }).then( dps => (dp = dps[id]));
	}).then( dp => {
		if (!dp) throw new badRequest( "datapoint not found" );

		var body = req.body, data = {};
	
		if (typeof body.name == "string")
			data.name = body.name;
		else if (typeof body.name != "undefined")
			throw new invalidArgument( "body.name must be typeof string" );

		
		if (typeof body.summary == "string")
			data.summary = body.summary;
		else if (typeof body.summary != "undefined")
			throw new invalidArgument( "body.summary must be typeof string" );


		if (typeof body.description == "string")
			data.description = body.description;
		else if (typeof body.description != "undefined")
			throw new invalidArgument( "body.description must be typeof string" );


		if (typeof body.radius == "number")
			data.radius = body.radius;
		else if (typeof body.radius != "undefined")
			throw new invalidArgument( "body.radius must be typeof number" );


		return contentHandler.updateDatapoint( dp.id, data );
	}).then( dp => {
		send( req, res, dp.toJSON() );
	}).catch( err => {
		sendErr( req, res, err );
	});
});

/*********************************/

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

	res.setHeader("Content-Type", "application/json; charset=utf-8");

	res.end( JSON.stringify( json, null, "\t" ) + "\n" );
}
