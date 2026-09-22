const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    // Authorization header se token lena
    const authHeader = req.headers.authorization;

    // Token nahi mila
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized, token missing"
      });
    }

    // "Bearer TOKEN" se sirf TOKEN nikalna
    const token = authHeader.split(" ")[1];

    // Token verify karna
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // User information request ke andar store karna
    req.user = decoded;

    // Next middleware/controller par jaana
    next();

  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, invalid token"
    });
  }
};

module.exports = protect;