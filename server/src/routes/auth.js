const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();

// 初始化管理员账户
async function initAdminUser() {
  try {
    const adminUser = await User.findOne({ username: 'administer' });
    if (!adminUser) {
      const admin = new User({
        username: 'administer',
        password: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
        name: 'Administrator'
      });
      await admin.save();
      console.log('管理员账户初始化成功');
    }
  } catch (error) {
    console.error('初始化管理员账户失败:', error);
  }
}

// 执行初始化
initAdminUser();

// 注册路由
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, email } = req.body;

    // 验证请求体
    if (!username || !password || !email) {
      return res.status(400).json({
        code: 400,
        message: '用户名、密码和邮箱是必需的',
        data: null
      });
    }

    // 验证用户名长度
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        code: 400,
        message: '用户名长度必须在3-20个字符之间',
        data: null
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '密码长度至少需要6个字符',
        data: null
      });
    }

    // 验证邮箱格式
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        code: 400,
        message: '请输入有效的邮箱地址',
        data: null
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '用户名或邮箱已存在',
        data: null
      });
    }

    // 创建新用户
    const user = new User({
      username,
      password,
      name: name || username,
      email
    });

    await user.save();

    res.status(201).json({
      code: 200,
      message: '注册成功',
      data: null
    });
  } catch (error) {
    console.error('注册错误:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        code: 400,
        message: Object.values(error.errors).map(err => err.message).join(', '),
        data: null
      });
    }
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

// 登录路由
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
        data: null
      });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
        data: null
      });
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user._id },
      'your-jwt-secret',
      { expiresIn: '24h' }
    );

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        accessToken: token
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
});

module.exports = router;