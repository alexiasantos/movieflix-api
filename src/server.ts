import express from "express"
import { PrismaClient } from '../src/generated/prisma/index.js';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';

const swaggerDocument = JSON.parse(
  readFileSync(new URL('../swagger.json', import.meta.url), 'utf-8')
);

const port = 3000;
const app = express();
const prisma =  new PrismaClient();

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
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

app.put("/movies/:id", async(req, res)=>{
    const  id  = Number(req.params.id);
    const data = {...req.body};
    data.release_date = data.release_date ? new Date(data.release_date) : undefined;

    try{

        const movieExists = await prisma.movie.findUnique({where: {id}});
        if(!movieExists){
            return  res.status(404).send({ error: "Movie not found." });
        }
        const movie  = await prisma.movie.update({
            where: {id},
            data: {
                ...data
            },
        })

        res.json(movie);

    }catch(error){
        res.status(500).send({ error: "An error occurred while updating the movie." });
    }
})

app.delete("/movies/:id", async(req, res)=>{
    const  id  = Number(req.params.id);
    
    try{
        const movieExists = await prisma.movie.findUnique({where: {id}});
        if(!movieExists){
            return  res.status(404).send({ error: "Movie not found." });
        }
        const movie = await prisma.movie.delete({
            where:{id}
        })
        res.json({ message: "Movie deleted successfully."});

    }catch(error){
        res.status(500).send({ error: "An error occurred while deleting the movie." });
    }
})

app.get("/movies/:genreName", async(req, res) => {
    const genreName = req.params.genreName;
    try {
        const movies = await prisma.movie.findMany({
            where: {
                genres: {
                    name: {
                        equals: genreName,
                        mode: 'insensitive'
                    }
                }
            },
            include: {
                genres: true,
                languages: true
            }
        });
        res.json(movies);
    } catch (error) {
        res.status(500).send({ error: "An error occurred while retrieving movies by genre." });
    }
})

app.listen( port, () =>{
    console.log(`Server is running at http://localhost:${port}`);
})