Assignment from ashby: 

https://you.ashbyhq.com/broccoli/assignment/6b11e7a9-f3d0-4491-ae94-833010f0acf3 Assignment Multi-Skill Scheduling You are building a Calendly-style booking system for a home services company. 

The company offers 5 service categories: Plumbing HVAC Electrical Drains Roofing Customers visit a booking page, choose a service type, and want to see the next 5 available appointment slots. 

Each technician has: Working hours / shifts Calendar availability Service skills, meaning which types of jobs they are qualified to perform For example, one technician may be qualified for Plumbing and Drains, while another may be qualified for HVAC and Electrical. 

Part I: Prototype Task Prototype a scheduling product that lets a customer book an appointment for HVAC and shows the next 5 available times. Build 3 screens: 

-------------------------------------------------------------------------------- 

Settings: Technician Shifts Internal users configure each technician’s working hours. This screen should allow us to view and edit technician schedules, such as: Technician name 

Days worked Start and end time Breaks or unavailable blocks Skills/certifications, such as Plumbing, HVAC, Electrical, Drains, or Roofing 

-------------------------------------------------------------------------------- 

Calendar: Technician Calendars Internal users view or manage individual technician calendars. This screen should show each technician’s scheduled appointments, unavailable time, and open capacity. 

It should help a dispatcher understand: Which technicians are working Which technicians are already booked Which technicians are available for a given service type Whether a technician has the right skill for a job 

-------------------------------------------------------------------------------- 

Booking Page Customer-facing page where a homeowner selects a service type and sees the next 5 available appointment slots. 

For this prototype, the customer selects HVAC. 

The page should show available appointment times based on: Technician working hours 

Technician calendar availability Technician skills/certifications Existing booked appointments Any scheduling rules you think are important 

-------------------------------------------------------------------------------- 

Goal Prototype an auditable booking experience. 

For any requested date and service type, the system should show the next 5 available slots and explain why each slot is or is not available. 

Example: “Tuesday 3 PM is not available because the only HVAC-certified technician is already booked.” 

The system should make it clear how availability is determined, especially when there are multiple technicians with different skills and schedules. 

-------------------------------------------------------------------------------- 

Part II: Unassigned Jobs Let’s introduce a new concept: some appointments are unassigned. These are booked jobs that have not yet been assigned to a specific technician. 

How should unassigned appointments affect available capacity and booking decisions? For example: 

Should an unassigned HVAC job reduce HVAC availability? Should it hold capacity from any HVAC-certified technician? 

Should the dispatcher see warnings when unassigned jobs may consume future capacity? Design how the booking system should handle these cases. 

-------------------------------------------------------------------------------- 

Part III: AI Assistant (Stretch) Let’s introduce an AI Assistant that would let a dispatcher configure any piece of their scheduling logic via natural language. For example: 

Dave is out on Tuesdays for the next month Janet finished her plumbing certification Think about: What do we do with underspecified asks? Is every ask possible? 

Evaluation Product: We want to see how you think through, clarify, and understand your customer when building out products for them. Ask us anything about our customers that will help you build for them! 

System Architecture: Solid fundamentals along with ability to express ideas clearly and collaborate. Bonus points for agentic systems knowledge. 

Speed vs Quality: We ship products fast, and you won’t have a lot of time to build either. We want to see you get something functional, with good structural thinking, and not obviously broken or full of AI slop. Don’t worry too much about the final polish. 

Productionization: Performance, monitoring and reliability aren't important to discuss while designing, but not expected to be considered when prototyping. 

