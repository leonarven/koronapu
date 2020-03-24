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

module.exports = { badRequest, invalidArgument };
