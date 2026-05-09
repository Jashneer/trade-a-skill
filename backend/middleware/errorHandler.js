// Concept 1: Error-handling Middleware
const errorHandler = (err, req, res, next) => {
    console.error("Server Error:", err.message);
    
    // Always return JSON, never HTML
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong!";
    
    res.status(statusCode).json({ 
        success: false, 
        message: message,
        error: process.env.NODE_ENV === 'production' ? undefined : err.message 
    });
};

// 404 handler - should also return JSON
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.path}`
    });
};

module.exports = { errorHandler, notFoundHandler };