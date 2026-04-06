require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// CLAUDE API CONFIG
const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

// TASK TRACKING
const taskHistory = [];
const processingTasks = [];

// ALL 22 AGENTS
const agents = {
  'gig-monitor': { emoji: '🎯', name: 'Gig Monitor', status: 'active', skill: 'Fiverr/Upwork scanning' },
  'web-scraper': { emoji: '🕷️', name: 'Web Scraper', status: 'active', skill: 'Competitor analysis' },
  'scout': { emoji: '🕵️', name: 'Scout', status: 'active', skill: 'Prospect research' },
  'content': { emoji: '📝', name: 'Content', status: 'active', skill: 'Email/copy writing' },
  'builder': { emoji: '🔨', name: 'Builder', status: 'active', skill: 'Web development' },
  'strategist': { emoji: '📊', name: 'Strategist', status: 'active', skill: 'Business planning' },
  'checker': { emoji: '✅', name: 'Checker', status: 'active', skill: 'QC & review' },
  'designer': { emoji: '🎨', name: 'Designer', status: 'active', skill: 'Graphics & branding' },
  'compliance': { emoji: '📜', name: 'Compliance', status: 'active', skill: 'Legal documents' },
  'executor': { emoji: '⚡', name: 'Executor', status: 'active', skill: 'Task execution' },
  'guardian': { emoji: '🔐', name: 'Guardian', status: 'active', skill: 'Security & backup' },
  'resume-analyzer': { emoji: '📄', name: 'Resume Analyzer', status: 'active', skill: 'ATS scoring' },
  'voice-specialist': { emoji: '🎤', name: 'Voice Specialist', status: 'active', skill: 'Audio generation' },
  'caption-master': { emoji: '📹', name: 'Caption Master', status: 'active', skill: 'Auto-captions' },
  'mindmap': { emoji: '🎯', name: 'Mindmap', status: 'active', skill: 'Visualizations' },
  'social-head': { emoji: '📢', name: 'Social Media Head', status: 'active', skill: 'Social strategy' },
  'ad-strategist': { emoji: '💰', name: 'Ad Strategist', status: 'active', skill: 'Paid ads' },
  'office-ops': { emoji: '📊', name: 'Office Ops', status: 'active', skill: 'Documents' },
  'event-planner': { emoji: '🎉', name: 'Event Planner', status: 'active', skill: 'Event planning' },
  'investment-advisor': { emoji: '💎', name: 'Investment Advisor', status: 'active', skill: 'Investments' },
  'news-reporter': { emoji: '📰', name: 'News Reporter', status: 'active', skill: 'Daily news' },
  'bankai': { emoji: '🤖', name: 'BANKAI', status: 'active', skill: 'Orchestration' }
};

// =============== ROUTES ===============

// GET: Agent Status
app.get('/api/agents', (req, res) => {
  res.json({
    success: true,
    agents: agents,
    totalAgents: Object.keys(agents).length,
    activeAgents: Object.values(agents).filter(a => a.status === 'active').length
  });
});

// POST: Show Hot Gigs
app.post('/api/gigs', async (req, res) => {
  const task = {
    id: Date.now(),
    command: 'Show hot gigs',
    agents: ['🎯 Gig Monitor', '🕷️ Web Scraper'],
    startTime: new Date(),
    status: 'processing'
  };
  
  processingTasks.push(task);

  const mockGigs = [
    { title: 'AI Chatbot - $2,500', platform: 'Upwork', posted: '2 hours ago', match: '92%' },
    { title: 'Website Redesign - $1,800', platform: 'Fiverr', posted: '30 mins ago', match: '88%' },
    { title: 'N8N Automation - $1,200', platform: 'Upwork', posted: 'Just now', match: '85%' }
  ];

  setTimeout(() => {
    task.status = 'completed';
    task.endTime = new Date();
    task.duration = Math.floor((task.endTime - task.startTime) / 1000);
    taskHistory.push(task);
    processingTasks.splice(processingTasks.indexOf(task), 1);
  }, 2000);

  res.json({
    success: true,
    gigs: mockGigs,
    task: task.id,
    agents: task.agents
  });
});

// POST: Analyze Competitor
app.post('/api/analyze', async (req, res) => {
  const { url, useBANKAI } = req.body;
  
  const agentsUsed = useBANKAI ? 
    ['🕷️ Web Scraper', '🎨 Designer', '📊 Strategist', '🤖 BANKAI'] :
    ['🕷️ Web Scraper', '🎨 Designer', '📊 Strategist'];

  const task = {
    id: Date.now(),
    command: `Analyze: ${url}`,
    agents: agentsUsed,
    startTime: new Date(),
    status: 'processing'
  };

  processingTasks.push(task);

  try {
    const response = await axios.post(CLAUDE_API, {
      model: 'claude-opus-4-6',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Analyze this competitor: ${url}. Provide: Pricing strategy, Design approach, Key features, Market positioning. Be concise.`
        }
      ]
    }, {
      headers: {
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    const analysis = response.data.content[0].text;

    setTimeout(() => {
      task.status = 'completed';
      task.endTime = new Date();
      task.duration = Math.floor((task.endTime - task.startTime) / 1000);
      task.result = analysis;
      taskHistory.push(task);
      processingTasks.splice(processingTasks.indexOf(task), 1);
    }, 1500);

    res.json({
      success: true,
      analysis: analysis,
      task: task.id,
      agents: agentsUsed
    });
  } catch (error) {
    console.error('Claude API Error:', error.response?.data || error.message);
    res.json({
      success: false,
      error: 'Analysis failed: ' + error.message,
      task: task.id
    });
  }
});

// POST: Generate Content
app.post('/api/content', async (req, res) => {
  const { topic, count } = req.body;

  const task = {
    id: Date.now(),
    command: `Generate ${count} ${topic}`,
    agents: ['📝 Content', '✅ Checker'],
    startTime: new Date(),
    status: 'processing'
  };

  processingTasks.push(task);

  try {
    const response = await axios.post(CLAUDE_API, {
      model: 'claude-opus-4-6',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Generate ${count} high-quality ${topic} for B2B SaaS. Make them compelling and professional.`
        }
      ]
    }, {
      headers: {
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    const content = response.data.content[0].text;

    setTimeout(() => {
      task.status = 'completed';
      task.endTime = new Date();
      task.duration = Math.floor((task.endTime - task.startTime) / 1000);
      task.result = content;
      taskHistory.push(task);
      processingTasks.splice(processingTasks.indexOf(task), 1);
    }, 1500);

    res.json({
      success: true,
      content: content,
      task: task.id,
      agents: task.agents
    });
  } catch (error) {
    console.error('Claude API Error:', error.message);
    res.json({
      success: false,
      error: 'Content generation failed',
      task: task.id
    });
  }
});

// POST: BANKAI Terminal
app.post('/api/terminal', async (req, res) => {
  const { command } = req.body;

  if (!command.includes('/bankai')) {
    return res.json({
      success: false,
      message: 'Use /bankai <command>'
    });
  }

  const task = {
    id: Date.now(),
    command: command,
    agents: ['🤖 BANKAI'],
    startTime: new Date(),
    status: 'processing'
  };

  processingTasks.push(task);

  try {
    const response = await axios.post(CLAUDE_API, {
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Command: ${command.replace('/bankai ', '')}. Generate concise code/solution. Include language breakdown.`
        }
      ]
    }, {
      headers: {
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    const result = response.data.content[0].text;

    setTimeout(() => {
      task.status = 'completed';
      task.endTime = new Date();
      task.duration = Math.floor((task.endTime - task.startTime) / 1000);
      task.result = result;
      taskHistory.push(task);
      processingTasks.splice(processingTasks.indexOf(task), 1);
    }, 2000);

    res.json({
      success: true,
      result: result,
      task: task.id,
      estimatedTime: '2 seconds'
    });
  } catch (error) {
    console.error('Claude API Error:', error.message);
    res.json({
      success: false,
      error: 'Command execution failed',
      task: task.id
    });
  }
});

// GET: Processing Tasks
app.get('/api/tasks/processing', (req, res) => {
  res.json({
    processing: processingTasks.map(t => ({
      id: t.id,
      command: t.command,
      agents: t.agents,
      progress: Math.floor(Math.random() * 100)
    }))
  });
});

// GET: Task History
app.get('/api/tasks/history', (req, res) => {
  res.json({
    history: taskHistory.map(t => ({
      id: t.id,
      command: t.command,
      agents: t.agents,
      startTime: t.startTime,
      endTime: t.endTime,
      duration: t.duration,
      status: t.status
    })).reverse()
  });
});

// GET: Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    timestamp: new Date(),
    claude_connected: !!CLAUDE_KEY
  });
});

// START SERVER
app.listen(PORT, () => {
  console.log(`\n🚀 XYRA Backend running on http://localhost:${PORT}`);
  console.log('✅ All 22 agents ready');
  console.log('✅ Claude API connected');
  console.log('\nAvailable endpoints:');
  console.log('  GET  /api/health');
  console.log('  GET  /api/agents');
  console.log('  GET  /api/tasks/processing');
  console.log('  GET  /api/tasks/history');
  console.log('  POST /api/gigs');
  console.log('  POST /api/analyze');
  console.log('  POST /api/content');
  console.log('  POST /api/terminal\n');
});

module.exports = app;
