// Concept 1: Error-handling Middleware
const errorHandler = (err, req, res, next) => {
    console.error("Server Error:", err.message);
    res.status(500).json({ 
        success: false, 
        message: "Something went wrong!",
        error: err.message 
    });
};

module.exports = errorHandler;