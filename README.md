# koronapu
Location based platform (API) for asking ang giving help and for solidarity.

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
			"file": "./database.db"
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
