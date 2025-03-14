const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require('body-parser');
let mongoose=require('mongoose');
const schema = mongoose.Schema;

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
app.use(bodyParser.urlencoded({extended: false}));

const userSchema = new schema({
  username: {type: String, required: true}
});

const exerciseSchema = new schema({
  userId: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date, required: false}
});

const logSchema = new schema({
  userId: {type: String, required: true},
  userName: {type: String, required: true},
  count: {type: Number, required: true},
  log: {type: Array, required: true}
});

let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema);
let Log = mongoose.model('Log', logSchema);

app.post('/api/users', (req, res) => {
  let username = req.body.username;
  let newUser = new User({username: username});
  
  newUser.save((err, data) => {
    if(err) {
      return console.error(err);
    }

    res.json({username: data.username, _id: data._id});
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  let userId = req.params._id;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;
  
  if(date === '' || date == undefined) {
    date = new Date();
  } else {
    date = new Date(date);
  }

  User.findById(userId, (err, userData) => {
    if(err) {
      return console.error(err);
    }

    let newExercise = new Exercise({userId: userId, description: description, duration: duration, date: date});
    newExercise.save((err, data) => {
      if(err) {
        return console.error(err);
      }

      res.json({username: userData.username, _id: data.userId, description: data.description, duration: data.duration, date: data.date});
    });
  });
});

app.get('/api/users', (req, res) => {
  User.find({}, (err, data) => {
    if(err) {
      return console.error(err);
    }

    let users = data.map(user => {
      return {username: user.username, _id: user._id};
    });

    res.json(users);
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  let userId = req.params._id;
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;
  
  User.findById(userId, (err, userData) => {
    if(err) {
      return console.error(err);
    }
    
    let count = 0;
    let log = [];

    Exercise.find({userId: userId}, (err, data) => {
      if(err) {
        return console.error(err);
      }

      data.forEach(exercise => {
        if((from === undefined || exercise.date >= new Date(from)) && (to === undefined || exercise.date <= new Date(to))) {
          count++;
          if(limit === undefined || log.length < limit) {
            let date = new Date(exercise.date);
            log.push({description: exercise.description, duration: exercise.duration, 'date': date.toDateString()});
          }
        }
      });

      res.json({username: userData.username, _id: userId, count: count, log: log});
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
