const csv = require('csv-parser');
const fs = require('fs');
const {Pool} = require('pg')

const pool = new Pool({
    user: 'mydb',
    host: 'localhost',
    database: 'mydb',
    password: 'mydb',
    port: 5432,
});


fs.createReadStream('C:\\Dev\\Datasets\\SPY.csv')
    .pipe(csv())
    .on('data', (row) => {
        console.log(row)

        let d = row.d;
        let o = row.o;
        let h = row.h;
        let l = row.l;
        let c = row.c;
        let v = row.v;

        pool.connect((err, client, done) => {
            const shouldAbort = err => {
                if (err) {
                    console.error('Error in transaction', err.stack)
                    client.query('ROLLBACK', err => {
                        if (err) {
                            console.error('Error rolling back client', err.stack)
                        }
                        // release the client back to the pool
                        done()
                    })
                }
                return !!err
            }
            client.query('BEGIN', err => {
                if (shouldAbort(err)) return

                const qText = 'INSERT INTO price_data(date_, open, high, low, close, volume) VALUES ($1, $2,$3, $4,$5, $6)'
                const qValues = [d, o, h, l, c, v]
                console.log(qValues)

                client.query(qText, qValues, (err, res) => {
                    if (shouldAbort(err)) return
                    client.query('COMMIT', err => {
                        if (err) {
                            console.error('Error committing transaction', err.stack)
                        }
                        done()
                    })
                })
            })
        })
    })
    .on('end', () => {
        console.log('CSV file successfully processed');
    });


