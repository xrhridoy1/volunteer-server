const express = require('express');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');
const admin = require('firebase-admin');
const cors = require('cors');
const port = 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const path = require('path');


const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded())
app.use(cors())

const serviceAccountPath = path.resolve(process.env.FIREBASE_CONFIG_PATH);
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_USER_PASS}@newcluster.blyinzn.mongodb.net/?retryWrites=true&w=majority&appName=newCluster`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {
       
        await client.connect();
        console.log("connected to SUCCESS");
        const db = client.db("volunteerDatabase");
        const coll = db.collection("volunteerItems");

        app.post('/addingItems', (req, res) => {
            const productComming = req.body;
            coll.insertMany([productComming])
                .then(result => {
                    res.send(result.insertedCount > 0)
                })
        })
        app.get('/gettin-data', async (req, res) => {
            const resutl = await coll.find({}).toArray()
            res.send(resutl)
        })

        app.get('/data-by-id', async (req, res) => {
            const id = req.query.id
            const findingData = await coll.find({ _id: new ObjectId(id) }).toArray()
            res.send(findingData[0])
        });

        app.post('/addingUser', async (req, res) => {
            try {
                const result = await db.collection("userAllDetails").insertMany(req.body);

                res.send(result.insertedCount > 0);
            } catch (err) {
                console.error("Error inserting users:", err);
                res.status(500).send(false);
            }
        });

        app.get('/allUser', async (req, res) => {
            const allUserData = await db.collection("userAllDetails").find({}).toArray()
            res.send(allUserData)
        });

        app.delete('/delete/:id', async (req, res) => {
            const id = req.params.id
            const itemDetele = await db.collection("userAllDetails").deleteMany({ _id: new ObjectId(id) })
            res.send(itemDetele)

        })

        app.get('/donation', async (req, res) => {
            const Bearer = req.headers.authorization;
            const queryEmail = req.query.email;

            if (Bearer && Bearer.startsWith('Bearer ')) {
                const idToken = Bearer.split(' ')[1];
                try {
                    const decodedToken = await admin.auth().verifyIdToken(idToken);
                    const tokenEmail = decodedToken.email;

                    if (tokenEmail === queryEmail) {
                        const userDataBase = db.collection("userAllDetails")
                        const readingData = await userDataBase.find({ email: queryEmail }).toArray();
                        return res.send(readingData);
                    } else {
                        return res.status(403).send("You are not authorized");
                    }
                } catch (error) {
                    console.error('Token verification failed:', error);
                    return res.status(403).send("You are not authorized");
                }
            } else {
                return res.status(403).send("You are not authorized");
            }
        });
    } finally {

    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('hello world')
})
app.listen(port, () => console.log(`its running in port: ${port}`))