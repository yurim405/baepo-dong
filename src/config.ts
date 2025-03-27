import dotenv from "dotenv";

dotenv.config();

export const JIRA_BASE_URL = process.env.JIRA_BASE_URL || "";
export const JIRA_USER = process.env.JIRA_USER || "";
export const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || "";
export const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || "";
export const JIRA_PROJECT_ID = process.env.JIRA_PROJECT_ID || "";
