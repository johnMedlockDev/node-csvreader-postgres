const {Sequelize, DataTypes, QueryTypes} = require('sequelize');
const csv = require('csv-parser');
const fs = require('fs');

module.exports = class SequelizeWorker {

    daysOfWeek = [];
    higher = 0;
    higherDiff = 0.00;
    lower = 0;
    lowerDiff = 0.00;
    upTemp = []
    downTemp = []
    len;
    data;
    temp = 0;
    streak = 0;
    total = this.higher + this.lower;

    constructor() {
        this.sequelize = new Sequelize('mydb', 'mydb', 'mydb', {
            host: 'localhost',
            dialect: 'postgres'
        });

        this.ticker = this.sequelize.define('ticker', {
            // Model attributes are defined here
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false
            },
            open: {
                type: DataTypes.REAL,
                allowNull: false
            },
            high: {
                type: DataTypes.REAL,
                allowNull: false
            },
            low: {
                type: DataTypes.REAL,
                allowNull: false
            },
            close: {
                type: DataTypes.REAL,
                allowNull: false
            },
            volume: {
                type: DataTypes.BIGINT,
                allowNull: false
            }
        });
    }

    async insert(d, o, h, l, c, v) {
        await this.ticker.sync({force: true});
        await this.ticker.create({date: d, open: o, high: h, low: l, close: c, volume: v})
    }

    async writeCsv(pathToFile) {
        // Pass in absolute path to a csv to read it in
        // also replace first row with d,o,h,l,c,v
        const file_descriptor = await fs.createReadStream(pathToFile)
            .pipe(csv())
            .on('data', (row) => {
                const {v, d, c, o, l, h} = row;
                this.insert(d, o, h, l, c, v);
            })
            .on('end', () => {
                console.log('CSV file successfully processed');
            }).then(() => {
                fs.close(file_descriptor, (err) => {
                        if (err) {
                            console.error('Failed to close file', err);
                        } else {
                            console.log("\n> File Closed successfully");
                        }
                        Sequelize.prototype.close = function () {
                            this.connectionManager.close();
                        };
                    }
                );
            }).catch((error) => {
                console.log(error);
            });
    }

    async sql() {
        this.data = await this.sequelize.query("SELECT date, open, close FROM tickers order by date", {type: QueryTypes.SELECT});
        this.len = this.data.length;
        this.daysCalculation();
        this.openCloseDiffs();
        this.uptrendStreaks();
        this.downtrendStreaks();
        this.consoleOutput();

        Sequelize.prototype.close = function () {
            this.connectionManager.close();
        };
    }

    daysCalculation() {
        const days = this.len / 5;

        let monday = 0;
        let tuesday = 0;
        let wednesday = 0;
        let thursday = 0;
        let friday = 0;

        for (let i = 0; i < this.len; i++) {
            let diff = this.data[i]['open'] - this.data[i]['close'];

            if (diff < 0) {
                let day = new Date(this.data[i]['date']).getDay();
                if (day === 0) {
                    monday++;
                } else if (day === 1) {
                    tuesday++;
                } else if (day === 2) {
                    wednesday++;
                } else if (day === 3) {
                    thursday++;
                } else if (day === 4) {
                    friday++;
                }
            }
        }

        this.daysOfWeek.push(monday / days);
        this.daysOfWeek.push(tuesday / days);
        this.daysOfWeek.push(wednesday / days);
        this.daysOfWeek.push(thursday / days);
        this.daysOfWeek.push(friday / days);

        this.daysOfWeek = this.daysOfWeek.map(function (each_element) {
            return Number(each_element.toFixed(2));
        });
    }


    countingTread(arr) {
        let count1 = 0;
        let count2 = 0;
        let count3 = 0;
        let count4 = 0;
        let count5 = 0;
        let count6 = 0;
        let misc = 0;

        let countArr = [];

        for (let i = 0; i < arr.length; i++) {
            let index = arr[i];
            if (index === 1) {
                count1++;
            } else if (index === 2) {
                count2++;
            } else if (index === 3) {
                count3++;
            } else if (index === 4) {
                count4++;
            } else if (index === 5) {
                count5++;
            } else if (index === 6) {
                count6++;
            } else {
                misc++;
            }
        }
        countArr.push(count1);
        countArr.push(count2);
        countArr.push(count3);
        countArr.push(count4);
        countArr.push(count5);
        countArr.push(count6);
        countArr.push(misc);
        return countArr;
    }

    openCloseDiffs() {
        for (let i = 1; i < this.len; i++) {
            let diff = this.data[i]['open'] - this.data[i]['close'];

            if (this.data[i]['open'] < this.data[i]['close']) {
                this.higherDiff -= diff;
                this.higher++;
            } else {
                this.lowerDiff += diff;
                this.lower++;
            }
        }
    }

    uptrendStreaks() {
        for (let i = 1; i < this.len; i++) {
            this.temp = this.data[i - 1]['open'] - this.data[i - 1]['close'];

            if ((this.data[i]['open'] - this.data[i]['close']) < 0 && this.temp < 0) {
                this.streak++;
            } else if (this.streak === 0) {
            } else {
                this.upTemp.push(this.streak);
                this.streak = 0;
            }
        }
    }

    downtrendStreaks() {
        for (let i = 1; i < this.len; i++) {
            this.temp = this.data[i - 1]['open'] - this.data[i - 1]['close'];
            if ((this.data[i]['open'] - this.data[i]['close']) > 0 && this.temp > 0) {
                this.streak++;
            } else if (this.streak === 0) {
            } else {
                this.downTemp.push(this.streak);
                this.streak = 0;
            }
        }

    }

    consoleOutput() {
        if (this.higher > this.lower) {
            console.log("======================================================================================================\n")
            console.log(`This is a bullish stock\n`)
            console.log(`${Number((this.higher / this.total).toFixed(2))}% of the time the ticker closes higher on the day\n`)
            console.log(`Distribution of up days in a row ${this.countingTread(this.upTemp)}\n`)
            console.log(`Distribution of down days in a row ${this.countingTread(this.downTemp)}\n`)
            console.log(`Stats for up days on each day of the week ${this.daysOfWeek}\n`)
        } else {
            console.log(`${Number((this.lower / this.total).toFixed(2))}% of the time the ticker closes higher on the day`)
            console.log(`This is a bearish stock`)
        }
        console.log(`Accumulation up ${Number(this.higherDiff).toFixed(2)}\n`)
        console.log(`Accumulation down ${Number(this.lowerDiff).toFixed(2)}\n`)
    }
}


