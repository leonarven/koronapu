(()=>{
	var { log, error } = console;
	console.log   = function(){   log.bind( null, (new Date()).toLocaleString(), "::" ).apply( null, arguments ); }
	console.error = function(){ error.bind( null, (new Date()).toLocaleString(), ":: \[\033[31mERROR\033[0m\] ::" ).apply( null, arguments ); }
})()

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

router.post([ "/datapoints.json", "/helpers.json", "infected.json" ], (req, res) => {
	new Promise(( resolve, reject) => {
		var body = req.body || {};

		if (req.query.role) {
			if (body.role) {
				if (body.role != req.query.role) throw "Invalid argument :: body.role must be exact the ?role=";
			} else {
				body.role = req.query.role;
			}
		}

		resolve( body );
	}).then(body => {
		return contentHandler.postDatapoint( body ).then( result => {
			send( req, res, result );
		});
	}).catch( err => sendErr( req, res, err ));
});


function sendErr( req, res, err, status ) {
	res.status( status = status || 500 );

	if (typeof err == "string") err = new Error( err );
	
	console.error( "ERROR :: ", status, "::", err );

	if (err instanceof Error) {
		// Lopputulos olisi muuten näennäisesti tyhjä taulukko, joten autetaan vähän
		
		err = {
			err     : err, 
			message : err.toString(),
			stack   : err.stack.split( "\n" ).map(v => v.trim( )),
			status  : status
		};
	}

	send( req, res, err );
}

function send( req, res, json ) {
	console.log( "HTTP "+req.method, "::", req.originalUrl );

	if (req.query.asarray) {
		json = Object.keys( json ).map(i => json[ i ]);
	}

	res.end( JSON.stringify( json, null, "\t" ) + "\n" );
}


