// server.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';


import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_DIR = path.join(__dirname, '../frontend'); // one level up, then frontend folder

const app = express();
const PORT = 8080;
app.use('/M01088037', express.static(FRONTEND_DIR));


// Add at the top of server.js, after `const app = express();`
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }
  next();
}


// ======= MongoDB Setup =======
const mongoUrl = 'mongodb://127.0.0.1:27017';
const dbName = 'cw2_social';
let db, usersCollection, postsCollection;

MongoClient.connect(mongoUrl)
  .then(client => {
    db = client.db(dbName);
    usersCollection = db.collection('users');
    postsCollection = db.collection('posts');
    console.log('Connected to MongoDB');
  })
  .catch(err => console.error(err));
  

// ======= Middleware =======
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});


// ======= File Upload Setup =======
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use('/M01088037/uploads', express.static(uploadDir));

// For general posts
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const allowedTypes = [
  'image/jpeg','image/png','audio/mpeg','audio/wav','application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain','video/mp4','application/vnd.ms-excel',
  'text/csv'
];

const uploadPost = multer({ 
  storage: postStorage, 
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, true)
});

// For profile pictures
const profilePicStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const uploadProfilePic = multer({ storage: profilePicStorage });


// ======= Helper =======
function isAuthenticated(req) {
  return req.session && req.session.userId;
}

// ======= Routes =======
const STUDENT_ID = 'M01088037';
const BASE_PATH = `/${STUDENT_ID}`;

// -------- Registration --------
app.post(`${BASE_PATH}/users`, uploadProfilePic.single('profilePic'), async (req, res) => {
  try {
    const {
      fullName, username, email, password, confirmPassword,
      dob, gender, country, interests, bio, skillLevel, profession, website
    } = req.body;

    if (!fullName || !username || !email || !password || !confirmPassword || !dob || !country || !profession) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const profilePic = req.file ? req.file.filename : null;

    const hashedPassword = await bcrypt.hash(password, 10); // hash password
    const newUser = {
      fullName, username, email, password: hashedPassword,
      dob, gender, profilePic, country,
      interests: interests ? JSON.parse(interests) : [],
      bio, skillLevel, profession, website,
      following: [],
      followers: []
    };

    const result = await usersCollection.insertOne(newUser);

    // auto-login set session immediately
    req.session.userId = result.insertedId.toString();
    req.session.username = username;

    res.status(201).json({ success: true, username }); // return username
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// -------- Login --------
app.post(`${BASE_PATH}/login`, async (req, res) => {
  const { email, password } = req.body;
  const user = await usersCollection.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user._id.toString();
    req.session.username = user.username;
    res.status(200).json({ success: true, username: user.username});
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// ---------- GET LOGGED-IN USER PROFILE ----------
app.get(`${BASE_PATH}/profile`, requireLogin, async (req, res) => {
  try {
    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.session.userId) },
      { projection: { password: 0 } }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load profile" });
  }
});

// ---------- UPDATE PROFILE ----------
app.put(`${BASE_PATH}/profile`, requireLogin, async (req, res) => {
  const {
    fullName, bio, country, gender, interests,
    dob, skillLevel, profession, website, password
  } = req.body;

  const updateFields = {
    fullName, bio, country, gender,
    interests, dob, skillLevel, profession, website
  };

  try {
    if(password) {
      const hashed = await bcrypt.hash(password, 10);
      updateFields.password = hashed;
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(req.session.userId) },
      { $set: updateFields }
    );

    res.json({ success: true });
  } catch(err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});


// Followers
app.get(`${BASE_PATH}/followers`, requireLogin, async (req, res) => {
  const user = await usersCollection.findOne({ _id: new ObjectId(req.session.userId) });
  if (!user || !user.followers) {
    return res.json([]);
  }

  const followers = await usersCollection.find({
    _id: { $in: user.followers.map(id => new ObjectId(id)) }
  }).toArray();

  res.json(followers || []);
});

// Following
app.get(`${BASE_PATH}/following`, requireLogin, async (req, res) => {
  const user = await usersCollection.findOne({ _id: new ObjectId(req.session.userId) });
  const following = await usersCollection.find({ _id: { $in: user.following.map(id => new ObjectId(id)) } }).toArray();
  res.json(following || []);
});


// ---------- UPLOAD PROFILE PICTURE ----------
app.post(`${BASE_PATH}/profile/picture`, requireLogin, uploadProfilePic.single("profilePic"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const filename = req.file.filename;

  try {
    await usersCollection.updateOne(
      { _id: new ObjectId(req.session.userId) },
      { $set: { profilePic: filename } }
    );

    res.json({ success: true, filename });
  } catch (err) {
    res.status(500).json({ success: false, message: "Upload failed" });
  }
});

// -------- Logout --------
app.delete(`${BASE_PATH}/login`, (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false, message: 'Logout failed' });
    res.clearCookie('connect.sid'); // important to remove session cookie
    res.status(200).json({ success: true, message: 'Logged out' });
  });
});


// -------- Login Status --------
app.get(`${BASE_PATH}/login`, (req, res) => {
  if (isAuthenticated(req)) res.json({ loggedIn: true, username: req.session.username });
  else res.status(401).json({ loggedIn: false });
});

// -------- Create Post (Multiple files, any type) --------
app.post(`${BASE_PATH}/contents`, uploadPost.array('files', 15), async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ success: false, message: 'Not logged in' });

  try {
    const text = req.body.content || ""; // text of the post
    const uploadedFiles = req.files ? req.files.map(f => f.filename) : [];

    const newPost = {
      userId: req.session.userId,
      content: text,
      files: uploadedFiles,
      createdAt: new Date(),
      likes: [],       // initialize empty array
      shares: [],      // initialize empty array
      comments: []
    };

    const result = await postsCollection.insertOne(newPost);
    res.status(201).json({ success: true, postId: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
});


// Add comment
app.post(`${BASE_PATH}/posts/:id/comment`, requireLogin, async (req, res) => {
  const { content } = req.body;
  const postId = req.params.id;

  if (!content || !content.trim()) return res.status(400).json({ success: false, message: "Empty comment" });

  const comment = {
    commentId: uuidv4(),
    username: req.session.username,
    content: content.trim(),
    createdAt: new Date()
  };

  try {
    const result = await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $push: { comments: comment } }
    );

    if (result.modifiedCount === 0) return res.status(404).json({ success: false, message: "Post not found" });

    res.json({ success: true, comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to add comment" });
  }
});

// Edit comment
app.put(`${BASE_PATH}/posts/:postId/comment/:commentId`, requireLogin, async (req, res) => {
  const { content } = req.body;
  const { postId, commentId } = req.params;

  if (!content || !content.trim()) return res.status(400).json({ success: false, message: "Empty comment" });

  try {
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const comment = post.comments.find(c => c.commentId === commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });
    if (comment.username !== req.session.username) return res.status(403).json({ success: false, message: "Not allowed" });

    await postsCollection.updateOne(
      { _id: new ObjectId(postId), "comments.commentId": commentId },
      { $set: { "comments.$.content": content.trim() } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to edit comment" });
  }
});

// Delete comment
app.delete(`${BASE_PATH}/posts/:postId/comment/:commentId`, requireLogin, async (req, res) => {
  const { postId, commentId } = req.params;

  try {
    const result = await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $pull: { comments: { commentId, username: req.session.username } } }
    );

    if (result.modifiedCount === 0) return res.status(404).json({ success: false, message: "Comment not found or not allowed" });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete comment" });
  }
});


// Like
app.post(`${BASE_PATH}/posts/:id/like`, requireLogin, async (req, res) => {
  const postId = req.params.id;
  try {
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    if (post.likes.includes(req.session.username)) 
      return res.status(400).json({ success: false, message: "Already liked" });

    await postsCollection.updateOne({ _id: new ObjectId(postId) }, { $push: { likes: req.session.username } });

    res.json({ success: true, likesCount: post.likes.length + 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to like" });
  }
});

// Unlike
app.post(`${BASE_PATH}/posts/:id/unlike`, requireLogin, async (req, res) => {
  const postId = req.params.id;
  try {
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    if (!post.likes.includes(req.session.username)) 
      return res.status(400).json({ success: false, message: "You haven't liked this post" });

    await postsCollection.updateOne({ _id: new ObjectId(postId) }, { $pull: { likes: req.session.username } });

    res.json({ success: true, likesCount: post.likes.length - 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to unlike" });
  }
});


// Share
app.post(`${BASE_PATH}/posts/:id/share`, requireLogin, async (req, res) => {
  const postId = req.params.id;
  try {
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $addToSet: { shares: req.session.username } }
    );

    res.json({ success: true, sharesCount: post.shares.includes(req.session.username) ? post.shares.length : post.shares.length + 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to share" });
  }
});

// Unshare
app.post(`${BASE_PATH}/posts/:id/unshare`, requireLogin, async (req, res) => {
  const postId = req.params.id;
  try {
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $pull: { shares: req.session.username } }
    );

    res.json({ success: true, sharesCount: post.shares.includes(req.session.username) ? post.shares.length - 1 : post.shares.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to unshare" });
  }
});


// -------- Follow User --------
app.post(`${BASE_PATH}/follow`, async (req, res) => {
  const { follower, following } = req.body; // <-- get both from frontend

  if (!follower || !following) return res.status(400).json({ success: false, message: "Missing data" });
  if (follower === following) return res.status(400).json({ success: false, message: "You cannot follow yourself" });

  const followerUser = await usersCollection.findOne({ username: follower });
  const followingUser = await usersCollection.findOne({ username: following });

  if (!followerUser || !followingUser) return res.status(404).json({ success: false, message: "User not found" });

  await usersCollection.updateOne(
    { username: follower },
    { $addToSet: { following: followingUser._id.toString() } }
  );
  await usersCollection.updateOne(
    { username: following },
    { $addToSet: { followers: followerUser._id.toString() } }
  );

  res.json({ success: true, message: `Following ${following}` });
});


/// -------- Unfollow User --------
app.delete(`${BASE_PATH}/follow`, async (req, res) => {
  const { follower, following } = req.body;

  if (!follower || !following) return res.status(400).json({ success: false, message: "Missing data" });

  const followerUser = await usersCollection.findOne({ username: follower });
  const followingUser = await usersCollection.findOne({ username: following });

  if (!followerUser || !followingUser) return res.status(404).json({ success: false, message: "User not found" });

  await usersCollection.updateOne(
    { username: follower },
    { $pull: { following: followingUser._id.toString() } }
  );
  await usersCollection.updateOne(
    { username: following },
    { $pull: { followers: followerUser._id.toString() } }
  );

  res.json({ success: true, message: `Unfollowed ${following}` });
});



// -------- Feed --------
app.get(`${BASE_PATH}/feed`, async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ success: false, message: 'Not logged in' });
  const currentUser = await usersCollection.findOne({ _id: new ObjectId(req.session.userId) });
  const followingIds = (currentUser.following || []).map(id => new ObjectId(id));

  followingIds.push(req.session.userId); // include own posts
  const feedPosts = await postsCollection
    .find({ userId: { $in: followingIds.map(id => id.toString()) } })
    .sort({ createdAt: -1 })
    .toArray();
  const enrichedFeed = await Promise.all(feedPosts.map(async post => {
  const user = await usersCollection.findOne({ _id: new ObjectId(post.userId) });
  return {
    ...post,
    username: user ? user.username : 'Deleted User',
    fullName: user ? user.fullName : 'Deleted User',
    profilePic: user ? user.profilePic : null,
    files: post.files || [],
    likesCount: post.likes?.length || 0,
    sharesCount: post.shares?.length || 0,
    commentsCount: post.comments?.length || 0,
    likedByMe: post.likes?.includes(currentUser.username) || false,
    sharedByMe: post.shares?.includes(currentUser.username) || false

  };
}));

  res.status(200).json(enrichedFeed);
});

// ---------- My Posts / Edit / Delete (Add to server.js) ----------
/**
 * GET /my-posts
 * Returns only posts created by logged-in user, enriched (same shape as /feed)
 */
app.get(`${BASE_PATH}/my-posts`, requireLogin, async (req, res) => {
  try {
    const userIdStr = req.session.userId;
    const posts = await postsCollection
      .find({ userId: userIdStr })
      .sort({ createdAt: -1 })
      .toArray();

    // enrich with user info (username, fullName, profilePic) and counts & flags
    const user = await usersCollection.findOne({ _id: new ObjectId(userIdStr) });
    const enriched = posts.map(post => ({
      ...post,
      username: user ? user.username : 'Deleted User',
      fullName: user ? user.fullName : 'Deleted User',
      profilePic: user ? user.profilePic : null,
      files: post.files || [],
      likesCount: post.likes?.length || 0,
      sharesCount: post.shares?.length || 0,
      commentsCount: post.comments?.length || 0,
      likedByMe: post.likes?.includes(user.username) || false,
      sharedByMe: post.shares?.includes(user.username) || false
    }));

    res.status(200).json(enriched);
  } catch (err) {
    console.error('GET /my-posts error', err);
    res.status(500).json({ success: false, message: 'Failed to load your posts' });
  }
});

/**
 * PATCH /posts/:id
 * Edit a post's content (owner-only). We keep it simple: update only `content`.
 * If you later want to support files we can expand safely.
 */
app.patch(`${BASE_PATH}/posts/:id`, requireLogin, async (req, res) => {
  const postId = req.params.id;
  const { content } = req.body;

  if (typeof content !== 'string') {
    return res.status(400).json({ success: false, message: 'Content required' });
  }

  try {
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.userId !== req.session.userId) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    const result = await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $set: { content: content.trim() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ success: false, message: 'Update failed' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('PATCH /posts/:id error', err);
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
});

/**
 * DELETE /posts/:id
 * Delete a post (owner-only). Also returns success boolean.
 */
// ---------- DELETE /posts/:id (bulletproof version) ----------
app.delete(`${BASE_PATH}/posts/:id`, requireLogin, async (req, res) => {
  const postId = req.params.id;

  // Validate postId
  if (!ObjectId.isValid(postId)) {
    return res.status(400).json({ success: false, message: 'Invalid post ID' });
  }

  try {
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    // Ensure owner only
    if (post.userId.toString() !== req.session.userId) {
      return res.status(403).json({ success: false, message: 'Not allowed to delete this post' });
    }

    // Delete post
    const result = await postsCollection.deleteOne({ _id: new ObjectId(postId) });
    if (result.deletedCount === 0) {
      return res.status(500).json({ success: false, message: 'Delete failed' });
    }

    // Successful delete
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    console.error('DELETE /posts/:id error', err);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
});

// -------- Search Users --------
app.get(`${BASE_PATH}/users`, async (req, res) => {
  const q = req.query.q || '';
  const results = await usersCollection.find({
    $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } }
    ]
   }).toArray();
  res.status(200).json(results.map(u => ({ username: u.username, fullName: u.fullName, profilePic: u.profilePic })));
});

// -------- Search Posts --------
app.get(`${BASE_PATH}/contents`, async (req, res) => {
  const q = req.query.q || '';
  const results = await postsCollection.find({ content: { $regex: q, $options: 'i' } }).toArray();
  res.status(200).json(results);
});

// ----- Multer & general error handler -----
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Invalid file type') {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

// ======= Serve Uploaded Files =======

app.use(express.static(FRONTEND_DIR));

// serve frontend folder and index at /M01088037

app.get(new RegExp(`^/${STUDENT_ID}(/.*)?$`), (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// ======= Start Server =======
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}${BASE_PATH}`));
