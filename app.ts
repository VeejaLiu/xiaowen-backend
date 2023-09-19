import express from 'express';
import index from "./index";

const app = express()
const port = 3000


app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));
app.use('/', index);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
