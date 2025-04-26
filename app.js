const express = require('express')
const app = express()
const port = 3000
const path = require('path')
const userModel = require('./models/user')
const postModel = require('./models/post')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const { hash } = require('crypto')
const { log } = require('console')
const jwt = require("jsonwebtoken")
const { name } = require('ejs')
const upload = require("./config/multerconfig");
// const session = require("express-session");
// const flash = require("connect-flash")

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.get('/', (req, res) => {
  res.render("index");
})

app.get('/signin', (req, res) => {
  res.render("signin");
})

app.get('/login', (req, res) => {
  res.render("login");
})

app.get('/edit/:userid', async (req, res) => {
  let user = await userModel.findOne({ _id: req.params.userid })
  res.render("edit", { user })
})

app.post('/update/:userid', async (req, res) => {
  let { name, age, email, username } = req.body
  let user = await userModel.findOneAndUpdate({ _id: req.params.userid }, { name, age, email, username }, { new: true })
  res.redirect("/profile")
})

app.get('/chngDp', async (req, res) => {
  res.render("changeDp")
})

app.post('/chngDp', isloggedin, upload.single('dp'), async (req, res) => {
  try {
    console.log(req.file); // Debugging - Check if file is received

    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    let user = await userModel.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    user.dp = req.file.buffer; // Store image as Buffer in MongoDB
    await user.save();

    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error uploading image.");
  }
});


app.get('/profile', isloggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email })
  res.render("profile", { user })
})

app.post('/post', isloggedin, upload.single('dataFiles'), async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    // Find the user
    let user = await userModel.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Create the post with image buffer
    let { content } = req.body;
    let post = await postModel.create({
      user: user._id,
      content: content,
      dataFiles: req.file.buffer, // Store image as Buffer
    });

    // Update user's posts array
    user.posts.push(post._id);
    await user.save();

    res.redirect("/home");
  } catch (err) {
    console.error("Post creation error:", err);
    res.status(500).send("Error creating post.");
  }
});


app.get('/home', isloggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email }).populate("posts");
  let allPosts = await postModel.find().populate("user");

  res.render("home", { user, allPosts });
});

app.get('/yourPosts', isloggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email }).populate("posts")
  res.render("yourPosts", { user })
})

app.get('/like/:id', isloggedin, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user")

  if (post.likes.indexOf(req.user.userid) === -1) {
    post.likes.push(req.user.userid)
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1)
  }
  await post.save()
  res.redirect("/home")
})

app.get('/editPost/:id', isloggedin, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user")
  res.render("editPost", { post })
})

app.post('/updatePost/:id', isloggedin, upload.single('dataFiles'), async (req, res) => {
  let post = await postModel.findOneAndUpdate({ _id: req.params.id }, { content: req.body.content, dataFiles: req.file.buffer})
  res.redirect("/yourPosts")
})

app.get('/deletePost/:id', isloggedin, async (req, res) => {
  let post = await postModel.findOneAndDelete({ _id: req.params.id }).populate("user")
  res.redirect("/yourPosts")
})

app.post('/create', async (req, res) => {
  //check if already that account is present or not
  let { username, name, age, email, password } = req.body;

  let user = await userModel.findOne({ email });
  if (user) {
    res.status(500).send("User is already registered")
  }
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        username,
        name,
        age,
        email,
        password: hash
      })

      let token = jwt.sign({ email: email, userid: user._id }, "shhhh")
      res.cookie("token", token);
      res.redirect("/home")
    })
  })
})

app.post('/login', async (req, res) => {
  let { email, password } = req.body;

  let user = await userModel.findOne({ email });
  if (!user) {
    return res.status(400).send("User not found"); // added return and better status code
  }

  bcrypt.compare(password, user.password, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal server error"); // handle bcrypt errors
    }
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
      res.cookie("token", token);
      return res.redirect("/home"); // added return for clean flow
    } else {
      return res.redirect("/login");
    }
  });
});


app.get('/logout', async (req, res) => {
  res.cookie("token", "");
  res.redirect("/login")
})

function isloggedin(req, res, next) {
  if (req.cookies.token === "") {
    // res.send("You must Login") make sure to make a pop up window here
    res.redirect("/login")
  } else {
    let data = jwt.verify(req.cookies.token, "shhhh")
    req.user = data;
    next();
  }
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})