const Users = require("./user.js");




Users.get({username: "Vivian"}).then(results => console.log("RESULTS FROM TEST", results))