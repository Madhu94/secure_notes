const bcrypt = require('bcryptjs');

// Prevents dictionary attacks which could help uncover a large
// set of passwords.
const saltRounds = 2;

const myPassword = 'mylife';

const prom = bcrypt.hash(myPassword, saltRounds);
prom.then((hash) => {
    console.log(`Created Hash for password - ${hash}`);
}, (err) => {
    console.error(`Error in storing password - ${err}`);
});