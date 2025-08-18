"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const location_controller_1 = require("../controllers/location.controller"); // Remove .js extension
const router = express_1.default.Router();
// Route to get all states
router.get("/states", location_controller_1.getAllStates);
// Route to get LGAs for a specific state by state code
router.get("/states/:stateCode/lgas", location_controller_1.getLgasByState);
exports.default = router;
//# sourceMappingURL=location.routes.js.map