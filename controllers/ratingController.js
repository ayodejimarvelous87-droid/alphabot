const Rating = require("../models/Rating");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const submitRating = async (req, res, next) => {
  try {
    const {
      rating,
      feedback = "",
      displayPublicly = false
    } = req.body;

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

    if (typeof displayPublicly !== "boolean") {
      throw new AppError(
        "displayPublicly must be true or false",
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
        feedback: cleanFeedback,
        displayPublicly
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
      rating: savedRating.rating,
      displayPublicly: savedRating.displayPublicly
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
            displayPublicly: rating.displayPublicly,
            createdAt: rating.createdAt,
            updatedAt: rating.updatedAt
          }
        : null
    });

  } catch (error) {
    next(error);
  }
};


const getPublicRatings = async (req, res, next) => {
  try {
    const page = Math.max(
      Number.parseInt(req.query.page || "1", 10),
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit || "10", 10),
        1
      ),
      50
    );

    const skip = (page - 1) * limit;

    const publicFilter = {
      displayPublicly: true,
      feedback: {
        $exists: true,
        $ne: ""
      }
    };

    const [reviews, totalPublicReviews, aggregate] =
      await Promise.all([
        Rating.find(publicFilter)
          .populate({
            path: "user",
            select: "name"
          })
          .sort({
            createdAt: -1
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Rating.countDocuments(publicFilter),

        Rating.aggregate([
          {
            $group: {
              _id: null,
              averageRating: {
                $avg: "$rating"
              },
              totalRatings: {
                $sum: 1
              }
            }
          }
        ])
      ]);

    const stats = aggregate[0] || {
      averageRating: 0,
      totalRatings: 0
    };

    const formattedReviews = reviews.map((item) => {
      const fullName = item.user?.name || "AlphaBot User";

      const nameParts = fullName
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      let displayName = "AlphaBot User";

      if (nameParts.length === 1) {
        displayName = nameParts[0];
      } else if (nameParts.length >= 2) {
        displayName =
          `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`;
      }

      return {
        rating: item.rating,
        feedback: item.feedback,
        name: displayName,
        createdAt: item.createdAt
      };
    });

    res.json({
      success: true,

      stats: {
        averageRating: Number(
          Number(stats.averageRating || 0).toFixed(1)
        ),
        totalRatings: stats.totalRatings || 0,
        totalPublicReviews
      },

      pagination: {
        page,
        limit,
        total: totalPublicReviews,
        totalPages: Math.ceil(
          totalPublicReviews / limit
        )
      },

      reviews: formattedReviews
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  submitRating,
  getMyRating,
  getPublicRatings
};
