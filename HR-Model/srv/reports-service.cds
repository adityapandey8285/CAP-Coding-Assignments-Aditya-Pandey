using { com.hr as db } from '../db/schema';

service ReportService @(path: '/reports') {
  entity TeamOverview as projection on db.TeamOverview;
  entity ProjectDashboard as projection on db.ProjectDashboard;
  entity SkillsMatrix as projection on db.SkillsMatrix;
}