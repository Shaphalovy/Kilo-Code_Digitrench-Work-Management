require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/digitrench';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// ==================== MODELS ====================

// User Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'management', 'employee'], default: 'employee' },
  department: { type: String, required: true },
  avatar: String,
  position: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

const User = mongoose.model('User', userSchema);

// Department Model
const departmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  color: { type: String, required: true }
});

const Department = mongoose.model('Department', departmentSchema);

// Project Model
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  department: { type: String, required: true },
  createdBy: { type: String, required: true },
  members: [{ type: String }],
  status: { type: String, enum: ['active', 'completed', 'archived', 'on_hold'], default: 'active' },
  startDate: Date,
  endDate: Date,
  color: { type: String, default: '#6366f1' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', projectSchema);

// Comment Model
const commentSchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  userId: { type: String, required: true },
  content: { type: String, required: true },
  mentions: [{ type: String }],
  attachments: [{
    id: String,
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: String,
    uploadedAt: Date
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Comment = mongoose.model('Comment', commentSchema);

// TimeEntry Model
const timeEntrySchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  userId: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: Date,
  duration: Number,
  notes: String,
  date: { type: String, required: true }
});

const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);

// Task Model
const subtaskSchema = new mongoose.Schema({
  id: String,
  title: String,
  completed: { type: Boolean, default: false },
  assigneeId: String,
  dueDate: Date
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  projectId: { type: String, required: true },
  assigneeId: { type: String, required: true },
  createdBy: { type: String, required: true },
  status: { type: String, enum: ['todo', 'in_progress', 'review', 'done', 'blocked'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  dueDate: Date,
  startDate: Date,
  completedAt: Date,
  tags: [{ type: String }],
  attachments: [{
    id: String,
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: String,
    uploadedAt: Date
  }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  subtasks: [subtaskSchema],
  timeEntries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TimeEntry' }],
  estimatedHours: Number,
  actualHours: Number,
  dependencies: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

// Notification Model
const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['task_assigned', 'task_updated', 'comment_mention', 'deadline_reminder', 'status_change', 'review_request'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  taskId: String,
  projectId: String,
  fromUserId: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// ==================== API ROUTES ====================

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, role, department, position } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'employee',
      department,
      position,
      isActive: true,
      createdAt: new Date()
    });
    
    await user.save();
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, role, department, position, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department, position, isActive },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Delete related data
    await Task.deleteMany({ assigneeId: req.params.id });
    await Comment.deleteMany({ userId: req.params.id });
    await TimeEntry.deleteMany({ userId: req.params.id });
    await Notification.deleteMany({ userId: req.params.id });
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/:id/activate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/:id/deactivate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Department Routes
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    const department = new Department(req.body);
    await department.save();
    res.status(201).json(department);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/departments/:id', async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json(department);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/departments/:id', async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Project Routes
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const project = new Project({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    // Delete related tasks
    await Task.deleteMany({ projectId: req.params.id });
    
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Task Routes
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('comments')
      .populate('timeEntries');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('comments')
      .populate('timeEntries');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    // Delete related comments and time entries
    await Comment.deleteMany({ taskId: req.params.id });
    await TimeEntry.deleteMany({ taskId: req.params.id });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comment Routes
app.get('/api/tasks/:taskId/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ taskId: req.params.taskId });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const comment = new Comment({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await comment.save();
    
    // Add comment to task
    await Task.findByIdAndUpdate(req.body.taskId, {
      $push: { comments: comment._id }
    });
    
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Time Entry Routes
app.get('/api/time-entries', async (req, res) => {
  try {
    const { userId, taskId } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (taskId) filter.taskId = taskId;
    
    const timeEntries = await TimeEntry.find(filter);
    res.json(timeEntries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/time-entries', async (req, res) => {
  try {
    const timeEntry = new TimeEntry(req.body);
    await timeEntry.save();
    
    // Add time entry to task
    await Task.findByIdAndUpdate(req.body.taskId, {
      $push: { timeEntries: timeEntry._id }
    });
    
    res.status(201).json(timeEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/time-entries/:id', async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!timeEntry) return res.status(404).json({ error: 'Time entry not found' });
    res.json(timeEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/time-entries/:id', async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findByIdAndDelete(req.params.id);
    if (!timeEntry) return res.status(404).json({ error: 'Time entry not found' });
    res.json({ message: 'Time entry deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notification Routes
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed initial data
app.post('/api/seed', async (req, res) => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Department.deleteMany({});
    await Comment.deleteMany({});
    await TimeEntry.deleteMany({});
    await Notification.deleteMany({});
    
    // Seed departments
    const departments = [
      { id: 'hr', name: 'HR', color: '#ec4899' },
      { id: 'operations', name: 'Operations', color: '#10b981' },
      { id: 'call_center', name: 'Call Center', color: '#f59e0b' },
      { id: 'finance', name: 'Finance', color: '#3b82f6' },
      { id: 'it', name: 'IT', color: '#8b5cf6' },
      { id: 'management', name: 'Management', color: '#6366f1' }
    ];
    await Department.insertMany(departments);
    
    // Seed users with hashed passwords
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedMgmtPassword = await bcrypt.hash('mgmt123', 10);
    const hashedEmpPassword = await bcrypt.hash('emp123', 10);
    
    const users = [
      {
        name: 'System Admin',
        email: 'admin@digitrench.com',
        password: hashedAdminPassword,
        role: 'admin',
        department: 'management',
        position: 'System Administrator',
        isActive: true,
        createdAt: new Date('2024-01-01')
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@digitrench.com',
        password: hashedMgmtPassword,
        role: 'management',
        department: 'management',
        position: 'Operations Manager',
        isActive: true,
        createdAt: new Date('2024-01-15')
      },
      {
        name: 'Michael Chen',
        email: 'michael.chen@digitrench.com',
        password: await bcrypt.hash('mgmt456', 10),
        role: 'management',
        department: 'hr',
        position: 'HR Manager',
        isActive: true,
        createdAt: new Date('2024-01-20')
      },
      {
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@digitrench.com',
        password: hashedEmpPassword,
        role: 'employee',
        department: 'hr',
        position: 'HR Specialist',
        isActive: true,
        createdAt: new Date('2024-02-01')
      },
      {
        name: 'James Wilson',
        email: 'james.wilson@digitrench.com',
        password: await bcrypt.hash('emp456', 10),
        role: 'employee',
        department: 'call_center',
        position: 'Call Center Agent',
        isActive: true,
        createdAt: new Date('2024-02-10')
      },
      {
        name: 'Aisha Patel',
        email: 'aisha.patel@digitrench.com',
        password: await bcrypt.hash('emp789', 10),
        role: 'employee',
        department: 'operations',
        position: 'Operations Analyst',
        isActive: true,
        createdAt: new Date('2024-03-01')
      },
      {
        name: 'David Kim',
        email: 'david.kim@digitrench.com',
        password: await bcrypt.hash('emp321', 10),
        role: 'employee',
        department: 'finance',
        position: 'Finance Analyst',
        isActive: true,
        createdAt: new Date('2024-03-15')
      },
      {
        name: 'Lisa Thompson',
        email: 'lisa.thompson@digitrench.com',
        password: await bcrypt.hash('emp654', 10),
        role: 'employee',
        department: 'call_center',
        position: 'Senior Agent',
        isActive: true,
        createdAt: new Date('2024-04-01')
      }
    ];
    
    const createdUsers = await User.insertMany(users);
    const userMap = {};
    createdUsers.forEach(u => { userMap[u.email] = u._id.toString(); });
    
    // Seed projects
    const projects = [
      {
        name: 'Q1 HR Compliance Review',
        description: 'Quarterly HR compliance audit and documentation update for all departments',
        department: 'hr',
        createdBy: userMap['michael.chen@digitrench.com'],
        members: [userMap['emily.rodriguez@digitrench.com'], userMap['david.kim@digitrench.com'], userMap['michael.chen@digitrench.com']],
        status: 'active',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-31'),
        color: '#6366f1',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-02-20')
      },
      {
        name: 'Call Center Performance Optimization',
        description: 'Improve call center KPIs and agent performance metrics for Q1',
        department: 'call_center',
        createdBy: userMap['sarah.johnson@digitrench.com'],
        members: [userMap['james.wilson@digitrench.com'], userMap['lisa.thompson@digitrench.com'], userMap['sarah.johnson@digitrench.com']],
        status: 'active',
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-04-15'),
        color: '#f59e0b',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-02-18')
      },
      {
        name: 'Operations Process Streamlining',
        description: 'Document and optimize back-office operational workflows',
        department: 'operations',
        createdBy: userMap['sarah.johnson@digitrench.com'],
        members: [userMap['aisha.patel@digitrench.com'], userMap['sarah.johnson@digitrench.com']],
        status: 'active',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-05-01'),
        color: '#10b981',
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-22')
      },
      {
        name: 'Employee Onboarding System',
        description: 'Create standardized onboarding process for new hires',
        department: 'hr',
        createdBy: userMap['michael.chen@digitrench.com'],
        members: [userMap['emily.rodriguez@digitrench.com'], userMap['michael.chen@digitrench.com']],
        status: 'active',
        startDate: new Date('2026-02-10'),
        endDate: new Date('2026-04-10'),
        color: '#ec4899',
        createdAt: new Date('2026-02-10'),
        updatedAt: new Date('2026-02-21')
      },
      {
        name: 'Finance Reporting Automation',
        description: 'Automate monthly financial reports and dashboards',
        department: 'finance',
        createdBy: userMap['sarah.johnson@digitrench.com'],
        members: [userMap['david.kim@digitrench.com'], userMap['sarah.johnson@digitrench.com']],
        status: 'on_hold',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-06-01'),
        color: '#3b82f6',
        createdAt: new Date('2026-02-15'),
        updatedAt: new Date('2026-02-15')
      }
    ];
    
    const createdProjects = await Project.insertMany(projects);
    const projectMap = {};
    createdProjects.forEach(p => { projectMap[p.name] = p._id.toString(); });
    
    // Seed tasks
    const tasks = [
      {
        title: 'Update Employee Handbook 2026',
        description: 'Review and update the employee handbook with new policies, benefits information, and compliance requirements for 2026.',
        projectId: projectMap['Q1 HR Compliance Review'],
        assigneeId: userMap['emily.rodriguez@digitrench.com'],
        createdBy: userMap['michael.chen@digitrench.com'],
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2026-02-28'),
        startDate: new Date('2026-02-10'),
        tags: ['documentation', 'compliance', 'hr'],
        attachments: [],
        subtasks: [
          { id: 'sub-1', title: 'Review current handbook', completed: true },
          { id: 'sub-2', title: 'Draft new remote work policy', completed: true },
          { id: 'sub-3', title: 'Update benefits section', completed: false },
          { id: 'sub-4', title: 'Legal review', completed: false }
        ],
        estimatedHours: 16,
        actualHours: 3,
        createdAt: new Date('2026-02-10'),
        updatedAt: new Date('2026-02-20')
      },
      {
        title: 'Conduct Q1 Performance Reviews',
        description: 'Schedule and conduct performance review meetings with all HR department employees for Q1 2026.',
        projectId: projectMap['Q1 HR Compliance Review'],
        assigneeId: userMap['emily.rodriguez@digitrench.com'],
        createdBy: userMap['michael.chen@digitrench.com'],
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2026-03-15'),
        tags: ['performance', 'hr', 'reviews'],
        attachments: [],
        subtasks: [
          { id: 'sub-5', title: 'Prepare review templates', completed: false },
          { id: 'sub-6', title: 'Schedule meetings', completed: false },
          { id: 'sub-7', title: 'Conduct reviews', completed: false },
          { id: 'sub-8', title: 'Document outcomes', completed: false }
        ],
        estimatedHours: 24,
        actualHours: 0,
        createdAt: new Date('2026-02-12'),
        updatedAt: new Date('2026-02-12')
      },
      {
        title: 'Improve Average Handle Time (AHT)',
        description: 'Analyze current call patterns and implement strategies to reduce average handle time by 15% while maintaining quality scores.',
        projectId: projectMap['Call Center Performance Optimization'],
        assigneeId: userMap['james.wilson@digitrench.com'],
        createdBy: userMap['sarah.johnson@digitrench.com'],
        status: 'in_progress',
        priority: 'urgent',
        dueDate: new Date('2026-02-25'),
        startDate: new Date('2026-02-01'),
        tags: ['kpi', 'call-center', 'performance'],
        attachments: [],
        subtasks: [
          { id: 'sub-9', title: 'Analyze call recordings', completed: true },
          { id: 'sub-10', title: 'Identify bottlenecks', completed: true },
          { id: 'sub-11', title: 'Implement new call scripts', completed: false },
          { id: 'sub-12', title: 'Measure improvement', completed: false }
        ],
        estimatedHours: 40,
        actualHours: 8,
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-20')
      },
      {
        title: 'Customer Satisfaction Survey Analysis',
        description: 'Compile and analyze Q4 2025 customer satisfaction survey results and prepare presentation for management.',
        projectId: projectMap['Call Center Performance Optimization'],
        assigneeId: userMap['lisa.thompson@digitrench.com'],
        createdBy: userMap['sarah.johnson@digitrench.com'],
        status: 'review',
        priority: 'high',
        dueDate: new Date('2026-02-23'),
        startDate: new Date('2026-02-15'),
        tags: ['analysis', 'customer-satisfaction', 'reporting'],
        attachments: [{
          id: 'att-1',
          name: 'CSAT_Analysis_Draft.pdf',
          url: '/attachments/csat-analysis.pdf',
          type: 'application/pdf',
          size: 2048000,
          uploadedBy: userMap['lisa.thompson@digitrench.com'],
          uploadedAt: new Date('2026-02-21')
        }],
        subtasks: [
          { id: 'sub-13', title: 'Collect survey data', completed: true },
          { id: 'sub-14', title: 'Data analysis', completed: true },
          { id: 'sub-15', title: 'Create presentation', completed: true },
          { id: 'sub-16', title: 'Management review', completed: false }
        ],
        estimatedHours: 20,
        actualHours: 13,
        createdAt: new Date('2026-02-15'),
        updatedAt: new Date('2026-02-21')
      },
      {
        title: 'Document Back-Office Workflows',
        description: 'Create comprehensive documentation for all back-office operational processes including data entry, quality checks, and escalation procedures.',
        projectId: projectMap['Operations Process Streamlining'],
        assigneeId: userMap['aisha.patel@digitrench.com'],
        createdBy: userMap['sarah.johnson@digitrench.com'],
        status: 'in_progress',
        priority: 'medium',
        dueDate: new Date('2026-03-10'),
        startDate: new Date('2026-02-05'),
        tags: ['documentation', 'operations', 'process'],
        attachments: [],
        subtasks: [
          { id: 'sub-17', title: 'Map current workflows', completed: true },
          { id: 'sub-18', title: 'Interview team leads', completed: true },
          { id: 'sub-19', title: 'Draft documentation', completed: false },
          { id: 'sub-20', title: 'Review and finalize', completed: false }
        ],
        estimatedHours: 32,
        actualHours: 7,
        createdAt: new Date('2026-02-05'),
        updatedAt: new Date('2026-02-18')
      },
      {
        title: 'Create Onboarding Checklist',
        description: 'Develop a comprehensive onboarding checklist for new employees covering IT setup, HR documentation, training schedule, and department orientation.',
        projectId: projectMap['Employee Onboarding System'],
        assigneeId: userMap['emily.rodriguez@digitrench.com'],
        createdBy: userMap['michael.chen@digitrench.com'],
        status: 'done',
        priority: 'high',
        dueDate: new Date('2026-02-20'),
        startDate: new Date('2026-02-10'),
        completedAt: new Date('2026-02-19'),
        tags: ['onboarding', 'hr', 'documentation'],
        attachments: [{
          id: 'att-2',
          name: 'Onboarding_Checklist_v1.docx',
          url: '/attachments/onboarding-checklist.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 512000,
          uploadedBy: userMap['emily.rodriguez@digitrench.com'],
          uploadedAt: new Date('2026-02-19')
        }],
        subtasks: [
          { id: 'sub-21', title: 'IT setup checklist', completed: true },
          { id: 'sub-22', title: 'HR documentation list', completed: true },
          { id: 'sub-23', title: 'Training schedule template', completed: true },
          { id: 'sub-24', title: 'Department orientation guide', completed: true }
        ],
        estimatedHours: 16,
        actualHours: 14,
        createdAt: new Date('2026-02-10'),
        updatedAt: new Date('2026-02-19')
      },
      {
        title: 'Monthly Financial Report - January 2026',
        description: 'Compile and prepare the monthly financial report for January 2026 including revenue, expenses, and variance analysis.',
        projectId: projectMap['Finance Reporting Automation'],
        assigneeId: userMap['david.kim@digitrench.com'],
        createdBy: userMap['sarah.johnson@digitrench.com'],
        status: 'blocked',
        priority: 'urgent',
        dueDate: new Date('2026-02-15'),
        startDate: new Date('2026-02-01'),
        tags: ['finance', 'reporting', 'monthly'],
        attachments: [],
        subtasks: [],
        estimatedHours: 20,
        actualHours: 0,
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-01')
      },
      {
        title: 'Call Center Training Program',
        description: 'Develop and implement a new training program for call center agents focusing on communication skills and product knowledge.',
        projectId: projectMap['Call Center Performance Optimization'],
        assigneeId: userMap['lisa.thompson@digitrench.com'],
        createdBy: userMap['sarah.johnson@digitrench.com'],
        status: 'todo',
        priority: 'high',
        dueDate: new Date('2026-03-01'),
        tags: ['training', 'call-center', 'development'],
        attachments: [],
        subtasks: [
          { id: 'sub-25', title: 'Assess training needs', completed: false },
          { id: 'sub-26', title: 'Create training materials', completed: false },
          { id: 'sub-27', title: 'Schedule training sessions', completed: false },
          { id: 'sub-28', title: 'Evaluate effectiveness', completed: false }
        ],
        estimatedHours: 30,
        actualHours: 0,
        createdAt: new Date('2026-02-18'),
        updatedAt: new Date('2026-02-18')
      }
    ];
    
    await Task.insertMany(tasks);
    
    res.json({ message: 'Database seeded successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API endpoints available at http://localhost:${PORT}/api`);
});
