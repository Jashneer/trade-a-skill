// Concept 1: Application-level Middleware
const logger = (req, res, next) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${req.method} request to ${req.url}`);
    next(); // Moves the request to the next stage
};

module.exports = logger;