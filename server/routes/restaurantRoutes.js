const express = require("express");
const router = express.Router();
const {
  createRestaurant,
  getRestaurants,
  updateRestaurant,
  deleteRestaurant,
} = require("../controllers/restaurantController");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Todas las rutas requieren ser admin
router.use(verifyToken, isAdmin);

router.route("/")
  .get(getRestaurants)
  .post(createRestaurant);

router.route("/:id")
  .put(updateRestaurant)
  .delete(deleteRestaurant);

module.exports = router;
