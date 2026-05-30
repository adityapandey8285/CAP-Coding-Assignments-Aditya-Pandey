namespace platform.events;

type Email : String(100);
type Phone : String(15);
type Amount : Decimal(10,2);
type Rating : Integer;
type Name : String(100);
type URL : String(255);

type EventType : String enum {
  Conference;
  Workshop;
  Seminar;
  Webinar;
  Meetup;
}

type EventStatus : String enum {
  Draft;
  Published;
  Ongoing;
  Completed;
  Cancelled;
}

type TicketType : String enum {
  General;
  VIP;
  Student;
}

type RegistrationStatus : String enum {
  Confirmed;
  Cancelled;
  Waitlisted;
  Attended;
}

type VenueType : String enum {
  Auditorium;
  ConferenceHall;
  Outdoor;
  Virtual;
}

entity Venues {
  key ID : UUID;
  name : Name;
  address : String;
  city : String;
  capacity : Integer;
  type : VenueType;
  amenities : String;
  hourlyRate : Amount;
  contactPerson : String;
  phone : Phone;
  isActive : Boolean;
}

entity Events {
  key ID : UUID;
  title : String;
  description : String;
  eventType : EventType;
  venue_ID : UUID;
  startDate : Date;
  endDate : Date;
  startTime : Time;
  endTime : Time;
  maxAttendees : Integer;
  registeredCount : Integer default 0;
  ticketPrice : Amount;
  status : EventStatus default 'Draft';
  organizerName : String;
  organizerEmail : Email;
  tags : String;
}

entity Speakers {
  key ID : UUID;
  name : Name;
  email : Email;
  phone : Phone;
  bio : String;
  company : String;
  designation : String;
  expertise : String;
  photoUrl : URL;
  rating : Rating;
  totalTalks : Integer;
  isActive : Boolean;
}

entity EventSpeakers {
  key ID : UUID;
  event_ID : UUID;
  speaker_ID : UUID;
  topic : String;
  sessionTime : Time;
  sessionDuration : Integer;
  roomNumber : String;
}

entity Registrations {
  key ID : UUID;
  event_ID : UUID;
  attendeeName : Name;
  attendeeEmail : Email;
  attendeePhone : Phone;
  company : String;
  ticketType : TicketType;
  registrationDate : Date;
  status : RegistrationStatus default 'Confirmed';
  amountPaid : Amount;
  paymentId : String;
}

entity Feedback {
  key ID : UUID;
  event_ID : UUID;
  attendeeEmail : Email;
  overallRating : Rating;
  contentRating : Rating;
  venueRating : Rating;
  speakerRating : Rating;
  comment : String;
  submittedAt : Timestamp;
}