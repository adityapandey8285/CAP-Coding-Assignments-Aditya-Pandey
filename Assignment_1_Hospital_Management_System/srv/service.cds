using { hospital.management as hospital } from '../db/schema';

service HospitalService {
  entity Departments    as projection on hospital.Departments;
  entity Doctors        as projection on hospital.Doctors;
  entity Patients       as projection on hospital.Patients;
  entity Appointments   as projection on hospital.Appointments;
  entity MedicalRecords as projection on hospital.MedicalRecords;
}