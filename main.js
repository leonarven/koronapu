(()=>{
	var { log, error } = console;
	console.log   = function(){   log.bind( null, (new Date()).toLocaleString(), "::" ).apply( null, arguments ); }
	console.error = function(){ error.bind( null, (new Date()).toLocaleString(), ":: \[\033[31mERROR\033[0m\] ::" ).apply( null, arguments ); }
})();

class badRequest extends Error {
	constructor( message ) {
		super( message );
	}
}
class invalidArgument extends badRequest {
	constructor( message ) {
		super( "Invalid argument :: " + message );
	}
}

const express        = require( "express" );
const bodyParser     = require( "body-parser" );

const Datapoint      = require( "./Datapoint" );
const Role           = require( "./Role" );
const ContentHandler = require( "./ContentHandler" );

const config         = require( "./config.json" );

/************************/

console.log( "SYSTEM :: Initiating HTTP server" );

const app            = express();
const router         = new express.Router();

app.use( bodyParser.urlencoded({ extended: false }));
app.use( bodyParser.json( ));

app.use( "/api", router );
app.use( express.static( 'public', config.static ));

/************************/

console.log( "SYSTEM :: Initiating contentHandler ..." );

const contentHandler = new ContentHandler( config );

contentHandler.init().then(() => {
	console.log( "SYSTEM :: Initiating contentHandler ... READY!" );

	app.listen( config.http.port, function(){
		console.log( "SYSTEM :: HTTP server started, port:", config.http.port );
	});
}).catch( err => {
	console.error( "#################################################" );
	console.error( "SYSTEM :: Failed to initiate contentHandler ::", err );
});

/************************/

router.use( "/helpers.json",  (req, res, next) => { req.query.role = "helpers";  next(); });
router.use( "/infected.json", (req, res, next) => { req.query.role = "infected"; next(); });

router.get([ "/datapoints.json", "/helpers.json", "/infected.json" ], (req, res) => {

	var where = {};
	if (req.query.role) where.role = req.query.role;

	contentHandler.getDatapoints( where ).then( json => {
		send( req, res, json );
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

			if (typeof body.id != "undefined")       throw new InvalidArgument( "Invalid argument :: body.role is disallowed on create" );
			
	
			if (typeof body.name != "string")        throw new invalidArgument( "body.name is required and must be typeof string" );

			
			if (typeof body.summary != "string")     throw new invalidArgument( "body.summary is required and must be typeof string" );
			
			
			if (body.radius != null && typeof body.radius != "number")
				throw new invalidArgument( "body.radius must be typeof number" );


			if (typeof body.location == "undefined") throw new InvalidArgument( "body.location is required on create" );

			if (!Array.isArray( body.location ))     throw new InvalidArgument( "body.location must be array" );
			
			if (body.location.length != 2)           throw new InvalidArgument( "body.location must be .length==2 array" );

			body.id = body.location.join( ";" );


			resolve( body );
		} catch(e) {
			reject(e);
		}
	}).then(body => {

		var dp = new Datapoint( body );

		return contentHandler.postDatapoint( dp ).then( result => {
			send( req, res, result );
		}).catch( err => {
			if (err.code == 'SQLITE_CONSTRAINT') {
				throw new badRequest( "body.location is already in use" );
			}
			throw err;
		});
	}).catch(err => sendErr( req, res, err ));
});


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

	send( req, res, err );
}

function send( req, res, json ) {
	console.log( "HTTP "+req.method, "::", req.originalUrl );

	if (req.query.asarray) {
		json = Object.keys( json ).map(i => json[ i ]);
	}

	res.end( JSON.stringify( json, null, "\t" ) + "\n" );
}


