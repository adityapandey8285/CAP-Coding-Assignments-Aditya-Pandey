using { com.hr as db } from '../db/schema';

service HRService @(path: '/hr') {
  entity Departments as projection on db.Departments;
  entity Employees as projection on db.Employees;
  entity Projects as projection on db.Projects;
  entity Skills as projection on db.Skills;
  entity Assignments as projection on db.Assignments;
  entity EmployeeSkills as projection on db.EmployeeSkills;
}