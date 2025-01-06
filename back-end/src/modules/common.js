const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const Follow = require('../models/Follow');
const authMiddleware = require('../middlewares/authMiddleware');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

module.exports = {
  express,
  jwt,
  User,
  Post,
  Notification,
  Follow,
  authMiddleware,
  fs,
  path,
  multer,
  sharp,
};