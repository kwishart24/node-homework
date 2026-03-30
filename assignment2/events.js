const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("time", (time) => {
  // this registers a listener
  console.log("Time received :", time);
});

setInterval(() => {
  emitter.emit("time", new Date().toString());
}, 5000);

emitter.on("error", (error) => {
  // a listener for errors.  It's a good idea to have one per emitter
  console.log("The emitter reported an error.", error.message);
});

module.exports = emitter;
