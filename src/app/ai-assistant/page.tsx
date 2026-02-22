'use client';

import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAppStore } from '@/lib/store';
import {
  getAtRiskTasks, getOverdueTasks, calculateCompletionRate,
  getDepartmentLabel, formatDate, getPriorityLabel, getStatusLabel,
  generateId, cn
} from '@/lib/utils';
import { Bot, Send, Sparkles, AlertTriangle, TrendingUp, Lightbulb, Zap, User } from 'lucide-react';
import { Task } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

const quickPrompts = [
  'Which tasks are at risk of missing deadline?',
  'Show me a summary of team performance',
  'What are the most overdue tasks?',
  'Which department needs the most attention?',
  'Create task: Prepare Q1 HR report, due next Friday, high priority',
  'Who has the most workload right now?',
];

export default function AIAssistantPage() {
  const { currentUser, tasks, projects, users, addTask, addNotification } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your AI assistant for Digitrench CRM. I can help you with:

• **Task risk analysis** - Identify tasks at risk of missing deadlines
• **Performance insights** - Analyze team and department productivity  
• **Smart summaries** - Get quick overviews of project status
• **Natural language task creation** - Create tasks by describing them
• **Workload analysis** - See who's overloaded or underutilized

What would you like to know?`,
      timestamp: new Date().toISOString(),
      suggestions: quickPrompts.slice(0, 3),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentUser) return null;

  const generateAIResponse = (userMessage: string): { content: string; suggestions?: string[] } => {
    const msg = userMessage.toLowerCase();

    // Task creation via natural language
    if (msg.includes('create task') || msg.includes('add task') || msg.includes('new task')) {
      const titleMatch = userMessage.match(/(?:create|add|new) task[:\s]+([^,]+)/i);
      const dueDateMatch = userMessage.match(/due\s+(?:next\s+)?(\w+)/i);
      const priorityMatch = userMessage.match(/(urgent|high|medium|low)\s+priority/i);

      if (titleMatch) {
        const title = titleMatch[1].trim();
        const priority = (priorityMatch?.[1]?.toLowerCase() || 'medium') as 'urgent' | 'high' | 'medium' | 'low';

        // Calculate due date
        let dueDate = new Date();
        if (dueDateMatch) {
          const dayStr = dueDateMatch[1].toLowerCase();
          const days = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
          if (dayStr === 'friday' || dayStr === 'next friday') {
            const today = dueDate.getDay();
            const daysUntilFriday = (5 - today + 7) % 7 || 7;
            dueDate.setDate(dueDate.getDate() + daysUntilFriday);
          } else if (dayStr === 'tomorrow') {
            dueDate.setDate(dueDate.getDate() + 1);
          } else if (dayStr === 'week' || dayStr === 'next week') {
            dueDate.setDate(dueDate.getDate() + 7);
          }
        }

        // Find appropriate project
        const myProjects = currentUser.role === 'employee'
          ? projects.filter(p => p.members.includes(currentUser.id))
          : projects.filter(p => p.status === 'active');

        const projectId = myProjects[0]?.id;

        if (projectId && currentUser.role !== 'employee') {
          const newTask: Task = {
            id: generateId('task'),
            title,
            description: `Created via AI assistant: "${userMessage}"`,
            projectId,
            assigneeId: currentUser.id,
            createdBy: currentUser.id,
            status: 'todo',
            priority,
            dueDate: dueDate.toISOString(),
            tags: ['ai-created'],
            attachments: [],
            comments: [],
            subtasks: [],
            timeEntries: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          addTask(newTask);

          return {
            content: `✅ **Task Created Successfully!**

**Title:** ${title}
**Priority:** ${getPriorityLabel(priority)}
**Due Date:** ${formatDate(dueDate.toISOString())}
**Project:** ${myProjects[0]?.name}
**Status:** To Do

The task has been added to the board. Would you like to assign it to a specific team member or add more details?`,
            suggestions: ['Assign this task to someone', 'Add subtasks to this task', 'View the board'],
          };
        } else {
          return {
            content: `I've parsed your task request:

**Title:** ${title}
**Priority:** ${getPriorityLabel(priority)}
**Due Date:** ${formatDate(dueDate.toISOString())}

To create this task, please use the "Add Task" button on the relevant project board and fill in the details. As an employee, tasks need to be assigned by management.`,
          };
        }
      }
    }

    // Risk analysis
    if (msg.includes('risk') || msg.includes('deadline') || msg.includes('at risk')) {
      const relevantTasks = currentUser.role === 'employee'
        ? tasks.filter(t => t.assigneeId === currentUser.id)
        : tasks;
      const atRisk = getAtRiskTasks(relevantTasks);
      const overdue = getOverdueTasks(relevantTasks);

      if (atRisk.length === 0) {
        return {
          content: '✅ **Great news!** No tasks are currently at risk of missing their deadlines. All tasks are on track.',
          suggestions: ['Show team performance', 'View all tasks', 'Check department status'],
        };
      }

      const riskList = atRisk.slice(0, 5).map((task, i) => {
        const assignee = users.find(u => u.id === task.assigneeId);
        const isOverdue = overdue.some(t => t.id === task.id);
        return `${i + 1}. **${task.title}**
   - Status: ${getStatusLabel(task.status)} | Priority: ${getPriorityLabel(task.priority)}
   - Due: ${formatDate(task.dueDate)} ${isOverdue ? '⚠️ OVERDUE' : '⏰ Due Soon'}
   - Assigned to: ${assignee?.name || 'Unassigned'}`;
      }).join('\n\n');

      return {
        content: `🚨 **${atRisk.length} Tasks At Risk**

${riskList}

**Recommendations:**
• Consider reassigning overdue tasks or adjusting deadlines
• ${overdue.length > 0 ? `${overdue.length} tasks are already overdue and need immediate attention` : 'No tasks are overdue yet'}
• Focus on ${atRisk[0]?.priority === 'urgent' ? 'urgent' : 'high priority'} items first`,
        suggestions: ['Show overdue tasks only', 'Who should I reassign tasks to?', 'Generate risk report'],
      };
    }

    // Overdue tasks
    if (msg.includes('overdue')) {
      const relevantTasks = currentUser.role === 'employee'
        ? tasks.filter(t => t.assigneeId === currentUser.id)
        : tasks;
      const overdue = getOverdueTasks(relevantTasks);

      if (overdue.length === 0) {
        return {
          content: '✅ **No overdue tasks!** Everything is on schedule.',
          suggestions: ['Show at-risk tasks', 'View team performance'],
        };
      }

      const overdueList = overdue.slice(0, 5).map((task, i) => {
        const assignee = users.find(u => u.id === task.assigneeId);
        const daysOverdue = Math.floor((Date.now() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        return `${i + 1}. **${task.title}** - ${daysOverdue} day(s) overdue
   Assigned to: ${assignee?.name || 'Unassigned'} | Priority: ${getPriorityLabel(task.priority)}`;
      }).join('\n');

      return {
        content: `⚠️ **${overdue.length} Overdue Tasks**

${overdueList}

These tasks need immediate attention. Consider:
• Contacting assignees for status updates
• Adjusting deadlines if scope has changed
• Escalating critical items to management`,
        suggestions: ['Show task details', 'Who has the most overdue tasks?', 'Export overdue report'],
      };
    }

    // Performance summary
    if (msg.includes('performance') || msg.includes('summary') || msg.includes('team')) {
      const employees = users.filter(u => u.role === 'employee' && u.isActive);
      const overallRate = calculateCompletionRate(tasks);

      const empSummary = employees.map(emp => {
        const empTasks = tasks.filter(t => t.assigneeId === emp.id);
        const rate = calculateCompletionRate(empTasks);
        const overdue = getOverdueTasks(empTasks).length;
        return { name: emp.name, rate, total: empTasks.length, overdue };
      }).sort((a, b) => b.rate - a.rate);

      const topPerformer = empSummary[0];
      const needsAttention = empSummary.filter(e => e.rate < 50 || e.overdue > 0);

      return {
        content: `📊 **Team Performance Summary**

**Overall Completion Rate:** ${overallRate}%
**Active Projects:** ${projects.filter(p => p.status === 'active').length}
**Total Tasks:** ${tasks.length} (${tasks.filter(t => t.status === 'done').length} completed)

**Top Performer:** ${topPerformer?.name} (${topPerformer?.rate}% completion rate)

**Team Breakdown:**
${empSummary.map(e => `• ${e.name}: ${e.rate}% (${e.total} tasks${e.overdue > 0 ? `, ${e.overdue} overdue` : ''})`).join('\n')}

${needsAttention.length > 0 ? `\n⚠️ **Needs Attention:** ${needsAttention.map(e => e.name).join(', ')}` : '\n✅ All team members are performing well!'}`,
        suggestions: ['Show department breakdown', 'Who has the most workload?', 'Export performance report'],
      };
    }

    // Department analysis
    if (msg.includes('department') || msg.includes('dept')) {
      const depts = ['hr', 'operations', 'call_center', 'finance'];
      const deptStats = depts.map(dept => {
        const deptProjects = projects.filter(p => p.department === dept);
        const deptTasks = tasks.filter(t => deptProjects.some(p => p.id === t.projectId));
        const rate = calculateCompletionRate(deptTasks);
        const overdue = getOverdueTasks(deptTasks).length;
        return { name: getDepartmentLabel(dept as any), rate, total: deptTasks.length, overdue };
      }).sort((a, b) => a.rate - b.rate);

      const needsAttention = deptStats[0];
      const bestPerforming = deptStats[deptStats.length - 1];

      return {
        content: `🏢 **Department Analysis**

${deptStats.map(d => `**${d.name}**
• Completion Rate: ${d.rate}% | Tasks: ${d.total} | Overdue: ${d.overdue}`).join('\n\n')}

**Insights:**
• 🔴 **Needs Most Attention:** ${needsAttention.name} (${needsAttention.rate}% completion)
• 🟢 **Best Performing:** ${bestPerforming.name} (${bestPerforming.rate}% completion)
${deptStats.filter(d => d.overdue > 0).length > 0 ? `• ⚠️ Departments with overdue tasks: ${deptStats.filter(d => d.overdue > 0).map(d => d.name).join(', ')}` : '• ✅ No overdue tasks across departments'}`,
        suggestions: ['Show HR department details', 'Show Call Center performance', 'Compare departments'],
      };
    }

    // Workload analysis
    if (msg.includes('workload') || msg.includes('busy') || msg.includes('overloaded')) {
      const employees = users.filter(u => u.role === 'employee' && u.isActive);
      const workloads = employees.map(emp => {
        const empTasks = tasks.filter(t => t.assigneeId === emp.id && t.status !== 'done');
        return { name: emp.name, activeTasks: empTasks.length, urgent: empTasks.filter(t => t.priority === 'urgent').length };
      }).sort((a, b) => b.activeTasks - a.activeTasks);

      return {
        content: `⚖️ **Workload Distribution**

${workloads.map((w, i) => {
  const bar = '█'.repeat(Math.min(w.activeTasks, 10)) + '░'.repeat(Math.max(0, 10 - w.activeTasks));
  const status = w.activeTasks > 5 ? '🔴 High' : w.activeTasks > 3 ? '🟡 Medium' : '🟢 Light';
  return `${i + 1}. **${w.name}** ${status}
   ${bar} ${w.activeTasks} active tasks${w.urgent > 0 ? ` (${w.urgent} urgent)` : ''}`;
}).join('\n\n')}

**Recommendation:** ${workloads[0]?.activeTasks > 5 ? `Consider redistributing tasks from ${workloads[0].name} who has ${workloads[0].activeTasks} active tasks.` : 'Workload is fairly balanced across the team.'}`,
        suggestions: ['Suggest task redistribution', 'Show task details for top person', 'View all tasks'],
      };
    }

    // Default response
    return {
      content: `I understand you're asking about: "${userMessage}"

Here's what I can help you with:

• **Risk Analysis** - "Which tasks are at risk?"
• **Performance** - "Show team performance summary"
• **Workload** - "Who has the most workload?"
• **Departments** - "Which department needs attention?"
• **Task Creation** - "Create task: [title], due [date], [priority] priority"
• **Overdue Tasks** - "Show overdue tasks"

Try one of the quick prompts below or ask me anything about your team's work!`,
      suggestions: quickPrompts.slice(0, 3),
    };
  };

  const handleSend = async (message?: string) => {
    const userMessage = message || input.trim();
    if (!userMessage) return;

    const userMsg: Message = {
      id: generateId('msg'),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const response = generateAIResponse(userMessage);
    const aiMsg: Message = {
      id: generateId('msg'),
      role: 'assistant',
      content: response.content,
      timestamp: new Date().toISOString(),
      suggestions: response.suggestions,
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <AppLayout title="AI Assistant">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Digitrench AI Assistant</h2>
              <p className="text-indigo-200 text-sm">Powered by intelligent task analysis</p>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { icon: <AlertTriangle className="w-4 h-4" />, label: 'At Risk', value: getAtRiskTasks(tasks).length },
              { icon: <TrendingUp className="w-4 h-4" />, label: 'Completion', value: `${calculateCompletionRate(tasks)}%` },
              { icon: <Zap className="w-4 h-4" />, label: 'Active Tasks', value: tasks.filter(t => t.status === 'in_progress').length },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-indigo-200 mb-1">
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </div>
                <p className="text-xl font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                {/* Avatar */}
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  msg.role === 'assistant' ? 'bg-indigo-600' : 'bg-gray-200'
                )}>
                  {msg.role === 'assistant' ? (
                    <Bot className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-4 h-4 text-gray-600" />
                  )}
                </div>

                {/* Message */}
                <div className={cn('max-w-[80%]', msg.role === 'user' ? 'items-end' : 'items-start', 'flex flex-col gap-2')}>
                  <div className={cn(
                    'px-4 py-3 rounded-2xl text-sm leading-relaxed',
                    msg.role === 'assistant'
                      ? 'bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100'
                      : 'bg-indigo-600 text-white rounded-tr-sm'
                  )}>
                    <div
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  </div>

                  {/* Suggestions */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {msg.suggestions.map(suggestion => (
                        <button
                          key={suggestion}
                          onClick={() => handleSend(suggestion)}
                          className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 hover:bg-indigo-100 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">Quick prompts:</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="text-xs px-3 py-1.5 bg-white text-gray-700 rounded-full border border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask me anything about your tasks, team, or create a task..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isTyping}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
