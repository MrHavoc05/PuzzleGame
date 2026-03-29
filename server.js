const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

app.get("/", (req,res)=>{
    res.sendFile(path.join(__dirname,"public","index.html"));
});

/* ------------------ MONGODB CONNECTION ------------------ */


mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

/* ------------------ SCHEMAS ------------------ */

const wordSchema = new mongoose.Schema({
    original: String,
    jumbled: String
});

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    coins: Number
});

const Word = mongoose.model("Word", wordSchema);
const User = mongoose.model("User", userSchema);

app.get("/", (req,res)=>{
    res.sendFile(path.join(__dirname,"public","index.html"));
});

/* ------------------ GET RANDOM WORD ------------------ */

app.get('/api/get-word', async (req, res) => {

    const words = await Word.aggregate([{ $sample: { size: 1 } }]);

    if(words.length > 0){
        res.json({
            original: words[0].original,
            jumbled: words[0].jumbled
        });
    } else {
        res.json({error:"No words found"});
    }

});


/* ------------------ SIGNUP ------------------ */

app.post('/api/signup', async (req,res)=>{

    const {username,password} = req.body;

    try{

        const existingUser = await User.findOne({username});

        if(existingUser){
            return res.json({success:false,message:"User already exists"});
        }

        const newUser = new User({
            username,
            password,
            coins:0
        });

        await newUser.save();

        res.json({success:true});

    }catch(err){
        res.json({success:false});
    }

});


/* ------------------ LOGIN ------------------ */

app.post('/api/login', async (req,res)=>{

    const {username,password} = req.body;

    const user = await User.findOne({username,password});

    if(user){
        res.json({
            success:true,
            userId:user._id,
            coins:user.coins
        });
    }else{
        res.json({success:false});
    }

});


/* ------------------ UPDATE COINS ------------------ */

app.post('/api/update-coins', async (req,res)=>{

    const {userId,coins} = req.body;

    await User.findByIdAndUpdate(userId,{coins:coins});

    res.json({success:true});

});

// GET TOP PLAYERS
app.get("/api/leaderboard", async (req,res)=>{
    try{
        const players = await User.find()
        .sort({coins:-1})   // highest coins first
        .limit(10)          // top 10 players
        .select("username coins -_id");

        res.json(players);
    }
    catch(err){
        res.status(500).json({error:"Failed to load leaderboard"});
    }
});


/* ------------------ SERVER START ------------------ */

app.listen(port,()=>{
    console.log(`Server running at http://localhost:${port}`);
});