const roleMiddleware = (requiredRole) => {
    return (req, res, next) => {
        // Check whether the user is logged in
        if (!req.user) {
            return res.status(401).json({
                message: "Please log in first."
            });
        }

        // Check whether the user has the required role
        if (req.user.role !== requiredRole) {
            return res.status(403).json({
                message: "Access forbidden. You do not have permission."
            });
        }

        next();
    };
};

module.exports = roleMiddleware;