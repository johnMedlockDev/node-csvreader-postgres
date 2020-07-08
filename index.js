const SequelizeWorker = require('./Classes/SequelizeWorker');

const sequelizeWorker = new SequelizeWorker();
//
// sequelizeWorker.readCsv("C:\\Dev\\Datasets\\SPY.csv");
//
sequelizeWorker.sql();