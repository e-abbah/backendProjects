import express, { response } from "express";
import dotenv from "dotenv";
import axios from "axios";
import {createClient} from "redis";
import rateLimit from "express-rate-limit";
  

dotenv.config()

const app = express();
const PORT = 3000;
const client = await createClient()
.on("error", (err) => console.log("Redis Client Error", err))
  .connect();
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 4,                  // limit each IP to 100 requests per window
    message: { message: "Too many requests, please try again later." }
});

  app.get('/weather',limiter, async(req, res) => {

    const {city} = req.query
    if(!city){
        return res.status(400).json({
            message: "Please provide a city."
        })
    }

    const normalizedCity = city.toLowerCase();

    try{
        const cached = await client.get(normalizedCity);
        if (cached) {
            console.log("cache hit for", normalizedCity);
            return res.status(200).json({
                message: JSON.parse(cached)
            })
        }

        console.log("cache miss for", normalizedCity)
        const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(normalizedCity)}?key=${process.env.WEATHER_API_KEY}&unitGroup=metric&include=current`;

        const response = await axios.get(url);

        const weatherData = {
            city: response.data.resolvedAddress,
            temperature: response.data.currentConditions.temp,
            condition: response.data.currentConditions.conditions,
            humidity: response.data.currentConditions.humidity,
            wind_speed: response.data.currentConditions.windspeed,
        };

        await client.set(normalizedCity, JSON.stringify(weatherData), { EX: 12 * 60 * 60 });

        return res.status(200).json({
            message: weatherData
        })
    } catch (err) {
        console.error(err);
        if (err.response){
            const status = err.response.status;

            if (status === 400){
                 return res.status(400).json({
                       message: "Invalid city name"

            })
            }
            else if (status === 401){
                 return res.status(500).json({
                       message: "Internal server error"

            })
            } else {
            return res.status(502).json({
                message: "Failed to fetch weather data from upstream provider."
            }); 
        }
    
        }else {
            return res.status(504).json({
                message: "Network timed out"
            })
        }
    }
            

       
      
    
});

app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`)
})