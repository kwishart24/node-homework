const express = require("express");
const router = express.Router();
const dogs = require("../dogData.js");
const { ValidationError, NotFoundError } = require("../error.js");

// GET for adoptable dogs
router.get("/dogs", (req, res) => {
  res.json(dogs);
});

// POST for adoption applications
router.post("/adopt", (req, res) => {
  const { name, address, email, dogName } = req.body;

  // Throw a ValidationError if form not completely filled out
  if (!name || !email || !dogName) {
    throw new ValidationError("Missing required fields");
  }

  // Find dog in imported "dogs" array
  const foundDog = dogs.find((d) => d.name === dogName);

  //Throw a NotFoundError
  if (!foundDog || foundDog.status !== "available") {
    throw new NotFoundError("Dog not found or not available");
  }

  // Success message if adoption inquiry submitted successfully
  return res.status(201).json({
    message: `Adoption request received. We will contact you at ${email} for further details.`,
  });
});

// Error
router.get("/error", (req, res) => {
  throw new Error("Test error");
});

module.exports = router;
