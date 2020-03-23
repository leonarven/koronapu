class Role {
	constructor() {
		this.datapoints = {};
	}

	push( datapoint ) {
		this.datapoints[ datapoint.id ] = datapoint;
	}
}

module.exports = Role;
