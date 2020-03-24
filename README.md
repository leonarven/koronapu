# koronapu
Location based platform (API) for asking ang giving help and for solidarity.

### Asennus

`npm i`

### Käyttö

`node main.js`

### Esimerkkinä config.json
```
{
	"http": {
		"port": 8080
	},
	"database": {
		"sqlite3": {
			"file"        : "./database.db",
			"sqlite_file" : "./schema.sqlite"
		}
	},
	"static": {
		"dotfiles"   : "ignore",
		"etag"       : false,
		"extensions" : [ "json" ],
		"index"      : false,
		"maxAge"     : "1d",
		"redirect"   : false
	}
}
```
