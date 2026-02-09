export type BadgeTrigger =
  | "STREAK"
  | "TASKS_COMPLETED"
  | "TOPICS_COMPLETED"
  | "FIRST_TASK"
  | "FIRST_TOPIC"
  | "PERFECT_TASK"
  | "ADVANCED_TASK"
  | "RETRIES"
  | "SPEED"
  | "FRIENDS"
  | "MESSAGES"
  | "PROFILE"
  | "BUG"
  | "GOAL"
  | "CUSTOMIZE"
  | "IDEA";

export interface BadgeConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  trigger: BadgeTrigger;
  value?: number; // threshold (e.g. 10 tasks, 5-day streak)
}

/* =========================
   ALL BADGES DEFINED HERE
========================= */
export const BADGES: BadgeConfig[] = [
  // 🔥 STREAKS
  { id: "streak_3", title: "Streak Starter", description: "Reach a 3-day streak", icon: "🔥", trigger: "STREAK", value: 3 },
  { id: "streak_5", title: "Streak Champion", description: "Reach a 5-day streak", icon: "🔥", trigger: "STREAK", value: 5 },
  { id: "streak_10", title: "Streak Legend", description: "Reach a 10-day streak", icon: "🔥", trigger: "STREAK", value: 10 },
  { id: "streak_20", title: "Streak Master", description: "Reach a 20-day streak", icon: "🔥", trigger: "STREAK", value: 20 },
  { id: "streak_30", title: "Streak Immortal", description: "Reach a 30-day streak", icon: "🔥", trigger: "STREAK", value: 30 },
  { id: "streak_50", title: "Streak Marathoner", description: "Reach a 50-day streak", icon: "🔥", trigger: "STREAK", value: 50 },

  // ✔️ TASKS
  { id: "first_task", title: "First Step", description: "Complete your first task", icon: "✔️", trigger: "FIRST_TASK" },
  { id: "tasks_10", title: "Task Enthusiast", description: "Complete 10 tasks", icon: "✔️", trigger: "TASKS_COMPLETED", value: 10 },
  { id: "tasks_20", title: "Task Pro", description: "Complete 20 tasks", icon: "✔️", trigger: "TASKS_COMPLETED", value: 20 },

  // 📚 TOPICS
  { id: "first_topic", title: "Topic Newbie", description: "Complete your first topic", icon: "📚", trigger: "FIRST_TOPIC" },
  { id: "topics_3", title: "Topic Explorer", description: "Complete 3 topics", icon: "📚", trigger: "TOPICS_COMPLETED", value: 3 },
  { id: "topics_5", title: "Topic Conqueror", description: "Complete 5 topics", icon: "📚", trigger: "TOPICS_COMPLETED", value: 5 },

  // 🎉 FUN / BONUS
  { id: "welcome", title: "Welcome Aboard", description: "Register and set up your profile", icon: "🎉", trigger: "PROFILE" },
  { id: "bug_hunter", title: "Bug Hunter", description: "Report your first bug", icon: "🛠️", trigger: "BUG" },
  { id: "goal_setter", title: "Goal Setter", description: "Set and complete a goal", icon: "🎯", trigger: "GOAL" },
  { id: "customizer", title: "Customizer", description: "Personalize your profile", icon: "🎨", trigger: "CUSTOMIZE" },
  { id: "idea_generator", title: "Idea Generator", description: "Submit feedback or an idea", icon: "💡", trigger: "IDEA" },
];
