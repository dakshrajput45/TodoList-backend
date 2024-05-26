const express = require("express")
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
app.use(cors());
app.use(express.json());



const PORT = process.env.PORT || PORT
const url = "mongodb+srv://dakshr050:DakshRajput.in45@cluster-todo.jnnsqyb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-todo";
const JWT_SECRET = "dbvijsdbnvosnvoisdnvonweovnweoinvwnvsdiv";

mongoose.connect(url)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });


require("./userDetails")

const User = mongoose.model("UserInfo");

app.listen(PORT, () => {
  console.log("jai shree ram");
})

app.use("/home",async(req,res)=> {
  res.send("jai Shree ram");
})

app.post("/post", async (req, res) => {
  console.log(req.body);
  if (req.body.name == "daksh") {
    res.send({ status: "yes" });
  }
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  console.log(email);
  console.log(password);
  try {
    const encryptedPassword = await bcryptjs.hash(password, 10);
    const oldUser = await User.findOne({ email });
    if (oldUser) return res.status(409).send({ error: "User Exists" });
    await User.create({
      email,
      password: encryptedPassword,
    })
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' });

    return res.status(200).send({ status: "ok", data: token });
  } catch (error) {
    return res.status(500).send({ error: "Try Again" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).send({ error: "User Not Found" });
  }

  if (await bcryptjs.compare(password, user.password)) {
    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    return res.status(200).send({ status: "ok", data: token });
  }

  return res.status(401).send({ error: "Invalid Password" });
});

app.get("/tasks", async (req, res) => {
  const { userId } = req.query;
  console.log(userId);
  try {
    const user = jwt.verify(userId, JWT_SECRET);
    const userEmail = user.email;

    User.findOne({ email: userEmail })
      .then((user) => {
        if (user) {
          // Filter out tasks with status "completed"
          const filteredTasks = user.tasks.filter(task => task.status !== "Completed");
          // Sort tasks in decending order based on the dueDate
          const sortedTasks = filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
          
          return res.status(200).send({ status: "yes", data: sortedTasks });
        } else {
          return res.status(404).send({ status: "error", message: "User not found" });
        }
      })
      .catch((error) => {
        return res.status(500).send({ status: "error", message: "Internal server error" });
      });
  } catch (error) {
    return res.status(401).send({ status: "error", message: "Unauthorized" });
  }
});


app.put("/addtask", async (req, res) => {
  const { userId, title, dueDate, status, desc } = req.body;
  console.log(dueDate);
  try {
    const user = jwt.verify(userId, JWT_SECRET);
    const userEmail = user.email;

    const newTask = {
      title, // Use title as the unique identifier (ID) for the task
      dueDate,
      status,
      desc
    };
    const existingTask = await User.findOne({ email: userEmail, "tasks.title": title });

    if (existingTask) {
      return res.status(409).json({ status: "no", message: "Please add a unique title" });
    }
    // Update the user document by pushing the new task to the tasks array
    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail },
      { $push: { tasks: newTask } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ status: "ok", updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/tasks/duedate", async (req, res) => {
  const { userId, title, newDueDate } = req.body;
  console.log(newDueDate);
  try {
    const user = jwt.verify(userId, JWT_SECRET);
    const userEmail = user.email;
    const formattedDueDate = new Date(newDueDate).toISOString();
    console.log(formattedDueDate);

    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail, "tasks.title": title },
      { $set: { "tasks.$.dueDate": newDueDate } },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User or task not found" });
    }
    res.status(200).json({ message: "Due date updated successfully", updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.put("/tasks/status",async(req,res)=>{
  const { userId, title, newStatus } = req.body;
  console.log(userId);
  console.log(newStatus);
  try {
    const user = jwt.verify(userId, JWT_SECRET);
    const userEmail = user.email;

    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail, "tasks.title": title },
      { $set: { "tasks.$.status": newStatus } },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User or task not found" });
    }
    res.status(200).json({ status: "ok", updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
})

app.delete("/removeTask", async (req, res) => {
  const { userId, title } = req.body;
  console.log(userId);
  console.log(title);
  try {
      const user = jwt.verify(userId, JWT_SECRET);
      const userEmail = user.email;

      const updatedUser = await User.findOneAndUpdate(
          { email: userEmail },
          { $pull: { tasks: { title: title } } },
          { new: true }
      );

      if (updatedUser) {
          res.status(200).send({ status: "ok", user: updatedUser });
      } else {
          res.status(404).send({ message: "User not found" });
      }
  } catch (error) {
      res.status(500).send({ message: "Error removing task", error: error.message });
  }
});


