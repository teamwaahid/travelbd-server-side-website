const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is running");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hohs4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("travel");
    const place_Collection = database.collection("places");
    const cart_Collection = database.collection("cart");

    // load data get api
    app.get("/places", async (req, res) => {
      const size = parseInt(req.query.size);
      const page = req.query.page;
      const cursor = place_Collection.find({});
      const count = await cursor.count();
      let places;

      if (size && page) {
        places = await cursor
          .skip(size * page)
          .limit(size)
          .toArray();
      } else {
        places = await cursor.toArray();
      }
      res.json({ count, places });
    });

    // load single data get api
    app.get("/places/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const place = await place_Collection.findOne(query);
      res.json(place);
    });

    // load cart data according to user id get api
    app.get("/cart/:uid", async (req, res) => {
      const uid = req.params.uid;
      const query = { uid: uid };
      const result = await cart_Collection.find(query).toArray();
      res.json(result);
    });

    // add data to cart collection with additional info
    app.post("/place/add", async (req, res) => {
      const place = req.body;
      const result = await cart_Collection.insertOne(place);
      res.json(result);
    });

    // delete data from cart delete api
    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await cart_Collection.deleteOne(query);
      res.json(result);
    });

    // purchase delete api
    app.delete("/purchase/:uid", async (req, res) => {
      const uid = req.params.uid;
      const query = { uid: uid };
      const result = await cart_Collection.deleteMany(query);
      res.json(result);
    });

    // orders get api
    app.get("/orders", async (req, res) => {
      const result = await cart_Collection.find({}).toArray();
      res.json(result);
    });

    // Confirmation put API
    app.put('/confirmation/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const updatePlace = {
        $set: {
          status: "Confirm"
        },
      };
      const result = await cart_Collection.updateOne(query, updatePlace);
      res.json(result)
      // console.log(result);
    })

    // Add place API
    app.post('/newplace/add', async (req, res) => {
      const user = req.body;
      const result = await place_Collection.insertOne(user);
      res.json(result);
      // console.log(user)
    });

  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("server is running on port", port);
});
