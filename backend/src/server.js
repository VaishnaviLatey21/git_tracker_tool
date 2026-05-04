const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const groupRoutes = require("./routes/groupRoutes");
const repositoryRoutes = require("./routes/repositoryRoutes");
const masterRoutes = require("./routes/masterRoutes");
const reportRoutes = require("./routes/reportRoutes");
const adminRoutes = require("./routes/adminRoutes");



const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/repositories", repositoryRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);



app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
