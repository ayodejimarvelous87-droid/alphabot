const Rating = require("../models/Rating");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const submitRating = async (req, res, next) => {
  try {
    const { rating, feedback = "" } = req.body;

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      throw new AppError(
        "Rating must be between 1 and 5",
        400
      );
    }

    if (typeof feedback !== "string") {
      throw new AppError(
        "Feedback must be text",
        400
      );
    }

    const cleanFeedback = feedback.trim();

    if (cleanFeedback.length > 1000) {
      throw new AppError(
        "Feedback cannot exceed 1000 characters",
        400
      );
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new AppError(
        "User not found",
        404
      );
    }

    const savedRating = await Rating.findOneAndUpdate(
      {
        user: user._id
      },
      {
        user: user._id,
        phone: user.phone,
        email: user.email || "",
        rating: numericRating,
        feedback: cleanFeedback
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    res.json({
      success: true,
      message: "Thank you for rating AlphaBot",
      rating: savedRating.rating
    });

  } catch (error) {
    next(error);
  }
};

const getMyRating = async (req, res, next) => {
  try {
    const rating = await Rating.findOne({
      user: req.user.id
    });

    res.json({
      success: true,
      hasRating: !!rating,
      rating: rating
        ? {
            rating: rating.rating,
            feedback: rating.feedback,
            createdAt: rating.createdAt,
            updatedAt: rating.updatedAt
          }
        : null
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitRating,
  getMyRating
};
