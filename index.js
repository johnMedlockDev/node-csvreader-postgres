const SequelizeWorker = require('./Classes/SequelizeWorker');

const sequelizeWorker = new SequelizeWorker();

processInputs();

function processInputs() {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.question(`What do you want to do? (write, read, quit)\n`, answer => {
        if (answer === "write") {
            readline.question(`What's the name of the file?\n`, answer => {
                sequelizeWorker.writeCsv(`C:\\Dev\\Datasets\\${answer}.csv`);
                readline.close();
                processInputs();
            });
        } else if (answer === "read") {
            sequelizeWorker.sql();
            readline.close();
            processInputs();
        } else {
            readline.close();
        }
    })
}
