
import express from "express";

const router = express.Router();

router.route("/").get((req, res) => {
    res.json({ message: "Hello from Movies route" });
});

export default router;
