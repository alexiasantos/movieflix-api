import express from "express"
import { PrismaClient } from '../src/generated/prisma/index.js';

const port = 3000;
const app = express();
const prisma =  new PrismaClient();

app.use(express.json());
app.get("/movies", async (_, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
           title: 'asc'
        },
        include: {
            genres: true,
            languages: true
        }
    });
    res.json(movies);
})


app.post("/movies", async(req, res) => {
    try {

       const movieWithSameTitle = await prisma.movie.findFirst({where: {title: {equals: req.body.title, mode: 'insensitive'}}});
        
       if(movieWithSameTitle){
            return res.status(409).send({ error: "A movie with the same title already exists." });
        }
       
       const newMovie = await prisma.movie.create({
            data: {
            ...req.body
            }
        });
        res.status(201).send(newMovie);
    } catch (error) {
        res.status(500).send({ error: "An error occurred while creating the movie." });
    }
})

app.listen( port, () =>{
    console.log(`Server is running at http://localhost:${port}`);
})