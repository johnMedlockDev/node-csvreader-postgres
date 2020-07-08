const {Sequelize, Op, DataTypes, Model, QueryTypes} = require('sequelize');
const csv = require('csv-parser');
const fs = require('fs');

module.exports = class SequelizeWorker {
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
        }, {
            // Other model options go here
        });

    }

    async insert(d, o, h, l, c, v) {
        await this.ticker.sync({force: true});
        await this.ticker.create({date: d, open: o, high: h, low: l, close: c, volume: v})
    }

    async readCsv(pathToFile) {
        // Pass in absolute path to a csv to read it in
        // also replace first row with d,o,h,l,c,v
        await fs.createReadStream(pathToFile)
            .pipe(csv())
            .on('data', (row) => {
                this.insert(row.d, row.o, row.h, row.l, row.c, row.v);
            })
            .on('end', () => {
                console.log('CSV file successfully processed');
            });
    }

    async sql() {
        const data = await this.sequelize.query("SELECT date, open, close FROM tickers order by date", {type: QueryTypes.SELECT});
        const len = data.length;

        let higher = 0;
        let higherDiff = 0.00;

        let lower = 0;
        let lowerDiff = 0.00;

        let upTemp = []
        let downTemp = []

        let temp = 0;
        let streak = 0;

        let monday =0;
        let tuesday = 0;
        let wednesday = 0;
        let thursday = 0;
        let friday = 0;
        const days = len/5;


        for (let i = 0; i < len; i++) {
            let diff = data[i]['open'] - data[i]['close'];

            if (diff < 0) {
                let day = new Date(data[i]['date']).getDay();
                if(day === 0){
                    monday++;
                }
                else if (day === 1) {
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

        const daysOfWeek = [];
        daysOfWeek.push(monday/days);
        daysOfWeek.push(tuesday/days);
        daysOfWeek.push(wednesday/days);
        daysOfWeek.push(thursday/days);
        daysOfWeek.push(friday/days);



        for (let i = 1; i < len; i++) {
            let diff = data[i]['open'] - data[i]['close'];

            if (data[i]['open'] < data[i]['close']) {
                // console.log("closed higher on the day")
                higherDiff -= diff;
                higher++;
            } else {
                lowerDiff += diff;
                // console.log("closed lower on the day")
                lower++;
            }
        }


        for (let i = 1; i < len; i++) {
            temp = data[i - 1]['open'] - data[i - 1]['close'];

            if ((data[i]['open'] - data[i]['close']) > 0 && temp > 0) {
                streak++;
            } else if (streak === 0) {

            } else {
                downTemp.push(streak);
                streak = 0;
            }
        }


        for (let i = 1; i < len; i++) {
            temp = data[i - 1]['open'] - data[i - 1]['close'];

            if ((data[i]['open'] - data[i]['close']) < 0 && temp < 0) {
                streak++;
            } else if (streak === 0) {

            } else {
                upTemp.push(streak);
                streak = 0;
            }

        }


        const total = higher + lower;


        if (higher > lower) {
            console.log(`${Number((higher / total).toFixed(2))}% of the time the ticker closes higher on the day`)
            console.log(`This is a bullish stock`)

            console.log(this.countingTread(upTemp))
            console.log(this.countingTread(downTemp))
            console.log(daysOfWeek)
        } else {
            console.log(`${Number((lower / total).toFixed(2))}% of the time the ticker closes higher on the day`)
            console.log(`This is a bearish stock`)
        }

        console.log(Number(higherDiff).toFixed(2), " ", Number(lowerDiff).toFixed(2))
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
}


