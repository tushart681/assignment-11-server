const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
require('dotenv').config();

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wez9mq6.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyJWT(req, res, next){
    const service = req.headers.authorization;
    if(!service){
        return res.status(401).send({message: 'unauthorized Access'})
    }
    const token = service.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
          return res.status(403).send({message: 'Unauthorized Access'})
        }
        req.decoded = decoded;
        next()
    })

}
async function run(){
    try{
        const serviceCollection = client.db('services').collection('service');
        const reviewCollection = client.db('services').collection('reviews')
        app.get('/services', async(req, res)=>{
            const query = {}
            const cursor = serviceCollection.find(query);
            const service = await cursor.toArray();
            res.send(service)
        })
        app.get('/services/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const service = await serviceCollection.findOne(query);
            res.send(service)
        })
        app.post('/services', async(req, res)=>{
            const card = req.body;
            const result = await serviceCollection.insertOne(card)
            res.send(result)
        })
        app.post('/review', async(req, res)=>{
            const review = req.body;
            const result = await reviewCollection.insertOne(review)
            res.send(result)
        })
        app.get('/review', verifyJWT, async(req, res)=>{
            const doc = req.decoded
            if(doc.email !== req.query.email){
                res.status(403).send({message: 'unauthorized person'})
            }
            let query = {}
            if(req.query.email){
                query = {
                    email: req.query.email
                }
            }
            console.log(req.query.email)
            const cursor = reviewCollection.find();
            const reviews = await cursor.toArray();
            res.send(reviews)
        })
        app.delete('/review/:id',  async(req, res)=>{
            const _id = req.params.id
            const query = {_id: ObjectId(_id)}
            const result = await reviewCollection.deleteOne(query)
            res.send(result)
        })
        app.patch('/review/:id', async(req, res)=>{
            const _id = req.params.id
            const status = req.body.message
            const query = {_id: ObjectId(_id)}
            const updateReview = {
                $set: {
                    message: status
                }
            }
            const result = await reviewCollection.updateOne(query, updateReview)
            res.send(result)
        })
        app.post('/jwt', (req, res)=>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
            res.send({token})
        })
    }
    finally{

    }
}
run().catch(err => console.error(err))


app.get('/', (req, res)=>{
    res.send('i am on')
})
app.listen(port, ()=>{
    console.log(`server is run: ${port}`)
})